"use client";

import { useMemo } from "react";

import {
  bySort,
  keyOf,
  matches,
  normalize,
  type CompletedReview,
  type LibraryEntry,
  type LibraryMediaType,
  type Sort,
  type View,
} from "../libraryShared";

type Options = {
  entries: LibraryEntry[];
  completedReviews: CompletedReview[];
  types: LibraryMediaType[];
  view: View;
  search: string;
  sort: Sort;
};

/** Una sola selección de datos para escritorio y móvil. */
export function useLibraryCollection({
  entries,
  completedReviews,
  types,
  view,
  search,
  sort,
}: Options) {
  const normalizedSearch = useMemo(
    () => normalize(search),
    [search],
  );

  const reviewMap = useMemo(() => {
    const map = new Map<string, CompletedReview>();

    for (const review of completedReviews) {
      const key = keyOf(
        review.mediaType,
        review.review.external_id,
      );
      const previous = map.get(key);

      if (!previous || review.createdAt > previous.createdAt) {
        map.set(key, review);
      }
    }

    return map;
  }, [completedReviews]);

  const excluded = useMemo(
    () => new Set(
      entries
        .filter((entry) => entry.status === "DROPPED")
        .map((entry) => entry.key),
    ),
    [entries],
  );

  const recent = useMemo(
    () => entries.filter(
      (entry) =>
        types.includes(entry.mediaType) &&
        matches(entry, view) &&
        normalize(entry.title).includes(normalizedSearch),
    ),
    [entries, types, view, normalizedSearch],
  );

  const filtered = useMemo(
    () => [...recent].sort((a, b) => bySort(
      { title: a.title, date: a.updatedAt },
      { title: b.title, date: b.updatedAt },
      sort,
    )),
    [recent, sort],
  );

  const filteredReviews = useMemo(
    () => completedReviews
      .filter((review) =>
        !excluded.has(keyOf(
          review.mediaType,
          review.review.external_id,
        )) &&
        types.includes(review.mediaType) &&
        normalize(review.review.title).includes(normalizedSearch),
      )
      .sort((a, b) => bySort(
        { title: a.review.title, date: a.createdAt },
        { title: b.review.title, date: b.createdAt },
        sort,
      )),
    [completedReviews, excluded, types, normalizedSearch, sort],
  );

  return {
    reviewMap,
    recent,
    filtered,
    filteredReviews,
  };
}