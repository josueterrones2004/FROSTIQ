"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  persistMediaReview,
} from "@/components/RegisterReviewModal";
import LibraryReviewModalCard, {
  type ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";
import MediaActionBar from "@/components/media/MediaActionBar";
import { createClient } from "@/lib/supabase/client";

interface BookActionsProps {
  book: {
    id: string;
    title: string;
    coverUrl: string | null;
    authors: string[];
  };
}

type BookStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DROPPED";

function isBookStatus(
  value: string,
): value is BookStatus {
  return (
    value === "PENDING" ||
    value === "IN_PROGRESS" ||
    value === "DROPPED"
  );
}

export default function BookActions({
  book,
}: BookActionsProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [status, setStatus] =
    useState<BookStatus | null>(null);
  const [hasReadBefore, setHasReadBefore] =
    useState(false);
  const [showReview, setShowReview] =
    useState(false);
  const [isReread, setIsReread] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const [libraryResult, reviewResult] =
          await Promise.all([
            supabase
              .from("library_items")
              .select("status")
              .eq("user_id", user.id)
              .eq("media_type", "BOOK")
              .eq("external_id", book.id)
              .maybeSingle(),

            supabase
              .from("reviews")
              .select("id")
              .eq("user_id", user.id)
              .eq("media_type", "BOOK")
              .eq("external_id", book.id)
              .limit(1),
          ]);

        if (libraryResult.error) {
          console.error(
            "Error loading book status:",
            libraryResult.error,
          );
        }

        if (reviewResult.error) {
          console.error(
            "Error loading book reviews:",
            reviewResult.error,
          );
        }

        if (cancelled) return;

        const loadedStatus =
          libraryResult.data?.status;

        setStatus(
          loadedStatus === "PENDING" ||
          loadedStatus === "IN_PROGRESS" ||
          loadedStatus === "DROPPED"
            ? loadedStatus
            : null,
        );

        setHasReadBefore(
          Boolean(reviewResult.data?.length),
        );
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [book.id, supabase]);

  function getBookData(userId: string) {
    return {
      user_id: userId,
      media_type: "BOOK",
      external_id: book.id,
      title: book.title,
      original_title: null,
      cover_url: book.coverUrl,
      backdrop_url: null,
      release_year: null,
    };
  }

  async function clearPendingActivity(userId: string) {
    const { error } = await supabase
      .from("activity_events")
      .delete()
      .eq("user_id", userId)
      .eq("media_type", "BOOK")
      .eq("external_id", book.id)
      .eq("activity_type", "ADDED_PENDING");

    if (error) {
      console.error(
        "Error clearing book pending activity:",
        error,
      );
    }
  }

  async function createLibraryActivity(
    userId: string,
    activityType: "STARTED" | "ADDED_PENDING",
  ) {
    const { error } = await supabase
      .from("activity_events")
      .insert({
        user_id: userId,
        activity_type: activityType,
        media_type: "BOOK",
        external_id: book.id,
        title: book.title,
        cover_url: book.coverUrl,
      });

    if (error) {
      console.error(
        "Error creating book activity:",
        error,
      );
    }
  }

  async function setLibraryStatus(
    newStatus: BookStatus | null,
  ) {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      if (newStatus === null) {
        const { error } = await supabase
          .from("library_items")
          .delete()
          .eq("user_id", user.id)
          .eq("media_type", "BOOK")
          .eq("external_id", book.id);

        if (error) {
          setMessage(error.message);
          return;
        }

        await clearPendingActivity(user.id);

        setStatus(null);
        setMessage(
          "Libro quitado de tu estado activo.",
        );
        router.refresh();
        return;
      }

      const { error } = await supabase
        .from("library_items")
        .upsert(
          {
            ...getBookData(user.id),
            status: newStatus,
          },
          {
            onConflict:
              "user_id,media_type,external_id",
          },
        );

      if (error) {
        setMessage(error.message);
        return;
      }

      await clearPendingActivity(user.id);

      if (newStatus === "IN_PROGRESS") {
        await createLibraryActivity(
          user.id,
          "STARTED",
        );
      }

      if (newStatus === "PENDING") {
        await createLibraryActivity(
          user.id,
          "ADDED_PENDING",
        );
      }

      setStatus(newStatus);

      if (newStatus === "IN_PROGRESS") {
        setMessage(
          hasReadBefore
            ? "Relectura iniciada."
            : "Libro marcado como leyendo.",
        );
      } else if (newStatus === "PENDING") {
        setMessage("Libro añadido a pendientes.");
      } else {
        setMessage("Libro marcado como abandonado.");
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Error changing book status:",
        error,
      );
      setMessage(
        "No se pudo actualizar el libro.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function openReadModal() {
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("media_type", "BOOK")
        .eq("external_id", book.id)
        .limit(1);

      if (error) {
        console.error(
          "Error checking book reviews:",
          error,
        );
        setMessage(
          "No se pudo consultar el historial.",
        );
        return;
      }

      setIsReread(Boolean(data?.length));
      setShowReview(true);
    } catch (error) {
      console.error(
        "Error opening book review:",
        error,
      );
      setMessage(
        "No se pudo abrir la review.",
      );
    }
  }

  async function saveReview(draft: ReviewDraft) {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      const result = await persistMediaReview({
        supabase,
        userId: user.id,
        mediaType: "BOOK",
        externalId: book.id,
        title: book.title,
        coverUrl: book.coverUrl,
        backdropUrl: null,
        releaseYear: null,
        draft,
      });

      // Al terminar la lectura, deja de estar
      // en En progreso. Los completados anteriores
      // permanecen en la tabla reviews.
      if (result.statusCleared) {
        setStatus(null);
      }

      setHasReadBefore(true);
      setShowReview(false);

      setMessage(
        result.warning ??
          (draft.isRepeat
            ? "Relectura guardada."
            : "Libro marcado como leído."),
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error saving book review:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la review.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6">
        <MediaActionBar
          primaryLabel={
            hasReadBefore
              ? "Registrar relectura"
              : "Marcar como leído"
          }
          onPrimaryAction={openReadModal}
          primaryDisabled={loading}
          activeStatus={status}
          statusDisabled={loading}
          statusOptions={[
            {
              value: "IN_PROGRESS",
              label: "Leyendo",
            },
            {
              value: "PENDING",
              label: "Pendiente",
            },
          ]}
          onStatusChange={(newStatus) => {
            if (newStatus === null) {
              return setLibraryStatus(null);
            }

            if (!isBookStatus(newStatus)) {
              return;
            }

            return setLibraryStatus(newStatus);
          }}
          message={message}
        />
      </div>

      <LibraryReviewModalCard
        mode="create"
        open={showReview}
        mediaType="BOOK"
        title={book.title}
        coverUrl={book.coverUrl}
        initialRepeat={isReread}
        loading={loading}
        message={message}
        onClose={() => {
          if (!loading) {
            setShowReview(false);
            setMessage("");
          }
        }}
        onSave={saveReview}
      />
    </>
  );
}