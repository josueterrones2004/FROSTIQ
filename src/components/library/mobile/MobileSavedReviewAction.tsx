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

export default function MobileSavedReviewAction({
  review,
}: Props) {
  return (
    <div className="relative border-b border-frost-border/40" style={{ height: 58 }}>
      <div
        aria-hidden="true"
        className="flex h-full items-center gap-3 px-5 text-sm text-frost-text"
      >
        <Eye
          size={19}
          className="text-frost-muted"
        />

        <span className="min-w-0 flex-1">
          Ver review
        </span>

        <ChevronRight
          size={16}
          className="text-frost-muted"
        />
      </div>

      <div
        className="absolute inset-0 z-10 overflow-hidden opacity-0 focus-within:outline-2 focus-within:outline-frost-accent"
        style={{
          height: "100%",
        }}
      >
        <style>{`
          .frost-saved-review-action > div,
          .frost-saved-review-action > div > button {
            height: 100% !important;
            width: 100% !important;
          }
        `}</style>

        <div className="frost-saved-review-action h-full w-full">
          <LibraryReviewModalCard
            mode="saved"
            mediaType={review.mediaType}
            review={review.review}
          />
        </div>
      </div>
    </div>
  );
}