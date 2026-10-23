export const LIBRARY_PROGRESS_EVENT =
  "frostiq:library-progress-updated";

export type LibraryProgressChange = {
  mediaType: "SERIES" | "BOOK";
  externalId: string;
  updatedAt: string;
  nextEpisode?: string | null;
  pagesRead?: number;
  totalPages?: number;
};

export function announceLibraryProgress(
  change: LibraryProgressChange,
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<LibraryProgressChange>(
      LIBRARY_PROGRESS_EVENT,
      { detail: change },
    ),
  );
}