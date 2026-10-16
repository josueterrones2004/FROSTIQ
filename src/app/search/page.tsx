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

const DEFAULT_LIMIT =
  20;

const MAX_LIMIT =
  60;

function toDatabaseMediaType(
  kind:
    SearchKind
): DatabaseMediaType {
  if (
    kind ===
    "movie"
  ) {
    return "MOVIE";
  }

  if (
    kind ===
    "series"
  ) {
    return "SERIES";
  }

  if (
    kind ===
    "game"
  ) {
    return "GAME";
  }

  return "BOOK";
}

function getKindLabel(
  kind:
    SearchKind
) {
  if (
    kind ===
    "game"
  ) {
    return "Juego";
  }

  if (
    kind ===
    "movie"
  ) {
    return "Película";
  }

  if (
    kind ===
    "series"
  ) {
    return "Serie";
  }

  return "Libro";
}

function getTypeLabel(
  result:
    UnifiedSearchResult
) {
  const base =
    getKindLabel(
      result.kind
    );

  if (
    !result.subtitle ||
    result.subtitle ===
      base
  ) {
    return base;
  }

  if (
    result.kind ===
    "game"
  ) {
    return result.subtitle;
  }

  return `${base} · ${result.subtitle}`;
}

function getUsefulAlias(
  result:
    UnifiedSearchResult,
  query:
    string
) {
  if (
    result.aliases.length ===
    0
  ) {
    return null;
  }

  const normalizedQuery =
    normalizeSearchText(
      query
    );

  const normalizedTitle =
    normalizeSearchText(
      result.title
    );

  for (
    const alias of
    result.aliases
  ) {
    const normalizedAlias =
      normalizeSearchText(
        alias
      );

    if (
      !normalizedAlias ||
      normalizedAlias ===
        normalizedTitle
    ) {
      continue;
    }

    if (
      normalizedAlias.includes(
        normalizedQuery
      ) ||
      normalizedQuery.includes(
        normalizedAlias
      )
    ) {
      return alias;
    }
  }

  return null;
}

function sortResults(
  results:
    UnifiedSearchResult[],
  sort:
    SortMode
) {
  const copy = [
    ...results,
  ];

  if (
    sort ===
    "newest"
  ) {
    return copy.sort(
      (
        first,
        second
      ) => {
        if (
          first.year ===
          null
        ) {
          return 1;
        }

        if (
          second.year ===
          null
        ) {
          return -1;
        }

        return (
          second.year -
          first.year
        );
      }
    );
  }

  if (
    sort ===
    "oldest"
  ) {
    return copy.sort(
      (
        first,
        second
      ) => {
        if (
          first.year ===
          null
        ) {
          return 1;
        }

        if (
          second.year ===
          null
        ) {
          return -1;
        }

        return (
          first.year -
          second.year
        );
      }
    );
  }

  if (
    sort ===
    "az"
  ) {
    return copy.sort(
      (
        first,
        second
      ) =>
        first.title.localeCompare(
          second.title,
          "es",
          {
            sensitivity:
              "base",
          }
        )
    );
  }

  return copy.sort(
    (
      first,
      second
    ) =>
      second.score -
      first.score
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
  const params =
    new URLSearchParams();

  params.set(
    "q",
    query
  );

  if (
    type !==
    "all"
  ) {
    params.set(
      "type",
      type
    );
  }

  if (
    sort !==
    "relevance"
  ) {
    params.set(
      "sort",
      sort
    );
  }

  if (
    onlyWithImage
  ) {
    params.set(
      "image",
      "with"
    );
  }

  if (
    limit >
    DEFAULT_LIMIT
  ) {
    params.set(
      "limit",
      String(
        limit
      )
    );
  }

  return `/search?${params.toString()}`;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params =
    await searchParams;

  const query =
    params.q
      ?.trim();

  if (
    !query
  ) {
    return (
      <main className="mx-auto max-w-[1280px] pb-24">
        <section className="border-b border-zinc-800 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Búsqueda
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
            Busca algo
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Escribe una película, serie, juego o libro en la barra superior.
          </p>
        </section>
      </main>
    );
  }

  const type:
    MediaFilter =
    params.type ===
      "game" ||
    params.type ===
      "movie" ||
    params.type ===
      "series" ||
    params.type ===
      "book"
      ? params.type
      : "all";

  const sort:
    SortMode =
    params.sort ===
      "newest" ||
    params.sort ===
      "oldest" ||
    params.sort ===
      "az"
      ? params.sort
      : "relevance";

  const onlyWithImage =
    params.image ===
    "with";

  const requestedLimit =
    Number(
      params.limit ??
        DEFAULT_LIMIT
    );

  const limit =
    Number.isFinite(
      requestedLimit
    )
      ? Math.min(
          MAX_LIMIT,
          Math.max(
            DEFAULT_LIMIT,
            requestedLimit
          )
        )
      : DEFAULT_LIMIT;

  /*
   * SEARCH
   */

  const allResults =
    await searchAllMedia(
      query
    );

  /*
   * GLOBAL ARTWORK OVERRIDES
   */

  const artworkOverrides =
    await getMixedMediaArtworkOverrides(
      allResults.map(
        (
          result
        ) => ({
          media_type:
            toDatabaseMediaType(
              result.kind
            ),

          external_id:
            result.externalId,
        })
      )
    );

  /*
   * COUNTS
   */

  const counts = {
    all:
      allResults.length,

    game:
      allResults.filter(
        (
          result
        ) =>
          result.kind ===
          "game"
      ).length,

    movie:
      allResults.filter(
        (
          result
        ) =>
          result.kind ===
          "movie"
      ).length,

    series:
      allResults.filter(
        (
          result
        ) =>
          result.kind ===
          "series"
      ).length,

    book:
      allResults.filter(
        (
          result
        ) =>
          result.kind ===
          "book"
      ).length,
  };

  /*
   * FILTER
   */

  let filteredResults =
    allResults.filter(
      (
        result
      ) =>
        type ===
          "all" ||
        result.kind ===
          type
    );

  if (
    onlyWithImage
  ) {
    filteredResults =
      filteredResults.filter(
        (
          result
        ) => {
          const override =
            artworkOverrides.get(
              getMediaArtworkMapKey(
                toDatabaseMediaType(
                  result.kind
                ),
                result.externalId
              )
            );

          return Boolean(
            override
              ?.poster_url ??
              result.image
          );
        }
      );
  }

  /*
   * SORT
   */

  const sortedResults =
    sortResults(
      filteredResults,
      sort
    );

  /*
   * LIMIT
   */

  const visibleResults =
    sortedResults.slice(
      0,
      limit
    );

  const hasMore =
    sortedResults.length >
    visibleResults.length;

  const nextLimit =
    Math.min(
      MAX_LIMIT,
      limit +
        20
    );

  const moreHref =
    buildSearchHref({
      query,
      type,
      sort,
      onlyWithImage,
      limit:
        nextLimit,
    });

  return (
    <main className="mx-auto max-w-[1280px] pb-24">
      {/* DISCREET HEADER */}

      <section className="border-b border-zinc-800 pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Resultados para
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-[28px]">
            “{query}”
          </h1>

          <span className="text-sm text-zinc-600">
            {filteredResults.length}{" "}
            {filteredResults.length ===
            1
              ? "coincidencia"
              : "coincidencias"}
          </span>
        </div>
      </section>

      {/* CONTENT */}

      <div className="mt-6 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_250px]">
        {/* RESULTS */}

        <div className="min-w-0">
          {visibleResults.length ===
          0 ? (
            <div className="border-t border-zinc-800 py-14">
              <p className="text-sm text-zinc-400">
                No encontramos resultados con estos filtros.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Prueba otro tipo de contenido o permite resultados sin portada.
              </p>
            </div>
          ) : (
            <section>
              <div className="border-t border-zinc-800">
                {visibleResults.map(
                  (
                    result
                  ) => {
                    const artworkOverride =
                      artworkOverrides.get(
                        getMediaArtworkMapKey(
                          toDatabaseMediaType(
                            result.kind
                          ),
                          result.externalId
                        )
                      ) ??
                      null;

                    return (
                      <ResultRow
                        key={
                          result.key
                        }
                        result={
                          result
                        }
                        query={
                          query
                        }
                        artworkOverride={
                          artworkOverride
                        }
                      />
                    );
                  }
                )}
              </div>

              {/* LOAD MORE */}

              {hasMore && (
                <div className="pt-7">
                  <Link
                    href={
                      moreHref
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
                  >
                    Mostrar más resultados

                    <ChevronRight
                      size={15}
                    />
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>

        {/* FILTERS */}

        <SearchFilters
          query={
            query
          }
          type={
            type
          }
          sort={
            sort
          }
          onlyWithImage={
            onlyWithImage
          }
          counts={
            counts
          }
        />
      </div>
    </main>
  );
}

/*
 * RESULT ROW
 */

function ResultRow({
  result,
  query,
  artworkOverride,
}: {
  result:
    UnifiedSearchResult;

  query:
    string;

  artworkOverride:
    | MediaArtworkOverride
    | null;
}) {
  const alias =
    getUsefulAlias(
      result,
      query
    );

  return (
    <Link
      href={
        result.href
      }
      className="group flex gap-4 border-b border-zinc-800 py-4 transition hover:bg-zinc-900/20 sm:gap-5 sm:py-5"
    >
      <ResultCover
        result={
          result
        }
        artworkOverride={
          artworkOverride
        }
      />

      {/* INFORMATION */}

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h2 className="text-base font-semibold leading-snug text-zinc-200 transition group-hover:text-fuchsia-300 sm:text-lg">
            {
              result.title
            }
          </h2>

          {result.year && (
            <span className="text-sm font-normal text-zinc-600">
              {
                result.year
              }
            </span>
          )}
        </div>

        {/* TYPE */}

        <p className="mt-1 text-sm text-zinc-500">
          {getTypeLabel(
            result
          )}
        </p>

        {/* META */}

        {result.meta && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-600">
            {
              result.meta
            }
          </p>
        )}

        {/* ALTERNATIVE NAME */}

        {alias && (
          <p className="mt-2 line-clamp-1 text-xs text-zinc-700">
            Título alternativo:{" "}
            <span className="text-zinc-600">
              {
                alias
              }
            </span>
          </p>
        )}
      </div>

      {/* ARROW */}

      <div className="hidden shrink-0 self-center text-zinc-800 transition group-hover:translate-x-0.5 group-hover:text-zinc-500 sm:block">
        <ChevronRight
          size={17}
        />
      </div>
    </Link>
  );
}

/*
 * RESULT COVER
 */

function ResultCover({
  result,
  artworkOverride,
}: {
  result:
    UnifiedSearchResult;

  artworkOverride:
    | MediaArtworkOverride
    | null;
}) {
  const image =
    artworkOverride
      ?.poster_url ??
    result.image;

  const positionX =
    artworkOverride
      ?.poster_position_x ??
    50;

  const positionY =
    artworkOverride
      ?.poster_position_y ??
    50;

  const zoom =
    artworkOverride
      ?.poster_zoom ??
    1;

  return (
    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-900 sm:h-[108px] sm:w-[72px]">
      {image ? (
        <Image
          src={
            image
          }
          alt={
            result.title
          }
          fill
          sizes="72px"
          unoptimized={
            shouldUseOriginalImage(
              image
            )
          }
          className="object-cover"
          style={{
            objectPosition:
              `${positionX}% ${positionY}%`,
            transform:
              `scale(${zoom})`,
          }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center text-zinc-700">
          <ImageOff
            size={16}
          />

          <span className="text-[8px]">
            Sin portada
          </span>
        </div>
      )}
    </div>
  );
}