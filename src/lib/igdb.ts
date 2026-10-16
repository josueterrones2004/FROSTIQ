const IGDB_BASE_URL =
  "https://api.igdb.com/v4";

const TWITCH_TOKEN_URL =
  "https://id.twitch.tv/oauth2/token";

type TwitchTokenResponse = {
  access_token:
    string;

  expires_in:
    number;

  token_type:
    string;
};

type CachedToken = {
  accessToken:
    string;

  expiresAt:
    number;
};

export type IGDBNamedItem = {
  id:
    number;

  name:
    string;
};

export type IGDBImage = {
  id:
    number;

  image_id:
    string;

  width?:
    number;

  height?:
    number;
};

export type IGDBAlternativeName = {
  id:
    number;

  name:
    string;
};

export type IGDBGameType = {
  id?:
    number;

  type?:
    string;
};

export type IGDBGame = {
  id:
    number;

  name:
    string;

  alternative_names?:
    IGDBAlternativeName[];

  summary?:
    string;

  first_release_date?:
    number;

  cover?:
    IGDBImage;

  artworks?:
    IGDBImage[];

  screenshots?:
    IGDBImage[];

  genres?:
    IGDBNamedItem[];

  platforms?:
    IGDBNamedItem[];

  game_type?:
    IGDBGameType;

  version_parent?:
    number;

  total_rating?:
    number;

  total_rating_count?:
    number;

  hypes?:
    number;
};

let cachedToken:
  | CachedToken
  | null =
    null;

/*
 * CREDENTIALS
 */

function getCredentials() {
  const clientId =
    process.env
      .IGDB_CLIENT_ID;

  const clientSecret =
    process.env
      .IGDB_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "IGDB_CLIENT_ID or IGDB_CLIENT_SECRET is missing from .env.local"
    );
  }

  return {
    clientId,
    clientSecret,
  };
}

/*
 * TWITCH ACCESS TOKEN
 */

async function getAccessToken() {
  if (
    cachedToken &&
    cachedToken.expiresAt >
      Date.now() +
        60_000
  ) {
    return cachedToken.accessToken;
  }

  const {
    clientId,
    clientSecret,
  } =
    getCredentials();

  const params =
    new URLSearchParams({
      client_id:
        clientId,

      client_secret:
        clientSecret,

      grant_type:
        "client_credentials",
    });

  const response =
    await fetch(
      `${TWITCH_TOKEN_URL}?${params.toString()}`,
      {
        method:
          "POST",

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `Could not authenticate with IGDB (${response.status}): ${errorText}`
    );
  }

  const data =
    (
      await response.json()
    ) as TwitchTokenResponse;

  cachedToken = {
    accessToken:
      data.access_token,

    expiresAt:
      Date.now() +
      data.expires_in *
        1000,
  };

  return data.access_token;
}

/*
 * IGDB REQUEST
 */

async function requestIGDB<T>(
  endpoint:
    string,

  body:
    string
): Promise<T> {
  const {
    clientId,
  } =
    getCredentials();

  const accessToken =
    await getAccessToken();

  const response =
    await fetch(
      `${IGDB_BASE_URL}/${endpoint}`,
      {
        method:
          "POST",

        headers: {
          "Client-ID":
            clientId,

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "text/plain",
        },

        body,

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `IGDB request failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/*
 * SEARCH QUERY ESCAPE
 */

function escapeSearchQuery(
  query:
    string
) {
  return query
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      '"',
      '\\"'
    )
    .replaceAll(
      /\s+/g,
      " "
    )
    .trim();
}

/*
 * GAME TYPE NORMALIZATION
 */

export function normalizeIGDBGameType(
  value:
    | string
    | null
    | undefined
) {
  return (
    value
      ?.normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      ) ??
    ""
  );
}

/*
 * HUMAN-READABLE GAME TYPE
 */

export function getIGDBGameTypeLabel(
  game:
    IGDBGame
) {
  const type =
    normalizeIGDBGameType(
      game.game_type
        ?.type
    );

  if (
    type ===
    "dlc_addon"
  ) {
    return "DLC";
  }

  if (
    type ===
    "expansion"
  ) {
    return "Expansión";
  }

  if (
    type ===
    "standalone_expansion"
  ) {
    return "Expansión independiente";
  }

  if (
    type ===
    "remake"
  ) {
    return "Remake";
  }

  if (
    type ===
    "remaster"
  ) {
    return "Remaster";
  }

  if (
    type ===
    "expanded_game"
  ) {
    return "Edición expandida";
  }

  return "Juego";
}

/*
 * GAME FILTER
 */

function shouldShowGame(
  game:
    IGDBGame
) {
  const type =
    normalizeIGDBGameType(
      game.game_type
        ?.type
    );

  /*
   * Permitimos remakes/remasters aunque
   * IGDB los relacione con otra versión.
   *
   * El resto de versiones secundarias
   * se descartan para evitar duplicados.
   */

  if (
    game.version_parent &&
    type !==
      "remaster" &&
    type !==
      "remake" &&
    type !==
      "expanded_game" &&
    type !==
      "standalone_expansion"
  ) {
    return false;
  }

  if (
    !type
  ) {
    return true;
  }

  const allowedTypes =
    new Set([
      "main_game",
      "dlc_addon",
      "expansion",
      "standalone_expansion",
      "remake",
      "remaster",
      "expanded_game",
    ]);

  return allowedTypes.has(
    type
  );
}

/*
 * COMMON DISCOVER FIELDS
 */

const DISCOVER_GAME_FIELDS = `
  id,
  name,
  summary,
  cover.image_id,
  cover.width,
  cover.height,
  artworks.image_id,
  artworks.width,
  artworks.height,
  screenshots.image_id,
  screenshots.width,
  screenshots.height,
  first_release_date,
  game_type.type,
  version_parent,
  total_rating,
  total_rating_count,
  hypes
`;

/*
 * SEARCH
 */

export async function searchIGDBGames(
  query:
    string
) {
  const cleanQuery =
    escapeSearchQuery(
      query
    );

  if (
    !cleanQuery
  ) {
    return [];
  }

  const games =
    await requestIGDB<
      IGDBGame[]
    >(
      "games",
      `
        search "${cleanQuery}";

        fields
          id,
          name,
          alternative_names.name,
          cover.image_id,
          first_release_date,
          genres.name,
          platforms.name,
          game_type.type,
          version_parent,
          total_rating,
          total_rating_count,
          hypes;

        limit 50;
      `
    );

  return games
    .filter(
      shouldShowGame
    )
    .slice(
      0,
      30
    );
}

/*
 * POPULAR GAMES
 */

export async function getPopularIGDBGames() {
  const now =
    Math.floor(
      Date.now() /
        1000
    );

  const threeYearsAgo =
    Math.floor(
      (
        Date.now() -
        3 *
          365 *
          24 *
          60 *
          60 *
          1000
      ) /
        1000
    );

  const games =
    await requestIGDB<
      IGDBGame[]
    >(
      "games",
      `
        fields
          ${DISCOVER_GAME_FIELDS};

        where
          version_parent = null
          & cover != null
          & first_release_date != null
          & first_release_date >= ${threeYearsAgo}
          & first_release_date <= ${now}
          & total_rating_count != null;

        sort total_rating_count desc;

        limit 40;
      `
    );

  return games
    .filter(
      shouldShowGame
    )
    .filter(
      (
        game
      ) =>
        Boolean(
          game.cover
            ?.image_id
        )
    )
    .slice(
      0,
      30
    );
}

/*
 * RECENT / UPCOMING GAMES
 *
 * Ventana:
 *
 * - hasta 30 días atrás
 * - hasta 7 días hacia delante
 *
 * Los juegos futuros necesitan MUCHO hype.
 * Los recién lanzados pueden entrar con una
 * señal de relevancia menor porque todavía
 * no han tenido tiempo de acumular ratings.
 *
 * Cuanto más antiguo sea un juego, más
 * relevancia exigimos.
 */

export async function getRecentIGDBGames() {
  const now =
    Math.floor(
      Date.now() /
        1000
    );

  const DAY =
    24 *
    60 *
    60;

  const pastLimit =
    now -
    30 *
      DAY;

  const futureLimit =
    now +
    7 *
      DAY;

  const games =
    await requestIGDB<
      IGDBGame[]
    >(
      "games",
      `
        fields
          ${DISCOVER_GAME_FIELDS};

        where
          cover != null
          & first_release_date != null
          & first_release_date >= ${pastLimit}
          & first_release_date <= ${futureLimit};

        sort first_release_date desc;

        limit 150;
      `
    );

  return games
    .filter(
      shouldShowGame
    )
    .filter(
      (
        game
      ) =>
        Boolean(
          game.cover
            ?.image_id
        )
    )
    .filter(
      (
        game
      ) =>
        Boolean(
          getIGDBBackdropUrl(
            game
          )
        )
    )
    .filter(
      (
        game
      ) => {
        const release =
          game.first_release_date;

        if (
          !release
        ) {
          return false;
        }

        const hypes =
          game.hypes ??
          0;

        const ratings =
          game.total_rating_count ??
          0;

        const differenceDays =
          (
            release -
            now
          ) /
          DAY;

        /*
         * PRÓXIMOS LANZAMIENTOS
         *
         * Solo permitimos juegos realmente
         * importantes.
         *
         * Un juego futuro no puede apoyarse
         * en ratings porque todavía no salió.
         */

        if (
          differenceDays >
          0
        ) {
          return (
            differenceDays <=
              7 &&
            hypes >=
              35
          );
        }

        const ageDays =
          Math.abs(
            differenceDays
          );

        /*
         * LANZADO EN LOS ÚLTIMOS 3 DÍAS
         *
         * Todavía puede tener pocos ratings.
         */

        if (
          ageDays <=
          3
        ) {
          return (
            hypes >=
              10 ||
            ratings >=
              3
          );
        }

        /*
         * HASTA 7 DÍAS
         */

        if (
          ageDays <=
          7
        ) {
          return (
            hypes >=
              15 ||
            ratings >=
              7
          );
        }

        /*
         * HASTA 14 DÍAS
         */

        if (
          ageDays <=
          14
        ) {
          return (
            hypes >=
              25 ||
            ratings >=
              15
          );
        }

        /*
         * HASTA 30 DÍAS
         *
         * Si ya lleva varias semanas,
         * debe ser claramente relevante
         * para seguir apareciendo.
         */

        return (
          hypes >=
            40 ||
          ratings >=
            30
        );
      }
    )
    .sort(
      (
        first,
        second
      ) => {
        const firstRelease =
          first.first_release_date ??
          0;

        const secondRelease =
          second.first_release_date ??
          0;

        const firstHypes =
          first.hypes ??
          0;

        const secondHypes =
          second.hypes ??
          0;

        const firstRatings =
          first.total_rating_count ??
          0;

        const secondRatings =
          second.total_rating_count ??
          0;

        const firstFuture =
          firstRelease >
          now;

        const secondFuture =
          secondRelease >
          now;

        /*
         * SCORE DE RELEVANCIA
         */

        const firstRelevance =
          firstHypes *
            3 +
          firstRatings;

        const secondRelevance =
          secondHypes *
            3 +
          secondRatings;

        /*
         * Próximos lanzamientos:
         *
         * primero el que sale antes.
         */

        if (
          firstFuture &&
          secondFuture
        ) {
          const dateDifference =
            firstRelease -
            secondRelease;

          if (
            dateDifference !==
            0
          ) {
            return dateDifference;
          }

          return (
            secondRelevance -
            firstRelevance
          );
        }

        /*
         * Lanzamientos ya disponibles:
         *
         * primero el más reciente.
         */

        if (
          !firstFuture &&
          !secondFuture
        ) {
          const dateDifference =
            secondRelease -
            firstRelease;

          if (
            dateDifference !==
            0
          ) {
            return dateDifference;
          }

          return (
            secondRelevance -
            firstRelevance
          );
        }

        /*
         * Para mezclar recién salidos y
         * próximos lanzamientos usamos la
         * distancia respecto de hoy.
         *
         * Así un juego que salió ayer puede
         * competir con uno que sale mañana.
         */

        const firstDistance =
          Math.abs(
            firstRelease -
            now
          );

        const secondDistance =
          Math.abs(
            secondRelease -
            now
          );

        if (
          firstDistance !==
          secondDistance
        ) {
          return (
            firstDistance -
            secondDistance
          );
        }

        return (
          secondRelevance -
          firstRelevance
        );
      }
    )
    .slice(
      0,
      20
    );
}

/*
 * GAME DETAILS
 */

export async function getIGDBGame(
  id:
    string
) {
  if (
    !/^\d+$/.test(
      id
    )
  ) {
    return null;
  }

  const games =
    await requestIGDB<
      IGDBGame[]
    >(
      "games",
      `
        fields
          id,
          name,
          alternative_names.name,
          summary,
          first_release_date,
          cover.image_id,
          cover.width,
          cover.height,
          artworks.image_id,
          artworks.width,
          artworks.height,
          screenshots.image_id,
          screenshots.width,
          screenshots.height,
          genres.name,
          platforms.name,
          game_type.type,
          version_parent,
          total_rating,
          total_rating_count,
          hypes;

        where id = ${id};

        limit 1;
      `
    );

  return (
    games[
      0
    ] ??
    null
  );
}

/*
 * IMAGE URL
 */

export function getIGDBImageUrl(
  imageId:
    | string
    | undefined,

  size:
    | "cover_big"
    | "screenshot_big"
    | "1080p" =
      "cover_big"
) {
  if (
    !imageId
  ) {
    return null;
  }

  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

/*
 * LANDSCAPE IMAGE SCORE
 */

function getLandscapeScore(
  image:
    IGDBImage
) {
  const width =
    image.width ??
    0;

  const height =
    image.height ??
    0;

  if (
    width <=
      0 ||
    height <=
      0
  ) {
    return 1;
  }

  const ratio =
    width /
    height;

  if (
    ratio <
    1.35
  ) {
    return 0;
  }

  const targetRatio =
    16 /
    9;

  const ratioDifference =
    Math.abs(
      ratio -
      targetRatio
    );

  const ratioQuality =
    Math.max(
      0.25,
      1 -
        ratioDifference *
          0.3
    );

  return (
    width *
    height *
    ratioQuality
  );
}

function getBestLandscapeImage(
  images:
    | IGDBImage[]
    | undefined
) {
  if (
    !images ||
    images.length ===
      0
  ) {
    return null;
  }

  return (
    [...images]
      .map(
        (
          image
        ) => ({
          image,

          score:
            getLandscapeScore(
              image
            ),
        })
      )
      .filter(
        (
          item
        ) =>
          item.score >
          0
      )
      .sort(
        (
          first,
          second
        ) =>
          second.score -
          first.score
      )[
        0
      ]
      ?.image ??
    null
  );
}

/*
 * BEST GAME BACKDROP
 */

export function getIGDBBackdropUrl(
  game:
    IGDBGame
) {
  const artwork =
    getBestLandscapeImage(
      game.artworks
    );

  if (
    artwork
      ?.image_id
  ) {
    return getIGDBImageUrl(
      artwork.image_id,
      "1080p"
    );
  }

  const screenshot =
    getBestLandscapeImage(
      game.screenshots
    );

  if (
    screenshot
      ?.image_id
  ) {
    return getIGDBImageUrl(
      screenshot.image_id,
      "1080p"
    );
  }

  return null;
}

/*
 * RELEASE YEAR
 */

export function getIGDBReleaseYear(
  timestamp:
    | number
    | undefined
) {
  if (
    !timestamp
  ) {
    return null;
  }

  return new Date(
    timestamp *
      1000
  ).getUTCFullYear();
}