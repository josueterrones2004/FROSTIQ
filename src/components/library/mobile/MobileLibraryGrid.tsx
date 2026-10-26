"use client";

import { useEffect } from "react";
import { Library } from "lucide-react";

import {
  keyOf,
  type CompletedReview,
  type LibraryEntry,
  type View,
} from "../libraryShared";

import MobileLibraryPoster from "./MobileLibraryPoster";

export type MobileSelection = {
  item: LibraryEntry;
  review?: CompletedReview;
};

type Props = {
  entries: LibraryEntry[];
  filtered: LibraryEntry[];
  filteredReviews: CompletedReview[];
  reviewMap: Map<string, CompletedReview>;
  view: View;
  onOpen: (selection: MobileSelection) => void;
  onReset: () => void;
};

function entryForReview(
  review: CompletedReview,
  entries: LibraryEntry[],
): LibraryEntry {
  const record = entries.find(
    (entry) =>
      entry.mediaType === review.mediaType &&
      entry.externalId === review.review.external_id,
  );

  return {
    ...record,
    key: keyOf(
      review.mediaType,
      review.review.external_id,
    ),
    mediaType: review.mediaType,
    externalId: review.review.external_id,
    title: review.review.title,
    coverUrl:
      review.review.cover_url ??
      record?.coverUrl ??
      null,
    backdropUrl: record?.backdropUrl ?? null,
    releaseYear:
      review.review.release_year ??
      record?.releaseYear ??
      null,
    status: null,
    completedCount: Math.max(
      1,
      record?.completedCount ?? 0,
    ),
    updatedAt: review.createdAt,
    addedAt: record?.addedAt ?? review.createdAt,
    posterPositionX:
      review.review.cover_position_x ??
      record?.posterPositionX,
    posterPositionY:
      review.review.cover_position_y ??
      record?.posterPositionY,
    posterZoom:
      review.review.cover_zoom ??
      record?.posterZoom,
  };
}

export default function MobileLibraryGrid({
  entries,
  filtered,
  filteredReviews,
  reviewMap,
  view,
  onOpen,
  onReset,
}: Props) {
  useEffect(() => {
    const root = document.documentElement;

    root.classList.add(
      "frost-mobile-library-scrollless",
    );

    return () => {
      root.classList.remove(
        "frost-mobile-library-scrollless",
      );
    };
  }, []);

  const selections: MobileSelection[] =
    view === "COMPLETED"
      ? filteredReviews.map((review) => ({
          item: entryForReview(review, entries),
          review,
        }))
      : filtered.map((item) => ({
          item,
          review: reviewMap.get(item.key),
        }));

  const scrollbarStyles = (
    <style>{`
      @media (max-width: 899px) {
        html.frost-mobile-library-scrollless,
        html.frost-mobile-library-scrollless body {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        html.frost-mobile-library-scrollless::-webkit-scrollbar,
        html.frost-mobile-library-scrollless body::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      }
    `}</style>
  );

  if (selections.length === 0) {
    return (
      <>
        {scrollbarStyles}

        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-frost-border px-4 text-center">
          <Library
            size={27}
            className="text-frost-muted"
            aria-hidden="true"
          />

          <p className="mt-3 font-medium text-frost-text">
            No hay obras para mostrar
          </p>

          <button
            type="button"
            onClick={onReset}
            className="mt-4 rounded-lg border border-frost-accent/40 bg-frost-active px-4 py-2.5 text-sm text-frost-accent transition-colors hover:bg-frost-raised"
          >
            Restablecer filtros
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {scrollbarStyles}

      <div className="grid grid-cols-3 items-start gap-x-2.5 gap-y-5 frost-mobile-library-grid-columns sm:gap-x-3">
        {selections.map((selection, index) => (
          <MobileLibraryPoster
            key={
              selection.review
                ? `review:${selection.review.id}`
                : `${selection.item.key}:${index}`
            }
            item={selection.item}
          showStatus={view === "ALL" || view === "COMPLETED"}
            onOpen={() => onOpen(selection)}
          />
        ))}
      </div>
    </>
  );
}