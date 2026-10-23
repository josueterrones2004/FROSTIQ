"use client";

import {
  ChevronRight,
  Eye,
} from "lucide-react";

import LibraryReviewModalCard from "@/components/media/LibraryReviewModalCard";

import type {
  CompletedReview,
} from "../libraryShared";

type Props = {
  review: CompletedReview;
};

/**
 * Reutiliza el botón original de LibraryReviewModalCard.
 * La presentación visible es la fila de acciones del móvil.
 * El modal y sus operaciones siguen siendo los existentes.
 */
export default function MobileSavedReviewAction({
  review,
}: Props) {
  return (
    <div className="relative h-[58px] border-b border-white/10">
      <div
        aria-hidden="true"
        className="flex h-full items-center gap-3 px-5 text-[14px] text-zinc-100"
      >
        <Eye
          size={19}
          className="text-zinc-400"
        />

        <span className="min-w-0 flex-1">
          Ver review
        </span>

        <ChevronRight
          size={16}
          className="text-zinc-500"
        />
      </div>

      <div className="absolute inset-0 z-10 overflow-hidden opacity-0 focus-within:outline focus-within:outline-2 focus-within:outline-violet-400 [&>div]:h-full [&>div>button]:!h-full [&>div>button]:!w-full">
        <LibraryReviewModalCard
          mode="saved"
          mediaType={review.mediaType}
          review={review.review}
        />
      </div>
    </div>
  );
}