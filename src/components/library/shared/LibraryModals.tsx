"use client";

import LibraryReviewModalCard from "@/components/media/LibraryReviewModalCard";
import BookProgressModal from "@/components/progress/BookProgressModal";

import {
  LoadingDialog,
  SeriesProgressDialog,
} from "../LibraryProgressDialog";

import { useLibraryProgress } from "../hooks/useLibraryProgress";
import { useLibraryReviews } from "../hooks/useLibraryReviews";
import { useLibraryRemoveDialog } from "../hooks/useLibraryRemoveDialog";
import LibraryRemoveDialog from "./LibraryRemoveDialog";

type Props = {
  progress: ReturnType<typeof useLibraryProgress>;
  reviews: ReturnType<typeof useLibraryReviews>;
  removal: ReturnType<typeof useLibraryRemoveDialog>;
};

/** Monta los modales existentes, sin replicar sus operaciones ni estados. */
export default function LibraryModals({
  progress,
  reviews,
  removal,
}: Props) {
  const item = progress.progressItem;
  const canShowProgress =
    !progress.progressLoading && !progress.progressError;

  return (
    <>
      {item &&
        (progress.progressLoading || progress.progressError) && (
          <LoadingDialog
            item={item}
            error={progress.progressError}
            onClose={progress.closeProgress}
          />
        )}

      {item?.mediaType === "BOOK" &&
        canShowProgress &&
        progress.bookData && (
          <BookProgressModal
            key={item.key}
            bookTitle={item.title}
            editions={progress.bookData.editions}
            initialEditionId={progress.bookData.editions[0]?.id ?? null}
            initialPages={Math.min(
              progress.bookData.saved?.pages_read ?? 0,
              progress.bookData.editions[0]?.pageCount ?? 0,
            )}
            onClose={progress.closeProgress}
            onSave={progress.saveBookProgress}
            onCompleted={() => {
              progress.closeProgress();
              reviews.openReview(item);
            }}
          />
        )}

      {item?.mediaType === "SERIES" &&
        canShowProgress &&
        progress.seriesData && (
          <SeriesProgressDialog
            item={item}
            data={progress.seriesData}
            onClose={progress.closeProgress}
          />
        )}

      {removal.item && (
        <LibraryRemoveDialog
          item={removal.item}
          removing={removal.removing}
          error={removal.error}
          onCancel={removal.cancelRemove}
          onConfirm={() => void removal.confirmRemove()}
        />
      )}

      {reviews.reviewItem && (
        <LibraryReviewModalCard
          mode="create"
          open
          mediaType={reviews.reviewItem.mediaType}
          title={reviews.reviewItem.title}
          releaseYear={reviews.reviewItem.releaseYear}
          coverUrl={reviews.reviewItem.coverUrl}
          initialRepeat={reviews.reviewItem.completedCount > 0}
          loading={reviews.reviewLoading}
          message={reviews.reviewMessage}
          onClose={reviews.closeReview}
          onSave={reviews.saveReview}
        />
      )}
    </>
  );
}