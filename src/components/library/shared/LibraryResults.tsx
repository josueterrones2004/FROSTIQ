"use client";

import { Library } from "lucide-react";

import {
  LibraryPoster,
  ReviewPoster,
} from "../LibraryPosters";

import {
  countLabel,
  type Actions,
  type CompletedReview,
  type LibraryEntry,
  type LibraryMediaType,
  type View,
} from "../libraryShared";

type Props = {
  filtered: LibraryEntry[];
  filteredReviews: CompletedReview[];
  reviewMap: Map<string, CompletedReview>;
  recentCount: number;
  types: LibraryMediaType[];
  view: View;
  actions: Actions;
  busy: boolean;
  feedback: string | null;
  onReset: () => void;
};

/** Una sola cuadrícula: no montamos dos listas ocultas para móvil y PC. */
export default function LibraryResults({
  filtered,
  filteredReviews,
  reviewMap,
  recentCount,
  types,
  view,
  actions,
  busy,
  feedback,
  onReset,
}: Props) {
  const count =
    view === "COMPLETED"
      ? filteredReviews.length
      : filtered.length;

  return (
    <>
      {/* CONTADOR */}

      <div className="mb-7 border-b border-frost-border pb-5">
        <h2
          aria-live="polite"
          className="text-lg font-semibold text-frost-text sm:text-xl"
        >
          {countLabel(count, view, types)}
        </h2>
      </div>

      {/* MENSAJES */}

      {feedback && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-frost-warning/20 bg-frost-warning/5 px-4 py-3 text-sm text-frost-warning"
        >
          {feedback}
        </p>
      )}

      {/* CUADRÍCULA ORIGINAL */}

      {count > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {view === "COMPLETED"
            ? filteredReviews.map((review) => (
                <ReviewPoster
                  key={review.id}
                  item={review}
                />
              ))
            : filtered.map((entry, index) => (
                <LibraryPoster
                  key={entry.key}
                  item={entry}
                  view={view}
                  review={reviewMap.get(entry.key)}
                  actions={actions}
                  busy={busy}
                  eager={
                    index <
                    (recentCount > 0 ? 2 : 4)
                  }
                />
              ))}
        </div>
      ) : (
        /* ESTADO VACÍO */

        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-frost-border px-6 text-center">
          <Library
            size={28}
            className="text-frost-muted"
          />

          <h3 className="mt-4 text-lg font-medium text-frost-text">
            No hay obras para mostrar
          </h3>

          <button
            type="button"
            onClick={onReset}
            className="mt-5 rounded-lg border border-frost-border px-4 py-2 text-sm text-frost-text transition-colors hover:border-frost-accent/40 hover:bg-frost-active"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </>
  );
}