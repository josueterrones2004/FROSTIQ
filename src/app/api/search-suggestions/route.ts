import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getIGDBGameTypeLabel,
  getIGDBImageUrl,
  getIGDBReleaseYear,
  normalizeIGDBGameType,
  searchIGDBGames,
} from "@/lib/igdb";

import {
  getOpenLibraryCoverUrl,
  getWorkIdFromKey,
  searchBooks,
} from "@/lib/openlibrary";

import {
  searchTMDB,
} from "@/lib/tmdb";

import {
  createClient,
} from "@/lib/supabase/server";

type Source =
  | "games"
  | "screen"
  | "books";

type SuggestionKind =
  | "game"
  | "movie"
  | "series"
  | "book";

type Suggestion = {
  key:
    string;

  title:
    string;

  kind:
    SuggestionKind;

  image:
    | string
    | null;

  year:
    | number
    | null;

  subtitle:
    string;

  href:
    string;

  score:
    number;
};

type CachedValue = {
  expiresAt:
    number;

  /*
   * IMPORTANTE:
   * aquí guardamos el resultado ORIGINAL
   * de las APIs externas, no el override.
   */
  results:
    Suggestion[];
};

const cache =
  new Map<
    string,
    CachedValue
  >();

const CACHE_TIME =
  5 *
  60 *
  1000;

function normalize(
  value:
    string
) {
  return value
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /([a-z])(\d)/g,
      "$1 $2"
    )
    .replace(
      /(\d)([a-z])/g,
      "$1 $2"
    )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function getExternalId(
  suggestion:
    Suggestion
) {
  return suggestion.key
    .split(":")
    .slice(1)
    .join(":");
}

function titleScore(
  title:
    string,

  query:
    string
) {
  const left =
    normalize(
      title
    );

  const right =
    normalize(
      query
    );

  if (
    !left ||
    !right
  ) {
    return 0;
  }

  if (
    left ===
    right
  ) {
    return 130;
  }

  if (
    left.startsWith(
      `${right} `
    )
  ) {
    return 105;
  }

  if (
    left.startsWith(
      right
    )
  ) {
    return 100;
  }

  if (
    left.includes(
      right
    )
  ) {
    return 70;
  }

  const words =
    right.split(
      " "
    );

  const matches =
    words.filter(
      (
        word
      ) =>
        left.includes(
          word
        )
    ).length;

  return (
    matches /
    words.length
  ) *
    45;
}

/*
 * Aplica SIEMPRE el artwork actual después
 * del cache de TMDB / IGDB / Open Library.
 *
 * De esta forma cambiar una portada no obliga
 * a esperar 5 minutos para que se actualice.
 */

async function applyArtworkOverrides(
  results:
    Suggestion[]
) {
  if (
    results.length ===
    0
  ) {
    return results;
  }

  const supabase =
    await createClient();

  const kinds:
    SuggestionKind[] = [
      "movie",
      "series",
      "game",
      "book",
    ];

  const groups =
    await Promise.all(
      kinds.map(
        async (
          kind
        ) => {
          const externalIds =
            [
              ...new Set(
                results
                  .filter(
                    (
                      result
                    ) =>
                      result.kind ===
                      kind
                  )
                  .map(
                    getExternalId
                  )
                  .filter(
                    Boolean
                  )
              ),
            ];

          if (
            externalIds.length ===
            0
          ) {
            return [];
          }

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "media_artwork_overrides"
              )
              .select(`
                media_type,
                external_id,
                poster_url
              `)
              .eq(
                "media_type",
                kind
              )
              .in(
                "external_id",
                externalIds
              );

          if (
            error
          ) {
            console.error(
              `Could not load ${kind} artwork overrides:`,
              error
            );

            return [];
          }

          return (
            data ??
            []
          );
        }
      )
    );

  const artwork =
    new Map<
      string,
      string
    >();

  for (
    const group of
    groups
  ) {
    for (
      const override of
      group
    ) {
      if (
        !override.poster_url
      ) {
        continue;
      }

      artwork.set(
        `${override.media_type}:${override.external_id}`,
        override.poster_url
      );
    }
  }

  return results.map(
    (
      result
    ) => ({
      ...result,

      image:
        artwork.get(
          `${result.kind}:${getExternalId(
            result
          )}`
        ) ??
        result.image,
    })
  );
}

/*
 * GAMES
 */

async function searchGames(
  query:
    string
): Promise<Suggestion[]> {
  const games =
    await searchIGDBGames(
      query
    );

  return games
    .map(
      (
        game
      ) => {
        let score =
          titleScore(
            game.name,
            query
          );

        const type =
          normalizeIGDBGameType(
            game.game_type
              ?.type
          );

        if (
          type ===
          "main_game"
        ) {
          score +=
            22;
        } else if (
          type ===
            "expansion" ||
          type ===
            "standalone_expansion"
        ) {
          score +=
            9;
        }

        if (
          game.cover
            ?.image_id
        ) {
          score +=
            8;
        }

        if (
          game.total_rating_count
        ) {
          score +=
            Math.min(
              18,
              Math.log10(
                game.total_rating_count +
                  1
              ) *
                6
            );
        }

        return {
          key:
            `game:${game.id}`,

          title:
            game.name,

          kind:
            "game" as const,

          image:
            getIGDBImageUrl(
              game.cover
                ?.image_id,
              "cover_big"
            ),

          year:
            getIGDBReleaseYear(
              game.first_release_date
            ),

          subtitle:
            getIGDBGameTypeLabel(
              game
            ),

          href:
            `/games/${game.id}`,

          score,
        };
      }
    )
    .sort(
      (
        first,
        second
      ) =>
        second.score -
        first.score
    )
    .slice(
      0,
      7
    );
}

/*
 * TMDB
 */

async function searchScreen(
  query:
    string
): Promise<Suggestion[]> {
  const response =
    await searchTMDB(
      query
    );

  const results =
    (
      response.results ??
      []
    ) as {
      id:
        number;

      media_type:
        string;

      title?:
        string;

      name?:
        string;

      poster_path?:
        string |
        null;

      release_date?:
        string;

      first_air_date?:
        string;

      popularity?:
        number;

      vote_count?:
        number;
    }[];

  return results
    .filter(
      (
        item
      ) =>
        item.media_type ===
          "movie" ||
        item.media_type ===
          "tv"
    )
    .map(
      (
        item
      ) => {
        const movie =
          item.media_type ===
          "movie";

        const title =
          (
            movie
              ? item.title
              : item.name
          ) ??
          "Sin título";

        const date =
          movie
            ? item.release_date
            : item.first_air_date;

        const year =
          date
            ? Number(
                date.slice(
                  0,
                  4
                )
              )
            : null;

        let score =
          titleScore(
            title,
            query
          );

        if (
          item.poster_path
        ) {
          score +=
            8;
        }

        if (
          item.popularity
        ) {
          score +=
            Math.min(
              15,
              Math.log10(
                item.popularity +
                  1
              ) *
                5
            );
        }

        if (
          item.vote_count
        ) {
          score +=
            Math.min(
              12,
              Math.log10(
                item.vote_count +
                  1
              ) *
                4
            );
        }

        return {
          key:
            `${
              movie
                ? "movie"
                : "series"
            }:${item.id}`,

          title,

          kind:
            movie
              ? "movie" as const
              : "series" as const,

          image:
            item.poster_path
              ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
              : null,

          year:
            Number.isFinite(
              year
            )
              ? year
              : null,

          subtitle:
            movie
              ? "Película"
              : "Serie",

          href:
            movie
              ? `/movies/${item.id}`
              : `/series/${item.id}`,

          score,
        };
      }
    )
    .sort(
      (
        first,
        second
      ) =>
        second.score -
        first.score
    )
    .slice(
      0,
      7
    );
}

/*
 * BOOKS
 */

async function searchBookSuggestions(
  query:
    string
): Promise<Suggestion[]> {
  const response =
    await searchBooks(
      query
    );

  const bestByTitle =
    new Map<
      string,
      Suggestion
    >();

  for (
    const book of
    response.docs
  ) {
    if (
      !book.key?.startsWith(
        "/works/"
      )
    ) {
      continue;
    }

    const workId =
      getWorkIdFromKey(
        book.key
      );

    let score =
      titleScore(
        book.title,
        query
      );

    if (
      book.cover_i
    ) {
      score +=
        10;
    }

    if (
      book.edition_count
    ) {
      score +=
        Math.min(
          14,
          Math.log10(
            book.edition_count +
              1
          ) *
            5
        );
    }

    const result:
      Suggestion = {
      key:
        `book:${workId}`,

      title:
        book.title,

      kind:
        "book",

      image:
        getOpenLibraryCoverUrl(
          book.cover_i,
          "S"
        ),

      year:
        book.first_publish_year ??
        null,

      subtitle:
        "Libro",

      href:
        `/books/${workId}`,

      score,
    };

    const key =
      normalize(
        book.title
      );

    const existing =
      bestByTitle.get(
        key
      );

    if (
      !existing ||
      result.score >
        existing.score
    ) {
      bestByTitle.set(
        key,
        result
      );
    }
  }

  return Array.from(
    bestByTitle.values()
  )
    .sort(
      (
        first,
        second
      ) =>
        second.score -
        first.score
    )
    .slice(
      0,
      6
    );
}

/*
 * ROUTE
 */

export async function GET(
  request:
    NextRequest
) {
  const query =
    request.nextUrl.searchParams
      .get(
        "q"
      )
      ?.trim();

  const source =
    request.nextUrl.searchParams
      .get(
        "source"
      ) as Source | null;

  if (
    !query ||
    query.length <
      2
  ) {
    return NextResponse.json(
      {
        results:
          [],
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  if (
    source !==
      "games" &&
    source !==
      "screen" &&
    source !==
      "books"
  ) {
    return NextResponse.json(
      {
        results:
          [],
      },
      {
        status:
          400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  const cacheKey =
    `${source}:${normalize(
      query
    )}`;

  const cached =
    cache.get(
      cacheKey
    );

  /*
   * El resultado externo puede estar cacheado,
   * pero la portada personalizada NO.
   */

  if (
    cached &&
    cached.expiresAt >
      Date.now()
  ) {
    const results =
      await applyArtworkOverrides(
        cached.results
      );

    return NextResponse.json(
      {
        results,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  try {
    let rawResults:
      Suggestion[];

    if (
      source ===
      "games"
    ) {
      rawResults =
        await searchGames(
          query
        );
    } else if (
      source ===
      "screen"
    ) {
      rawResults =
        await searchScreen(
          query
        );
    } else {
      rawResults =
        await searchBookSuggestions(
          query
        );
    }

    /*
     * Cacheamos solo los datos externos.
     */

    cache.set(
      cacheKey,
      {
        expiresAt:
          Date.now() +
          CACHE_TIME,

        results:
          rawResults,
      }
    );

    const results =
      await applyArtworkOverrides(
        rawResults
      );

    return NextResponse.json(
      {
        results,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error
  ) {
    console.error(
      `${source} suggestion search failed:`,
      error
    );

    return NextResponse.json(
      {
        results:
          [],
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}