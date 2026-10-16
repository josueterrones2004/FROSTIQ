const TMDB_BASE_URL =
  "https://api.themoviedb.org/3";

function getHeaders() {
  const token =
    process.env.TMDB_READ_TOKEN;

  if (!token) {
    throw new Error(
      "Falta TMDB_READ_TOKEN en .env.local",
    );
  }

  return {
    Authorization:
      `Bearer ${token}`,

    accept:
      "application/json",
  };
}

/* =========================================================
   TRENDING
========================================================= */

export type TrendingMedia = {
  id: number;

  mediaType:
    | "movie"
    | "tv";

  title: string;

  posterPath:
    | string
    | null;

  backdropPath:
    | string
    | null;

  overview: string;

  year:
    | number
    | null;
};

type RawTrendingMedia = {
  id: number;

  media_type:
    string;

  title?:
    string;

  name?:
    string;

  poster_path?:
    | string
    | null;

  backdrop_path?:
    | string
    | null;

  overview?:
    string;

  release_date?:
    string;

  first_air_date?:
    string;

  adult?:
    boolean;
};

function getYear(
  value:
    | string
    | undefined,
) {
  if (!value) {
    return null;
  }

  const year =
    Number(
      value.slice(
        0,
        4,
      ),
    );

  return Number.isFinite(
    year,
  )
    ? year
    : null;
}

/* =========================================================
   WEEKLY TRENDING
========================================================= */

export async function getWeeklyTrending(): Promise<
  TrendingMedia[]
> {
  const response =
    await fetch(
      `${TMDB_BASE_URL}/trending/all/week?language=es-MX`,
      {
        headers:
          getHeaders(),

        next: {
          revalidate:
            3600,
        },
      },
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `Error cargando tendencias de TMDB (${response.status}): ${errorText}`,
    );
  }

  const data =
    await response.json();

  const results =
    (
      data.results ??
      []
    ) as RawTrendingMedia[];

  return results
    .filter(
      (
        item,
      ) =>
        (
          item.media_type ===
            "movie" ||
          item.media_type ===
            "tv"
        ) &&
        item.adult !==
          true &&
        Boolean(
          item.poster_path ||
          item.backdrop_path,
        ),
    )
    .map(
      (
        item,
      ): TrendingMedia => ({
        id:
          item.id,

        mediaType:
          item.media_type as
            | "movie"
            | "tv",

        title:
          item.media_type ===
          "movie"
            ? item.title ??
              "Sin título"
            : item.name ??
              "Sin título",

        posterPath:
          item.poster_path ??
          null,

        backdropPath:
          item.backdrop_path ??
          null,

        overview:
          item.overview ??
          "",

        year:
          getYear(
            item.media_type ===
            "movie"
              ? item.release_date
              : item.first_air_date,
          ),
      }),
    )
    .slice(
      0,
      10,
    );
}

/* =========================================================
   WEEKLY TRENDING BY TYPE
========================================================= */

export async function getWeeklyTrendingByType(
  mediaType:
    | "movie"
    | "tv",

  limit =
    12,
): Promise<
  TrendingMedia[]
> {
  const response =
    await fetch(
      `${TMDB_BASE_URL}/trending/${mediaType}/week?language=es-MX`,
      {
        headers:
          getHeaders(),

        next: {
          revalidate:
            3600,
        },
      },
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `Error cargando tendencias de TMDB (${response.status}): ${errorText}`,
    );
  }

  const data =
    await response.json();

  const results =
    (
      data.results ??
      []
    ) as RawTrendingMedia[];

  return results
    .filter(
      (
        item,
      ) =>
        item.adult !==
          true &&
        Boolean(
          item.poster_path ||
          item.backdrop_path,
        ),
    )
    .map(
      (
        item,
      ): TrendingMedia => ({
        id:
          item.id,

        mediaType,

        title:
          mediaType ===
          "movie"
            ? item.title ??
              "Sin título"
            : item.name ??
              "Sin título",

        posterPath:
          item.poster_path ??
          null,

        backdropPath:
          item.backdrop_path ??
          null,

        overview:
          item.overview ??
          "",

        year:
          getYear(
            mediaType ===
            "movie"
              ? item.release_date
              : item.first_air_date,
          ),
      }),
    )
    .slice(
      0,
      limit,
    );
}

/* =========================================================
   SEARCH
========================================================= */

export async function searchTMDB(
  query:
    string,
) {
  const params =
    new URLSearchParams({
      query,

      language:
        "es-MX",

      include_adult:
        "false",
    });

  const response =
    await fetch(
      `${TMDB_BASE_URL}/search/multi?${params.toString()}`,
      {
        headers:
          getHeaders(),

        next: {
          revalidate:
            3600,
        },
      },
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `Error consultando TMDB (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

/* =========================================================
   MOVIE DETAILS
========================================================= */

export async function getMovieDetails(
  id:
    string,
) {
  const response =
    await fetch(
      `${TMDB_BASE_URL}/movie/${id}?language=es-MX`,
      {
        headers:
          getHeaders(),

        next: {
          revalidate:
            3600,
        },
      },
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `No se pudo cargar la película (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

/* =========================================================
   SERIES DETAILS
========================================================= */

export async function getSeriesDetails(
  id:
    string,
) {
  const params =
    new URLSearchParams({
      language:
        "es-MX",

      /*
       * Necesario para:
       *
       * - Reparto
       * - Equipo
       *
       * sin hacer otra petición separada.
       */
      append_to_response:
        "credits",
    });

  const response =
    await fetch(
      `${TMDB_BASE_URL}/tv/${id}?${params.toString()}`,
      {
        headers:
          getHeaders(),

        next: {
          revalidate:
            3600,
        },
      },
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `No se pudo cargar la serie (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

/* =========================================================
   SEASON DETAILS
========================================================= */

export async function getSeasonDetails(
  seriesId:
    | string
    | number,

  seasonNumber:
    | string
    | number,
) {
  const response =
    await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?language=es-MX`,
      {
        headers:
          getHeaders(),

        next: {
          revalidate:
            3600,
        },
      },
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `Error cargando temporada desde TMDB (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

/* =========================================================
   IMAGES
========================================================= */

export type TMDBImage = {
  file_path:
    string;

  width:
    number;

  height:
    number;

  aspect_ratio?:
    number;

  vote_average?:
    number;
};

export type TMDBImagesResponse = {
  backdrops:
    TMDBImage[];

  posters:
    TMDBImage[];
};

async function getTMDBImages(
  type:
    | "movie"
    | "tv",

  id:
    string,
): Promise<
  TMDBImagesResponse
> {
  const response =
    await fetch(
      `${TMDB_BASE_URL}/${type}/${id}/images?include_image_language=es,en,null`,
      {
        headers:
          getHeaders(),

        next: {
          revalidate:
            3600,
        },
      },
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `No se pudieron cargar las imágenes de TMDB (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

export function getMovieImages(
  id:
    string,
) {
  return getTMDBImages(
    "movie",
    id,
  );
}

export function getSeriesImages(
  id:
    string,
) {
  return getTMDBImages(
    "tv",
    id,
  );
}