"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MediaKind = "game" | "movie" | "series" | "book";
export type SearchSource = "games" | "screen" | "books";

export type MediaSuggestion = {
  key: string;
  title: string;
  kind: MediaKind;
  image: string | null;
  year: number | null;
  subtitle: string;
  href: string;
  score: number;
};

type SourceResults = Record<SearchSource, MediaSuggestion[]>;

const SOURCES: SearchSource[] = ["games", "screen", "books"];
const RECENT_KEY = "media-tracker-recent-searches";

function emptyResults(): SourceResults {
  return { games: [], screen: [], books: [] };
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseRecent(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

function mergeSuggestions(
  groups: SourceResults,
  limit: number,
): MediaSuggestion[] {
  const items = SOURCES.flatMap((source) => groups[source]);
  const strongByKind = new Map<MediaKind, number>();

  for (const item of items) {
    if (item.score >= 95) {
      strongByKind.set(
        item.kind,
        (strongByKind.get(item.kind) ?? 0) + 1,
      );
    }
  }

  const seen = new Set<string>();

  return items
    .map((item) => ({
      item,
      ranking:
        item.score +
        Math.min((strongByKind.get(item.kind) ?? 0) * 4, 16),
    }))
    .sort((a, b) => b.ranking - a.ranking)
    .filter(({ item }) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export function getMediaKindLabel(kind: MediaKind): string {
  return {
    game: "Juego",
    movie: "Película",
    series: "Serie",
    book: "Libro",
  }[kind];
}

/**
 * Lógica compartida por los buscadores de escritorio y móvil.
 * No consulta nada con menos de dos caracteres o cuando enabled=false.
 */
export function useMediaSearch({
  enabled = true,
  initialQuery = "",
  limit = 8,
}: {
  enabled?: boolean;
  initialQuery?: string;
  limit?: number;
} = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [groups, setGroups] =
    useState<SourceResults>(emptyResults);
  const [resultsQuery, setResultsQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const cache = useRef(new Map<string, MediaSuggestion[]>());
  const requestId = useRef(0);

  useEffect(() => {
    const syncRecent = () => {
      setRecent(
        parseRecent(window.localStorage.getItem(RECENT_KEY)),
      );
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === RECENT_KEY) syncRecent();
    };

    const timeout = window.setTimeout(syncRecent, 0);

    window.addEventListener(
      "frostiq:recent-searches",
      syncRecent,
    );
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(
        "frostiq:recent-searches",
        syncRecent,
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const clean = query.trim();
    const id = ++requestId.current;
    const normalized = normalize(clean);

    if (!enabled || clean.length < 2) {
      const timeout = window.setTimeout(() => {
        if (id !== requestId.current) return;
        setGroups(emptyResults());
        setResultsQuery(normalized);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    const controllers = SOURCES.map(
      () => new AbortController(),
    );

    const timeout = window.setTimeout(() => {
      if (id !== requestId.current) return;

      const fromCache = emptyResults();
      const missing: SearchSource[] = [];

      for (const source of SOURCES) {
        const cached = cache.current.get(
          `${source}:${normalized}`,
        );

        if (cached) {
          fromCache[source] = cached;
        } else {
          missing.push(source);
        }
      }

      setGroups(fromCache);
      setResultsQuery(normalized);
      setLoading(missing.length > 0);

      let remaining = missing.length;

      for (const source of missing) {
        const controller =
          controllers[SOURCES.indexOf(source)];

        void fetch(
          `/api/search-suggestions?q=${encodeURIComponent(
            clean,
          )}&source=${source}`,
          { signal: controller.signal },
        )
          .then(async (response): Promise<MediaSuggestion[]> => {
            if (!response.ok) return [];

            const data: { results?: unknown } =
              await response.json();

            return Array.isArray(data.results)
              ? (data.results as MediaSuggestion[])
              : [];
          })
          .then((items) => {
            if (id !== requestId.current) return;

            cache.current.set(
              `${source}:${normalized}`,
              items,
            );

            setGroups((current) => ({
              ...current,
              [source]: items,
            }));
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) return;

            console.error(
              `Error buscando en ${source}:`,
              error,
            );
          })
          .finally(() => {
            if (id !== requestId.current) return;

            remaining -= 1;

            if (remaining === 0) {
              setLoading(false);
            }
          });
      }
    }, 100);

    return () => {
      window.clearTimeout(timeout);

      controllers.forEach((controller) =>
        controller.abort(),
      );
    };
  }, [enabled, query]);

  const suggestions = useMemo(
    () =>
      resultsQuery === normalize(query)
        ? mergeSuggestions(groups, limit)
        : [],
    [groups, query, resultsQuery, limit],
  );

  function updateRecent(next: string[]) {
    window.localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(next),
    );

    setRecent(next);

    window.dispatchEvent(
      new Event("frostiq:recent-searches"),
    );
  }

  function saveRecent(value: string) {
    const clean = value.trim();
    if (!clean) return;

    const stored = parseRecent(
      window.localStorage.getItem(RECENT_KEY),
    );

    updateRecent(
      [
        clean,
        ...stored.filter(
          (item) => normalize(item) !== normalize(clean),
        ),
      ].slice(0, 6),
    );
  }

  function removeRecent(value: string) {
    const stored = parseRecent(
      window.localStorage.getItem(RECENT_KEY),
    );

    updateRecent(
      stored.filter((item) => item !== value),
    );
  }

  return {
    query,
    setQuery,
    suggestions,
    loading:
      enabled &&
      (loading ||
        (query.trim().length >= 2 &&
          resultsQuery !== normalize(query))),
    recent,
    saveRecent,
    removeRecent,
  };
}