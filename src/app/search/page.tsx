import {
  ChevronRight,
  ImageOff,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import SearchFilters, {
  type MediaFilter,
  type SortMode,
} from "@/components/SearchFilters";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  getMediaArtworkMapKey,
  getMixedMediaArtworkOverrides,
  type DatabaseMediaType,
  type MediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  normalizeSearchText,
  searchAllMedia,
  type SearchKind,
  type UnifiedSearchResult,
} from "@/lib/search-engine";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sort?: string;
    image?: string;
    limit?: string;
  }>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

function toDatabaseMediaType(
  kind: SearchKind,
): DatabaseMediaType {
  if (kind === "movie") {
    return "MOVIE";
  }

  if (kind === "series") {
    return "SERIES";
  }

  if (kind === "game") {
    return "GAME";
  }

  return "BOOK";
}

function getKindLabel(kind: SearchKind) {
  if (kind === "game") {
    return "Juego";
  }

  if (kind === "movie") {
    return "Película";
  }

  if (kind === "series") {
    return "Serie";
  }

  return "Libro";
}

function getTypeLabel(
  result: UnifiedSearchResult,
): string {
  if (result.kind === "book") {
    return result.subtitle ?? "Lectura";
  }

  const base = getKindLabel(result.kind);

  if (
    !result.subtitle ||
    result.subtitle === base
  ) {
    return base;
  }

  if (result.kind === "game") {
    return result.subtitle;
  }

  return `${base} · ${result.subtitle}`;
}

function getUsefulAlias(
  result: UnifiedSearchResult,
  query: string,
) {
  if (result.aliases.length === 0) {
    return null;
  }

  const normalizedQuery =
    normalizeSearchText(query);

  const normalizedTitle =
    normalizeSearchText(result.title);

  for (const alias of result.aliases) {
    const normalizedAlias =
      normalizeSearchText(alias);

    if (
      !normalizedAlias ||
      normalizedAlias === normalizedTitle
    ) {
      continue;
    }

    if (
      normalizedAlias.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedAlias)
    ) {
      return alias;
    }
  }

  return null;
}

function sortResults(
  results: UnifiedSearchResult[],
  sort: SortMode,
) {
  const copy = [...results];

  if (sort === "newest") {
    return copy.sort((first, second) => {
      if (first.year === null) {
        return 1;
      }

      if (second.year === null) {
        return -1;
      }

      return second.year - first.year;
    });
  }

  if (sort === "oldest") {
    return copy.sort((first, second) => {
      if (first.year === null) {
        return 1;
      }

      if (second.year === null) {
        return -1;
      }

      return first.year - second.year;
    });
  }

  if (sort === "az") {
    return copy.sort((first, second) =>
      first.title.localeCompare(
        second.title,
        "es",
        {
          sensitivity: "base",
        },
      ),
    );
  }

  return copy.sort(
    (first, second) =>
      second.score - first.score,
  );
}

function buildSearchHref({
  query,
  type,
  sort,
  onlyWithImage,
  limit,
}: {
  query: string;
  type: MediaFilter;
  sort: SortMode;
  onlyWithImage: boolean;
  limit: number;
}) {
  const params = new URLSearchParams();

  params.set("q", query);

  if (type !== "all") {
    params.set("type", type);
  }

  if (sort !== "relevance") {
    params.set("sort", sort);
  }

  if (onlyWithImage) {
    params.set("image", "with");
  }

  if (limit > DEFAULT_LIMIT) {
    params.set("limit", String(limit));
  }

  return `/search?${params.toString()}`;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim();

  if (!query) {
    return (
      <main
        className="mx-auto pb-24"
        style={{ maxWidth: 1280 }}
      >
        <section className="border-b border-frost-border pb-6">
          <p
            className="font-semibold uppercase text-frost-muted"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
            }}
          >
            Búsqueda
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-frost-text">
            Busca algo
          </h1>

          <p className="mt-2 text-sm text-frost-muted">
            Escribe una película, serie, juego o libro en la barra superior.
          </p>
        </section>
      </main>
    );
  }

  const type: MediaFilter =
    params.type === "game" ||
    params.type === "movie" ||
    params.type === "series" ||
    params.type === "book" ||
    params.type === "manga" ||
    params.type === "comic"
      ? params.type
      : "all";

  const sort: SortMode =
    params.sort === "newest" ||
    params.sort === "oldest" ||
    params.sort === "az"
      ? params.sort
      : "relevance";

  const onlyWithImage =
    params.image === "with";

  const requestedLimit = Number(
    params.limit ?? DEFAULT_LIMIT,
  );

  const limit = Number.isFinite(
    requestedLimit,
  )
    ? Math.min(
        MAX_LIMIT,
        Math.max(
          DEFAULT_LIMIT,
          requestedLimit,
        ),
      )
    : DEFAULT_LIMIT;

  /* SEARCH */

  const allResults =
    await searchAllMedia(query);

  /* GLOBAL ARTWORK OVERRIDES */

  const artworkOverrides =
    await getMixedMediaArtworkOverrides(
      allResults.map((result) => ({
        media_type: toDatabaseMediaType(
          result.kind,
        ),
        external_id: result.externalId,
      })),
    );

  /* COUNTS */

  const counts = {
    all: allResults.length,

    game: allResults.filter(
      (result) => result.kind === "game",
    ).length,

    movie: allResults.filter(
      (result) => result.kind === "movie",
    ).length,

    series: allResults.filter(
      (result) => result.kind === "series",
    ).length,

    book: allResults.filter(
      (result) =>
        result.kind === "book" &&
        result.bookFormat !== "MANGA" &&
        result.bookFormat !== "COMIC",
    ).length,

    manga: allResults.filter(
      (result) =>
        result.kind === "book" &&
        result.bookFormat === "MANGA",
    ).length,

    comic: allResults.filter(
      (result) =>
        result.kind === "book" &&
        result.bookFormat === "COMIC",
    ).length,
  };

  /* FILTER */

  let filteredResults = allResults.filter(
    (result) => {
      if (type === "all") {
        return true;
      }

      if (type === "manga") {
        return (
          result.kind === "book" &&
          result.bookFormat === "MANGA"
        );
      }

      if (type === "comic") {
        return (
          result.kind === "book" &&
          result.bookFormat === "COMIC"
        );
      }

      if (type === "book") {
        return (
          result.kind === "book" &&
          result.bookFormat !== "MANGA" &&
          result.bookFormat !== "COMIC"
        );
      }

      return result.kind === type;
    },
  );

  if (onlyWithImage) {
    filteredResults = filteredResults.filter(
      (result) => {
        const override = artworkOverrides.get(
          getMediaArtworkMapKey(
            toDatabaseMediaType(result.kind),
            result.externalId,
          ),
        );

        return Boolean(
          override?.poster_url ??
            result.image,
        );
      },
    );
  }

  /* SORT */

  const sortedResults = sortResults(
    filteredResults,
    sort,
  );

  /* LIMIT */

  const visibleResults = sortedResults.slice(
    0,
    limit,
  );

  const hasMore =
    sortedResults.length >
    visibleResults.length;

  const nextLimit = Math.min(
    MAX_LIMIT,
    limit + 20,
  );

  const moreHref = buildSearchHref({
    query,
    type,
    sort,
    onlyWithImage,
    limit: nextLimit,
  });

  return (
    <main
      className="mx-auto pb-24"
      style={{ maxWidth: 1280 }}
    >
      <style>{`
        @media (min-width: 640px) {
          .frost-search-heading {
            font-size: 28px;
          }
        }

        @media (min-width: 1024px) {
          .frost-search-results-layout {
            grid-template-columns: minmax(0, 1fr) 250px;
          }
        }
      `}</style>

      {/* DISCREET HEADER */}

      <section className="border-b border-frost-border pb-5">
        <p
          className="font-medium uppercase text-frost-muted"
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
          }}
        >
          Resultados para
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="frost-search-heading text-2xl font-semibold tracking-tight text-frost-text">
            “{query}”
          </h1>

          <span className="text-sm text-frost-muted">
            {filteredResults.length}{" "}
            {filteredResults.length === 1
              ? "coincidencia"
              : "coincidencias"}
          </span>
        </div>
      </section>

      {/* CONTENT */}

      <div className="frost-search-results-layout mt-6 grid items-start gap-12">
        {/* RESULTS */}

        <div className="min-w-0">
          {visibleResults.length === 0 ? (
            <div className="border-t border-frost-border py-14">
              <p className="text-sm text-frost-muted">
                No encontramos resultados con estos filtros.
              </p>

              <p className="mt-2 text-sm text-frost-muted">
                Prueba otro tipo de contenido o permite resultados sin portada.
              </p>
            </div>
          ) : (
            <section>
              <div className="border-t border-frost-border">
                {visibleResults.map((result) => {
                  const artworkOverride =
                    artworkOverrides.get(
                      getMediaArtworkMapKey(
                        toDatabaseMediaType(
                          result.kind,
                        ),
                        result.externalId,
                      ),
                    ) ?? null;

                  return (
                    <ResultRow
                      key={result.key}
                      result={result}
                      query={query}
                      artworkOverride={
                        artworkOverride
                      }
                    />
                  );
                })}
              </div>

              {/* LOAD MORE */}

              {hasMore && (
                <div className="pt-7">
                  <Link
                    href={moreHref}
                    className="inline-flex items-center gap-2 rounded-lg border border-frost-border px-4 py-2.5 text-sm font-medium text-frost-muted transition-colors hover:border-frost-accent/40 hover:bg-frost-surface hover:text-frost-text"
                  >
                    Mostrar más resultados

                    <ChevronRight size={15} />
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>

        {/* FILTERS */}

        <SearchFilters
          query={query}
          type={type}
          sort={sort}
          onlyWithImage={onlyWithImage}
          counts={counts}
        />
      </div>
    </main>
  );
}

/* RESULT ROW */

function ResultRow({
  result,
  query,
  artworkOverride,
}: {
  result: UnifiedSearchResult;
  query: string;
  artworkOverride: MediaArtworkOverride | null;
}) {
  const alias = getUsefulAlias(
    result,
    query,
  );

  return (
    <Link
      href={result.href}
      className="group flex gap-4 border-b border-frost-border py-4 transition-colors hover:bg-frost-surface/20 sm:gap-5 sm:py-5"
    >
      <ResultCover
        result={result}
        artworkOverride={artworkOverride}
      />

      {/* INFORMATION */}

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h2 className="text-base font-semibold leading-snug text-frost-text transition-colors group-hover:text-frost-accent sm:text-lg">
            {result.title}
          </h2>

          {result.year && (
            <span className="text-sm font-normal text-frost-muted">
              {result.year}
            </span>
          )}
        </div>

        {/* TYPE */}

        <p className="mt-1 text-sm text-frost-muted">
          {getTypeLabel(result)}
        </p>

        {/* META */}

        {result.meta && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-frost-muted">
            {result.meta}
          </p>
        )}

        {/* ALTERNATIVE NAME */}

        {alias && (
          <p className="mt-2 line-clamp-1 text-xs text-frost-muted">
            Título alternativo:{" "}

            <span className="text-frost-muted">
              {alias}
            </span>
          </p>
        )}
      </div>

      {/* ARROW */}

      <div className="hidden shrink-0 self-center text-frost-muted transition group-hover:translate-x-0.5 group-hover:text-frost-accent sm:block">
        <ChevronRight size={17} />
      </div>
    </Link>
  );
}

/* RESULT COVER */

function ResultCover({
  result,
  artworkOverride,
}: {
  result: UnifiedSearchResult;
  artworkOverride: MediaArtworkOverride | null;
}) {
  const image =
    artworkOverride?.poster_url ??
    result.image;

  const positionX =
    artworkOverride?.poster_position_x ??
    50;

  const positionY =
    artworkOverride?.poster_position_y ??
    50;

  const zoom =
    artworkOverride?.poster_zoom ??
    1;

  return (
    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-frost-surface sm:h-27 sm:w-18">
      {image ? (
        <Image
          src={image}
          alt={result.title}
          fill
          sizes="72px"
          unoptimized={shouldUseOriginalImage(
            image,
          )}
          className="object-cover"
          style={{
            objectPosition:
              `${positionX}% ${positionY}%`,
            transform: `scale(${zoom})`,
          }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center text-frost-muted">
          <ImageOff size={16} />

          <span style={{ fontSize: 8 }}>
            Sin portada
          </span>
        </div>
      )}
    </div>
  );
}