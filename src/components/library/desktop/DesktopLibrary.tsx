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

/** Mantiene el layout de escritorio; el contenido central es compartido. */
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
    <div className="mx-auto w-full max-w-[1650px] pb-20">
      <header className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
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
        <aside className="hidden w-[210px] shrink-0 lg:block xl:w-[240px]">
          <div className="sticky top-[90px]">
            <div className="mb-7">{searchBar}</div>
            {filters}
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}