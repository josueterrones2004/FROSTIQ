import { redirect } from "next/navigation";

import LibraryBrowser from "@/components/library/LibraryBrowser";

import type {
  CompletedReview,
  LibraryEntry,
  LibraryMediaType,
  LibraryStatus,
} from "@/components/library/libraryShared";

import type { LibraryReview } from "@/components/media/LibraryReviewModalCard";

import {
  getMediaArtworkMapKey,
  getMixedMediaArtworkOverrides,
} from "@/lib/media-artwork";

import {
  getSeriesDetails,
  getSeasonDetails,
} from "@/lib/tmdb";

import {
  findNextUnwatchedEpisode,
  formatNextEpisode,
  type SeasonProgressSummary,
} from "@/lib/series-progress";

import { createClient } from "@/lib/supabase/server";

/* =========================================
   TIPOS
========================================= */

type LibraryRow = {
  id: string;
  media_type: LibraryMediaType;
  external_id: string;
  title: string;
  cover_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  status: LibraryStatus;
  created_at: string;
  updated_at: string;
};

type ReviewRow = {
  id: string;
  media_type: LibraryMediaType;
  external_id: string;
  title: string;
  cover_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  rating: number | null;
  liked: boolean;
  is_rewatch: boolean;
  contains_spoilers: boolean;
  show_consumed_date: boolean | null;
  consumed_at: string;
  review_text: string | null;
  created_at: string;
};

type EpisodeWatchRow = {
  series_id: string;
  season_number: number;
  episode_number: number;
  created_at: string;
};

type ExclusionRow = {
  media_type: LibraryMediaType;
  external_id: string;
};

type BookProgressRow = {
  work_id: string;
  pages_read: number;
  total_pages: number;
};

type SeriesDetailsResponse = {
  seasons?: SeasonProgressSummary[];
};

type SeasonDetailsResponse = {
  episodes?: {
    episode_number: number;
    name: string;
  }[];
};

/* =========================================
   UTILIDADES
========================================= */

function mediaKey(
  mediaType: LibraryMediaType,
  externalId: string,
): string {
  return `${mediaType}:${externalId}`;
}

function latestDate(
  ...values: Array<string | null | undefined>
): string {
  const dates = values.filter(
    (date): date is string =>
      typeof date === "string" &&
      date.length > 0,
  );

  return (
    dates.sort().at(-1) ??
    new Date(0).toISOString()
  );
}

/* =========================================
   PÁGINA DE BIBLIOTECA
========================================= */

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  /* =========================================
     CONSULTAS PRINCIPALES
  ========================================= */

  const [
    libraryResult,
    reviewsResult,
    exclusionsResult,
    booksResult,
  ] = await Promise.all([
    supabase
      .from("library_items")
      .select(`
        id,
        media_type,
        external_id,
        title,
        cover_url,
        backdrop_url,
        release_year,
        status,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("reviews")
      .select(`
        id,
        media_type,
        external_id,
        title,
        cover_url,
        backdrop_url,
        release_year,
        rating,
        liked,
        is_rewatch,
        contains_spoilers,
        show_consumed_date,
        consumed_at,
        review_text,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("library_exclusions")
      .select("media_type,external_id")
      .eq("user_id", user.id),

    // NUEVO: progreso persistente de libros.
    // Se carga desde el servidor para evitar
    // skeletons y consultas posteriores.

    supabase
      .from("book_reading_progress")
      .select("work_id,pages_read,total_pages")
      .eq("user_id", user.id),
  ]);

  if (
    libraryResult.error ||
    reviewsResult.error ||
    exclusionsResult.error ||
    booksResult.error
  ) {
    console.error(
      "Error loading FROSTIQ library:",
      {
        library: libraryResult.error,
        reviews: reviewsResult.error,
        exclusions: exclusionsResult.error,
        books: booksResult.error,
      },
    );

    throw new Error(
      "No se pudo cargar tu biblioteca.",
    );
  }

  const libraryRows =
    (libraryResult.data ?? []) as LibraryRow[];

  const reviewRows =
    (reviewsResult.data ?? []) as ReviewRow[];

  const exclusionRows =
    (exclusionsResult.data ?? []) as ExclusionRow[];

  const bookRows =
    (booksResult.data ?? []) as BookProgressRow[];

  /* =========================================
     PROGRESO DE LIBROS
  ========================================= */

  const bookProgressByWork = new Map<
    string,
    {
      pagesRead: number;
      totalPages: number;
    }
  >();

  for (const row of bookRows) {
    bookProgressByWork.set(
      String(row.work_id),
      {
        pagesRead: Number(
          row.pages_read ?? 0,
        ),
        totalPages: Number(
          row.total_pages ?? 0,
        ),
      },
    );
  }

  /* =========================================
     EXCLUSIONES

     Solo afectan entradas activas.
     Las reviews nunca se ocultan.
  ========================================= */

  const excludedKeys = new Set(
    exclusionRows.map((row) =>
      mediaKey(
        row.media_type,
        row.external_id,
      ),
    ),
  );

  const visibleLibrary = libraryRows.filter(
    (row) =>
      !excludedKeys.has(
        mediaKey(
          row.media_type,
          row.external_id,
        ),
      ),
  );

  // Las reviews permanecen visibles aunque
  // se haya eliminado el estado activo.

  const visibleReviews = reviewRows;

  /* =========================================
     AGRUPAR REVIEWS
  ========================================= */

  const reviewsByMedia = new Map<
    string,
    ReviewRow[]
  >();

  for (const review of visibleReviews) {
    const key = mediaKey(
      review.media_type,
      review.external_id,
    );

    const current =
      reviewsByMedia.get(key) ?? [];

    current.push(review);

    reviewsByMedia.set(key, current);
  }

  const latestReviews = new Map<
    string,
    ReviewRow
  >();

  for (const [key, reviews] of reviewsByMedia) {
    const latest = [...reviews].sort(
      (a, b) =>
        b.created_at.localeCompare(
          a.created_at,
        ),
    )[0];

    if (latest) {
      latestReviews.set(key, latest);
    }
  }

  /* =========================================
     PROGRESO REAL DE SERIES
  ========================================= */

  const activeSeriesIds = Array.from(
    new Set(
      visibleLibrary
        .filter(
          (row) =>
            row.media_type === "SERIES" &&
            row.status === "IN_PROGRESS",
        )
        .map((row) => row.external_id),
    ),
  );

  const watchesBySeries = new Map<
    string,
    EpisodeWatchRow[]
  >();

  if (activeSeriesIds.length > 0) {
    const pageSize = 1000;

    for (
      let offset = 0;
      ;
      offset += pageSize
    ) {
      const { data, error } = await supabase
        .from("episode_watches")
        .select(
          "series_id,season_number,episode_number,created_at",
        )
        .eq("user_id", user.id)
        .in("series_id", activeSeriesIds)
        .order("created_at", {
          ascending: true,
        })
        .range(
          offset,
          offset + pageSize - 1,
        );

      if (error) {
        console.error(
          "Error loading episode history:",
          error,
        );

        throw new Error(
          "No se pudo cargar el historial de series.",
        );
      }

      const rows =
        (data ?? []) as EpisodeWatchRow[];

      for (const watch of rows) {
        const current =
          watchesBySeries.get(
            watch.series_id,
          ) ?? [];

        current.push(watch);

        watchesBySeries.set(
          watch.series_id,
          current,
        );
      }

      if (rows.length < pageSize) {
        break;
      }
    }
  }

  /* =========================================
     SIGUIENTE EPISODIO POR SERIE
  ========================================= */

  const nextEpisodeBySeries = new Map<
    string,
    string | null
  >();

  const batchSize = 4;

  for (
    let offset = 0;
    offset < activeSeriesIds.length;
    offset += batchSize
  ) {
    const batch = activeSeriesIds.slice(
      offset,
      offset + batchSize,
    );

    const results = await Promise.all(
      batch.map(async (seriesId) => {
        try {
          const series =
            (await getSeriesDetails(
              seriesId,
            )) as SeriesDetailsResponse;

          const next =
            findNextUnwatchedEpisode(
              series.seasons ?? [],
              watchesBySeries.get(
                seriesId,
              ) ?? [],
            );

          if (!next) {
            return {
              seriesId,
              label: null as string | null,
            };
          }

          let title: string | null = null;

          try {
            const season =
              (await getSeasonDetails(
                seriesId,
                next.seasonNumber,
              )) as SeasonDetailsResponse;

            title =
              season.episodes?.find(
                (episode) =>
                  episode.episode_number ===
                  next.episodeNumber,
              )?.name ?? null;
          } catch (error) {
            console.error(
              "Error loading next episode title:",
              seriesId,
              error,
            );
          }

          return {
            seriesId,
            label: formatNextEpisode(
              next,
              title,
            ),
          };
        } catch (error) {
          console.error(
            "Error calculating next episode:",
            seriesId,
            error,
          );

          return {
            seriesId,
            label:
              "No disponible" as string | null,
          };
        }
      }),
    );

    for (const result of results) {
      nextEpisodeBySeries.set(
        result.seriesId,
        result.label,
      );
    }
  }

  /* =========================================
     OVERRIDES DE IMÁGENES
  ========================================= */

  const artwork =
    await getMixedMediaArtworkOverrides([
      ...visibleLibrary.map((row) => ({
        media_type: row.media_type,
        external_id: row.external_id,
      })),

      ...visibleReviews.map((row) => ({
        media_type: row.media_type,
        external_id: row.external_id,
      })),
    ]);

  /* =========================================
     CONSTRUIR ENTRADAS DE BIBLIOTECA
  ========================================= */

  const entries: LibraryEntry[] = [];

  const addedKeys = new Set<string>();

  for (const row of visibleLibrary) {
    const key = mediaKey(
      row.media_type,
      row.external_id,
    );

    if (addedKeys.has(key)) {
      continue;
    }

    const latestReview =
      latestReviews.get(key);

    const override = artwork.get(
      getMediaArtworkMapKey(
        row.media_type,
        row.external_id,
      ),
    );

    entries.push({
      key,

      mediaType: row.media_type,

      externalId: row.external_id,

      title: row.title,

      coverUrl:
        override?.poster_url ??
        row.cover_url ??
        latestReview?.cover_url ??
        null,

      backdropUrl:
        override?.backdrop_url ??
        row.backdrop_url ??
        latestReview?.backdrop_url ??
        null,

      releaseYear:
        row.release_year ??
        latestReview?.release_year ??
        null,

      status: row.status,

      completedCount:
        reviewsByMedia.get(key)?.length ?? 0,

      addedAt: row.created_at,

      updatedAt: latestDate(
        row.updated_at,
        row.created_at,
        latestReview?.created_at,
      ),

      nextEpisode:
        row.media_type === "SERIES" &&
        row.status === "IN_PROGRESS"
          ? nextEpisodeBySeries.get(
              row.external_id,
            ) ?? null
          : null,

      // NUEVO:
      // Progreso del libro desde Supabase.
      // Permanece disponible tras recargar.

      bookProgress:
        row.media_type === "BOOK"
          ? bookProgressByWork.get(
              row.external_id,
            ) ?? null
          : undefined,

      posterPositionX:
        override?.poster_position_x ?? 50,

      posterPositionY:
        override?.poster_position_y ?? 50,

      posterZoom:
        override?.poster_zoom ?? 1,

      backdropPositionX:
        override?.backdrop_position_x ?? 50,

      backdropPositionY:
        override?.backdrop_position_y ?? 50,

      backdropZoom:
        override?.backdrop_zoom ?? 1,
    });

    addedKeys.add(key);
  }

  /* =========================================
     OBRAS COMPLETADAS

     Las reviews siempre permanecen visibles,
     incluso cuando una obra fue eliminada
     de sus estados activos.
  ========================================= */

  for (const [key, review] of latestReviews) {
    if (addedKeys.has(key)) {
      continue;
    }

    const override = artwork.get(
      getMediaArtworkMapKey(
        review.media_type,
        review.external_id,
      ),
    );

    entries.push({
      key,

      mediaType: review.media_type,

      externalId: review.external_id,

      title: review.title,

      coverUrl:
        override?.poster_url ??
        review.cover_url ??
        null,

      backdropUrl:
        override?.backdrop_url ??
        review.backdrop_url ??
        null,

      releaseYear:
        review.release_year ?? null,

      status: null,

      completedCount:
        reviewsByMedia.get(key)?.length ?? 0,

      addedAt: review.created_at,

      updatedAt: review.created_at,

      nextEpisode: null,

      // NUEVO:
      // También funciona para libros
      // reconstruidos desde sus reviews.

      bookProgress:
        review.media_type === "BOOK"
          ? bookProgressByWork.get(
              review.external_id,
            ) ?? null
          : undefined,

      posterPositionX:
        override?.poster_position_x ?? 50,

      posterPositionY:
        override?.poster_position_y ?? 50,

      posterZoom:
        override?.poster_zoom ?? 1,

      backdropPositionX:
        override?.backdrop_position_x ?? 50,

      backdropPositionY:
        override?.backdrop_position_y ?? 50,

      backdropZoom:
        override?.backdrop_zoom ?? 1,
    });

    addedKeys.add(key);
  }

  /* =========================================
     REVIEWS COMPLETADAS
  ========================================= */

  const completedReviews: CompletedReview[] =
    visibleReviews.map((row) => {
      const override = artwork.get(
        getMediaArtworkMapKey(
          row.media_type,
          row.external_id,
        ),
      );

      const review: LibraryReview = {
        id: row.id,

        external_id: row.external_id,

        title: row.title,

        cover_url:
          override?.poster_url ??
          row.cover_url ??
          null,

        cover_position_x:
          override?.poster_position_x ?? 50,

        cover_position_y:
          override?.poster_position_y ?? 50,

        cover_zoom:
          override?.poster_zoom ?? 1,

        release_year:
          row.release_year ?? null,

        rating: row.rating,

        liked: row.liked,

        is_rewatch: row.is_rewatch,

        contains_spoilers:
          row.contains_spoilers,

        show_consumed_date:
          row.show_consumed_date,

        consumed_at: row.consumed_at,

        review_text: row.review_text,
      };

      return {
        id: row.id,
        mediaType: row.media_type,
        createdAt: row.created_at,
        review,
      };
    });

  /* =========================================
     ORDENAMIENTO
  ========================================= */

  entries.sort((a, b) =>
    b.updatedAt.localeCompare(
      a.updatedAt,
    ),
  );

  completedReviews.sort((a, b) =>
    b.createdAt.localeCompare(
      a.createdAt,
    ),
  );

  /* =========================================
     RENDER
  ========================================= */

  return (
    <LibraryBrowser
      entries={entries}
      completedReviews={completedReviews}
    />
  );
}