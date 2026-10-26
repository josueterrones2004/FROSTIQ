"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { useRouter } from "next/navigation";

import type {
  ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";

import {
  persistMediaReview,
} from "@/components/RegisterReviewModal";

import type {
  createClient,
} from "@/lib/supabase/client";

import type {
  LibraryEntry,
} from "../libraryShared";

type Supabase = ReturnType<typeof createClient>;

type Router = Pick<
  ReturnType<typeof useRouter>,
  "refresh"
>;

type Options = {
  supabase: Supabase;
  router: Router;
  setFeedback: Dispatch<
    SetStateAction<string | null>
  >;
};

export type ReviewTransition =
  | "idle"
  | "entering"
  | "active"
  | "exiting-cancel"
  | "exiting-save";

const REVIEW_TRANSITION_MS = 360;

export function useLibraryReviews({
  supabase,
  router,
  setFeedback,
}: Options) {
  const [reviewItem, setReviewItem] =
    useState<LibraryEntry | null>(null);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [reviewMessage, setReviewMessage] =
    useState("");

  const [reviewTransition, setReviewTransition] =
    useState<ReviewTransition>("idle");

  const transitionTimer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const transitionRef =
    useRef<ReviewTransition>("idle");

  const reviewItemRef =
    useRef<LibraryEntry | null>(null);

  const loadingRef = useRef(false);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimer.current !== null) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  }, []);

  const changeTransition = useCallback(
    (next: ReviewTransition) => {
      transitionRef.current = next;
      setReviewTransition(next);
    },
    [],
  );

  const finishTransition = useCallback(() => {
    clearTransitionTimer();

    reviewItemRef.current = null;
    setReviewItem(null);
    setReviewMessage("");

    changeTransition("idle");
  }, [
    clearTransitionTimer,
    changeTransition,
  ]);

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  const openReview = useCallback(
    (item: LibraryEntry) => {
      if (
        loadingRef.current ||
        transitionRef.current === "exiting-save" ||
        transitionRef.current === "exiting-cancel"
      ) {
        return;
      }

      clearTransitionTimer();

      reviewItemRef.current = item;

      setReviewMessage("");
      setReviewItem(item);

      changeTransition("entering");

      transitionTimer.current = setTimeout(() => {
        transitionTimer.current = null;
        changeTransition("active");
      }, REVIEW_TRANSITION_MS);
    },
    [
      clearTransitionTimer,
      changeTransition,
    ],
  );

  const closeReview = useCallback(() => {
    if (
      loadingRef.current ||
      !reviewItemRef.current ||
      transitionRef.current === "exiting-cancel" ||
      transitionRef.current === "exiting-save"
    ) {
      return;
    }

    clearTransitionTimer();

    changeTransition("exiting-cancel");

    transitionTimer.current = setTimeout(
      finishTransition,
      REVIEW_TRANSITION_MS,
    );
  }, [
    clearTransitionTimer,
    changeTransition,
    finishTransition,
  ]);

  async function saveReview(draft: ReviewDraft) {
    const item = reviewItemRef.current;

    if (
      !item ||
      loadingRef.current ||
      transitionRef.current === "exiting-save" ||
      transitionRef.current === "exiting-cancel"
    ) {
      return;
    }

    loadingRef.current = true;
    setReviewLoading(true);
    setReviewMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Debes iniciar sesión.");
      }

      const result = await persistMediaReview({
        supabase,
        userId: user.id,
        mediaType: item.mediaType,
        externalId: item.externalId,
        title: item.title,
        coverUrl: item.coverUrl,
        backdropUrl: item.backdropUrl ?? null,
        releaseYear: item.releaseYear,
        draft,
      });

      setFeedback(result.warning);

      clearTransitionTimer();

      // La review permanece montada durante
      // la animación de salida hacia la izquierda.
      changeTransition("exiting-save");

      transitionTimer.current = setTimeout(() => {
        finishTransition();

        // Actualizar los datos una vez finalizado
        // el movimiento, no mientras se anima.
        router.refresh();
      }, REVIEW_TRANSITION_MS);
    } catch (error) {
      // Si falla el guardado, la review sigue abierta
      // y conserva los datos introducidos.
      setReviewMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la review.",
      );

      if (
        transitionRef.current === "entering"
      ) {
        clearTransitionTimer();
        changeTransition("active");
      }
    } finally {
      loadingRef.current = false;
      setReviewLoading(false);
    }
  }

  return {
    reviewItem,
    reviewLoading,
    reviewMessage,
    reviewTransition,
    openReview,
    closeReview,
    saveReview,
  };
}