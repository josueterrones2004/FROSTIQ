"use client";

import type { ReactNode } from "react";

import LibraryRecentCarousel from "../LibraryRecentCarousel";

import type {
  Actions,
  CompletedReview,
  LibraryEntry,
} from "../libraryShared";

type Props = {
  recent: LibraryEntry[];
  reviews: Map<string, CompletedReview>;
  actions: Actions;
  busy: boolean;
  filters: ReactNode;
  searchBar: ReactNode;
  children: ReactNode;
};

/**
 * Biblioteca de escritorio.
 * Mantiene la distribución original.
 * Paleta: FROSTIQ Cobalt Ink.
 */
export default function DesktopLibrary({
  recent,
  reviews,
  actions,
  busy,
  filters,
  searchBar,
  children,
}: Props) {
  return (
    <div
      className="mx-auto w-full pb-20 text-frost-text"
      style={{ maxWidth: 1650 }}
    >
      <header className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-frost-text sm:text-4xl">
          Tu biblioteca
        </h1>
      </header>

      <LibraryRecentCarousel
        entries={recent}
        reviews={reviews}
        actions={actions}
        busy={busy}
      />

      <div className="flex gap-9 xl:gap-12">
        <aside className="hidden w-52.5 shrink-0 lg:block xl:w-60">
          <div className="sticky top-22.5">
            <div className="mb-7">
              {searchBar}
            </div>

            {filters}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}