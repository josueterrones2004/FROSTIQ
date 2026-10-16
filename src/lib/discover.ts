import {
  getIGDBBackdropUrl,
  getIGDBImageUrl,
  getIGDBReleaseYear,
  getPopularIGDBGames,
  getRecentIGDBGames,
  type IGDBGame,
} from "@/lib/igdb";

import {
  getOpenLibraryCoverUrl,
  getTrendingBooks,
  getWorkIdFromKey,
} from "@/lib/openlibrary";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getWeeklyTrendingByType,
} from "@/lib/tmdb";

export type DiscoverKind =
  | "movie"
  | "series"
  | "game"
  | "book";

export type DiscoverItem = {
  key:
    string;

  kind:
    DiscoverKind;

  externalId:
    string;

  title:
    string;

  /*
   * Poster / card image
   */
  image:
    | string
    | null;

  imagePositionX:
    number;

  imagePositionY:
    number;

  imageZoom:
    number;

  /*
   * Hero / backdrop
   */
  backdrop:
    | string
    | null;

  backdropPositionX:
    number;

  backdropPositionY:
    number;

  backdropZoom:
    number;

  year:
    | number
    | null;

  releaseTimestamp:
    | number
    | null;

  isRecentRelease:
    boolean;

  meta:
    | string
    | null;

  description:
    | string
    | null;

  href:
    string;
};

type ArtworkOverride = {
  media_type:
    string;

  external_id:
    string;

  poster_url:
    | string
    | null;

  backdrop_url:
    | string
    | null;

  poster_position_x:
    number |
    string |
    null;

  poster_position_y:
    number |
    string |
    null;

  poster_zoom:
    number |
    string |
    null;

  backdrop_position_x:
    number |
    string |
    null;

  backdrop_position_y:
    number |
    string |
    null;

  backdrop_zoom:
    number |
    string |
    null;
};

function safeNumber(
  value:
    number |
    string |
    null |
    undefined,

  fallback:
    number
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}

/*
 * GAME → DISCOVER ITEM
 */

function mapGame(
  game:
    IGDBGame,

  isRecentRelease:
    boolean
): DiscoverItem {
  return {
    key:
      `game:${game.id}`,

    kind:
      "game",

    externalId:
      String(
        game.id
      ),

    title:
      game.name,

    image:
      getIGDBImageUrl(
        game.cover
          ?.image_id,
        "cover_big"
      ),

    imagePositionX:
      50,

    imagePositionY:
      50,

    imageZoom:
      1,

    backdrop:
      getIGDBBackdropUrl(
        game
      ),

    backdropPositionX:
      50,

    backdropPositionY:
      50,

    backdropZoom:
      1,

    year:
      getIGDBReleaseYear(
        game.first_release_date
      ),

    releaseTimestamp:
      game.first_release_date
        ? game.first_release_date *
          1000
        : null,

    isRecentRelease,

    meta:
      "Juego",

    description:
      game.summary ??
      null,

    href:
      `/games/${game.id}`,
  };
}

/*
 * APPLY ADMIN OVERRIDES
 */

function applyArtworkOverride(
  item:
    DiscoverItem,

  override:
    ArtworkOverride |
    undefined
): DiscoverItem {
  if (
    !override
  ) {
    return item;
  }

  return {
    ...item,

    image:
      override.poster_url ||
      item.image,

    imagePositionX:
      safeNumber(
        override.poster_position_x,
        50
      ),

    imagePositionY:
      safeNumber(
        override.poster_position_y,
        50
      ),

    imageZoom:
      safeNumber(
        override.poster_zoom,
        1
      ),

    backdrop:
      override.backdrop_url ||
      item.backdrop,

    backdropPositionX:
      safeNumber(
        override.backdrop_position_x,
        50
      ),

    backdropPositionY:
      safeNumber(
        override.backdrop_position_y,
        50
      ),

    backdropZoom:
      safeNumber(
        override.backdrop_zoom,
        1
      ),
  };
}

/*
 * LOAD OVERRIDES
 */

async function applyArtworkOverrides(
  items:
    DiscoverItem[]
) {
  if (
    items.length ===
    0
  ) {
    return items;
  }

  const supabase =
    await createClient();

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
        poster_url,
        backdrop_url,
        poster_position_x,
        poster_position_y,
        poster_zoom,
        backdrop_position_x,
        backdrop_position_y,
        backdrop_zoom
      `);

  if (
    error
  ) {
    console.error(
      "Error loading artwork overrides:",
      error
    );

    /*
     * Si Supabase falla, no rompemos
     * el Home. Seguimos con las APIs.
     */
    return items;
  }

  const overrides =
    new Map<
      string,
      ArtworkOverride
    >();

  for (
    const row of
    data ??
    []
  ) {
    const override =
      row as ArtworkOverride;

    overrides.set(
      `${override.media_type}:${override.external_id}`,
      override
    );
  }

  return items.map(
    (
      item
    ) =>
      applyArtworkOverride(
        item,
        overrides.get(
          `${item.kind}:${item.externalId}`
        )
      )
  );
}

/*
 * DISCOVER
 */

export async function getDiscoverItems(): Promise<
  DiscoverItem[]
> {
  const [
    moviesResult,
    seriesResult,
    popularGamesResult,
    recentGamesResult,
    booksResult,
  ] =
    await Promise.allSettled([
      getWeeklyTrendingByType(
        "movie",
        16
      ),

      getWeeklyTrendingByType(
        "tv",
        16
      ),

      getPopularIGDBGames(),

      getRecentIGDBGames(),

      getTrendingBooks(),
    ]);

  /*
   * MOVIES
   */

  const movies:
    DiscoverItem[] =
    moviesResult.status ===
    "fulfilled"
      ? moviesResult.value.map(
          (
            item
          ) => ({
            key:
              `movie:${item.id}`,

            kind:
              "movie",

            externalId:
              String(
                item.id
              ),

            title:
              item.title,

            image:
              item.posterPath
                ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
                : null,

            imagePositionX:
              50,

            imagePositionY:
              50,

            imageZoom:
              1,

            backdrop:
              item.backdropPath
                ? `https://image.tmdb.org/t/p/original${item.backdropPath}`
                : null,

            backdropPositionX:
              50,

            backdropPositionY:
              50,

            backdropZoom:
              1,

            year:
              item.year,

            releaseTimestamp:
              null,

            /*
             * De momento las películas del hero
             * vienen de TMDB trending.
             */
            isRecentRelease:
              true,

            meta:
              "Película",

            description:
              item.overview ||
              null,

            href:
              `/movies/${item.id}`,
          })
        )
      : [];

  /*
   * SERIES
   */

  const series:
    DiscoverItem[] =
    seriesResult.status ===
    "fulfilled"
      ? seriesResult.value.map(
          (
            item
          ) => ({
            key:
              `series:${item.id}`,

            kind:
              "series",

            externalId:
              String(
                item.id
              ),

            title:
              item.title,

            image:
              item.posterPath
                ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
                : null,

            imagePositionX:
              50,

            imagePositionY:
              50,

            imageZoom:
              1,

            backdrop:
              item.backdropPath
                ? `https://image.tmdb.org/t/p/original${item.backdropPath}`
                : null,

            backdropPositionX:
              50,

            backdropPositionY:
              50,

            backdropZoom:
              1,

            year:
              item.year,

            releaseTimestamp:
              null,

            isRecentRelease:
              true,

            meta:
              "Serie",

            description:
              item.overview ||
              null,

            href:
              `/series/${item.id}`,
          })
        )
      : [];

  /*
   * RECENT GAMES
   */

  const recentGames:
    DiscoverItem[] =
    recentGamesResult.status ===
    "fulfilled"
      ? recentGamesResult.value.map(
          (
            game
          ) =>
            mapGame(
              game,
              true
            )
        )
      : [];

  /*
   * POPULAR GAMES
   */

  const popularGames:
    DiscoverItem[] =
    popularGamesResult.status ===
    "fulfilled"
      ? popularGamesResult.value
          .slice(
            0,
            24
          )
          .map(
            (
              game
            ) =>
              mapGame(
                game,
                false
              )
          )
      : [];

  /*
   * BOOKS
   */

  const books:
    DiscoverItem[] =
    booksResult.status ===
    "fulfilled"
      ? booksResult.value
          .slice(
            0,
            20
          )
          .map(
            (
              book
            ) => {
              const workId =
                getWorkIdFromKey(
                  book.key
                );

              const cover =
                getOpenLibraryCoverUrl(
                  book.cover_i,
                  "L"
                );

              return {
                key:
                  `book:${workId}`,

                kind:
                  "book" as const,

                externalId:
                  workId,

                title:
                  book.title,

                image:
                  cover,

                imagePositionX:
                  50,

                imagePositionY:
                  50,

                imageZoom:
                  1,

                backdrop:
                  null,

                backdropPositionX:
                  50,

                backdropPositionY:
                  50,

                backdropZoom:
                  1,

                year:
                  book.first_publish_year ??
                  null,

                releaseTimestamp:
                  null,

                isRecentRelease:
                  false,

                meta:
                  book.author_name
                    ?.slice(
                      0,
                      2
                    )
                    .join(
                      ", "
                    ) ??
                  "Libro",

                description:
                  null,

                href:
                  `/books/${workId}`,
              };
            }
          )
      : [];

  /*
   * Recent games van primero para que,
   * cuando también estén en popular,
   * conservemos isRecentRelease = true.
   */

  const combined:
    DiscoverItem[] = [
    ...movies,
    ...series,
    ...recentGames,
    ...popularGames,
    ...books,
  ];

  /*
   * REMOVE DUPLICATES
   */

  const seen =
    new Set<
      string
    >();

  const uniqueItems =
    combined.filter(
      (
        item
      ) => {
        if (
          seen.has(
            item.key
          )
        ) {
          return false;
        }

        seen.add(
          item.key
        );

        return true;
      }
    );

  /*
   * Finalmente aplicamos los cambios
   * guardados desde /admin/media.
   */

  return applyArtworkOverrides(
    uniqueItems
  );
}