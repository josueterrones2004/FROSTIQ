"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { useRouter } from "next/navigation";

import type { BookReadingProgress } from "@/components/progress/BookProgressModal";
import type { createClient } from "@/lib/supabase/client";
import { announceLibraryProgress } from "@/lib/library-progress-events";

import type {
  BookPagesResponse,
  BookState,
  LibraryEntry,
  SeriesSeasonsResponse,
  StoredBookProgress,
} from "../libraryShared";

type Supabase = ReturnType<typeof createClient>;

type Router = Pick<
  ReturnType<typeof useRouter>,
  "refresh"
>;

type Options = {
  supabase: Supabase;
  router: Router;
  onCompleted: (item: LibraryEntry) => void;
};

async function readJson<T>(
  response: Response,
  endpoint: string,
): Promise<T> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      response.status === 404
        ? `La ruta ${endpoint} no existe (404).`
        : `La ruta ${endpoint} no devolvió JSON (HTTP ${response.status}).`,
    );
  }

  let data: T & { error?: string };

  try {
    data = (await response.json()) as T & {
      error?: string;
    };
  } catch {
    throw new Error(
      `La ruta ${endpoint} devolvió JSON inválido.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ??
        `Error HTTP ${response.status}.`,
    );
  }

  return data;
}

export function useLibraryProgress({
  supabase,
  router,
  onCompleted,
}: Options) {
  const [progressItem, setProgressItem] =
    useState<LibraryEntry | null>(null);

  const [progressLoading, setProgressLoading] =
    useState(false);

  const [progressError, setProgressError] =
    useState<string | null>(null);

  const [bookData, setBookData] =
    useState<BookState | null>(null);

  const [seriesData, setSeriesData] =
    useState<SeriesSeasonsResponse | null>(null);

  const request =
    useRef<AbortController | null>(null);

  const bookCache =
    useRef(new Map<string, BookState>());

  const seriesCache =
    useRef(
      new Map<string, SeriesSeasonsResponse>(),
    );

  const closeProgress = useCallback(() => {
    request.current?.abort();
    request.current = null;

    setProgressItem(null);
    setProgressLoading(false);
    setProgressError(null);
    setBookData(null);
    setSeriesData(null);
  }, []);

  useEffect(() => {
    return () => {
      request.current?.abort();
    };
  }, []);

  /* CERRAR SEGUIMIENTO DE SERIES CON ESC */

  useEffect(() => {
    if (
      progressItem?.mediaType !== "SERIES" ||
      progressLoading
    ) {
      return;
    }

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProgress();
      }
    };

    window.addEventListener("keydown", escape);

    return () =>
      window.removeEventListener(
        "keydown",
        escape,
      );
  }, [
    progressItem,
    progressLoading,
    closeProgress,
  ]);

  /* ABRIR REVIEW AL COMPLETAR UNA SERIE */

  useEffect(() => {
    const complete = (event: Event) => {
      if (progressItem?.mediaType !== "SERIES") {
        return;
      }

      const detail = (
        event as CustomEvent<{ seriesId: number }>
      ).detail;

      if (
        Number(progressItem.externalId) !==
        detail?.seriesId
      ) {
        return;
      }

      const item = progressItem;

      closeProgress();
      onCompleted(item);
    };

    window.addEventListener(
      "series-completed",
      complete,
    );

    return () =>
      window.removeEventListener(
        "series-completed",
        complete,
      );
  }, [
    progressItem,
    closeProgress,
    onCompleted,
  ]);

  /* ABRIR PROGRESO BAJO DEMANDA */

  async function openProgress(
    item: LibraryEntry,
  ) {
    if (
      item.mediaType !== "BOOK" &&
      item.mediaType !== "SERIES"
    ) {
      return;
    }

    closeProgress();

    setProgressItem(item);
    setProgressError(null);

    if (item.mediaType === "BOOK") {
      const cached = bookCache.current.get(
        item.externalId,
      );

      if (cached) {
        setBookData(cached);
        return;
      }
    } else {
      const cached = seriesCache.current.get(
        item.externalId,
      );

      if (cached) {
        setSeriesData(cached);
        return;
      }
    }

    const controller =
      new AbortController();

    request.current = controller;
    setProgressLoading(true);

    try {
      if (item.mediaType === "SERIES") {
        const endpoint =
          `/api/series/${encodeURIComponent(
            item.externalId,
          )}/seasons`;

        const response = await fetch(
          endpoint,
          {
            signal: controller.signal,
          },
        );

        const data =
          await readJson<SeriesSeasonsResponse>(
            response,
            endpoint,
          );

        if (!Array.isArray(data.seasons)) {
          throw new Error(
            "No se recibieron temporadas válidas.",
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        seriesCache.current.set(
          item.externalId,
          data,
        );

        setSeriesData(data);
      } else {
        const endpoint =
          `/api/books/${encodeURIComponent(
            item.externalId,
          )}/editions`;

        const [response, auth] =
          await Promise.all([
            fetch(endpoint, {
              signal: controller.signal,
            }),
            supabase.auth.getUser(),
          ]);

        if (
          auth.error ||
          !auth.data.user
        ) {
          throw new Error(
            "Debes iniciar sesión.",
          );
        }

        const pages =
          await readJson<BookPagesResponse>(
            response,
            endpoint,
          );

        if (!Array.isArray(pages.editions)) {
          throw new Error(
            "No se recibieron ediciones válidas.",
          );
        }

        const {
          data: saved,
          error,
        } = await supabase
          .from("book_reading_progress")
          .select(
            "work_id,edition_id,pages_read,total_pages",
          )
          .eq(
            "user_id",
            auth.data.user.id,
          )
          .eq(
            "work_id",
            item.externalId,
          )
          .maybeSingle();

        if (error) throw error;

        if (controller.signal.aborted) {
          return;
        }

        const data: BookState = {
          editions: pages.editions.slice(0, 1),
          saved: saved as StoredBookProgress | null,
        };

        bookCache.current.set(
          item.externalId,
          data,
        );

        setBookData(data);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setProgressError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el progreso.",
        );
      }
    } finally {
      if (
        !controller.signal.aborted &&
        request.current === controller
      ) {
        request.current = null;
        setProgressLoading(false);
      }
    }
  }

  /* GUARDAR AVANCE DE LIBROS */

  async function saveBookProgress(
    progress: BookReadingProgress,
  ) {
    const item = progressItem;

    if (item?.mediaType !== "BOOK") {
      throw new Error(
        "No hay un libro seleccionado.",
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(
        "Debes iniciar sesión.",
      );
    }

    const updatedAt = new Date().toISOString();

    // 1. Persistir el progreso real.

    const { error } = await supabase
      .from("book_reading_progress")
      .upsert(
        {
          user_id: user.id,
          work_id: item.externalId,
          edition_id: progress.editionId,
          pages_read: progress.pagesRead,
          total_pages: progress.totalPages,
          updated_at: updatedAt,
        },
        {
          onConflict: "user_id,work_id",
        },
      );

    if (error) {
      throw new Error(
        `No se pudo guardar la lectura: ${error.message}`,
      );
    }

    // 2. Actualizar la fecha de actividad de la obra.
    // No modifica el estado ni crea una review.

    const { error: timestampError } =
      await supabase
        .from("library_items")
        .update({
          updated_at: updatedAt,
        })
        .eq("user_id", user.id)
        .eq("media_type", "BOOK")
        .eq("external_id", item.externalId);

    if (timestampError) {
      console.error(
        "Progreso guardado, pero no se pudo actualizar la fecha de biblioteca:",
        timestampError,
      );
    }

    // 3. Actualizar el caché del modal.

    const saved: StoredBookProgress = {
      work_id: item.externalId,
      edition_id: progress.editionId,
      pages_read: progress.pagesRead,
      total_pages: progress.totalPages,
    };

    const previous =
      bookCache.current.get(item.externalId) ??
      bookData;

    if (previous) {
      const next: BookState = {
        ...previous,
        saved,
      };

      bookCache.current.set(
        item.externalId,
        next,
      );

      setBookData(next);
    }

    // 4. Actualizar INMEDIATAMENTE la tarjeta y el orden.

    announceLibraryProgress({
      mediaType: "BOOK",
      externalId: item.externalId,
      updatedAt,
      pagesRead: progress.pagesRead,
      totalPages: progress.totalPages,
    });

    // 5. Sincronizar los datos del servidor.

    router.refresh();
  }

  return {
    progressItem,
    progressLoading,
    progressError,
    bookData,
    seriesData,
    openProgress,
    closeProgress,
    saveBookProgress,
  };
}