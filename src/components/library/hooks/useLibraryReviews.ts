"use client";

import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { useRouter } from "next/navigation";

import type { ReviewDraft } from "@/components/media/LibraryReviewModalCard";
import { persistMediaReview } from "@/components/RegisterReviewModal";
import type { createClient } from "@/lib/supabase/client";

import type { LibraryEntry } from "../libraryShared";

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

  const openReview = useCallback(
    (item: LibraryEntry) => {
      setReviewMessage("");
      setReviewItem(item);
    },
    [],
  );

  const closeReview = useCallback(() => {
    if (reviewLoading) return;

    setReviewItem(null);
    setReviewMessage("");
  }, [reviewLoading]);

  async function saveReview(draft: ReviewDraft) {
    if (!reviewItem || reviewLoading) {
      return;
    }

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
        mediaType: reviewItem.mediaType,
        externalId: reviewItem.externalId,
        title: reviewItem.title,
        coverUrl: reviewItem.coverUrl,
        backdropUrl: reviewItem.backdropUrl ?? null,
        releaseYear: reviewItem.releaseYear,
        draft,
      });

      setReviewItem(null);
      setFeedback(result.warning);

      router.refresh();
    } catch (error) {
      setReviewMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la review.",
      );
    } finally {
      setReviewLoading(false);
    }
  }

  return {
    reviewItem,
    reviewLoading,
    reviewMessage,
    openReview,
    closeReview,
    saveReview,
  };
}