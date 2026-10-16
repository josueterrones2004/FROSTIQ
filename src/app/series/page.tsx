import Image from "next/image";
import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import LibraryReviewModalCard, {
  type LibraryReview,
} from "@/components/media/LibraryReviewModalCard";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  getMediaArtworkOverrides,
  type MediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  createClient,
} from "@/lib/supabase/server";

type LibrarySeries = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;

  status:
    | "PENDING"
    | "IN_PROGRESS";
};

type EpisodeWatchRow = {
  id: string;
  series_id: string;

  season_number: number;
  episode_number: number;
  episode_title: string;

  is_rewatch: boolean;

  watched_at: string;
  created_at: string;
};

type LastEpisode = {
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
};

type ArtworkProps = {
  coverUrl:
    | string
    | null;

  positionX:
    number;

  positionY:
    number;

  zoom:
    number;
};

function getArtwork(
  original:
    string |
    null,

  override:
    MediaArtworkOverride |
    undefined
): ArtworkProps {
  return {
    coverUrl:
      override?.poster_url ??
      original,

    positionX:
      override
        ?.poster_position_x ??
      50,

    positionY:
      override
        ?.poster_position_y ??
      50,

    zoom:
      override
        ?.poster_zoom ??
      1,
  };
}

export default async function SeriesPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth"
    );
  }

  const [
    libraryResult,
    reviewsResult,
    episodesResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "library_items"
        )
        .select(`
          id,
          external_id,
          title,
          cover_url,
          release_year,
          status
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "SERIES"
        )
        .in(
          "status",
          [
            "PENDING",
            "IN_PROGRESS",
          ]
        )
        .order(
          "updated_at",
          {
            ascending:
              false,
          }
        ),

      supabase
        .from(
          "reviews"
        )
        .select(`
          id,
          external_id,
          title,
          cover_url,
          release_year,
          rating,
          liked,
          is_rewatch,
          contains_spoilers,
          consumed_at,
          review_text,
          created_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "SERIES"
        )
        .order(
          "consumed_at",
          {
            ascending:
              false,
          }
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        ),

      supabase
        .from(
          "episode_watches"
        )
        .select(`
          id,
          series_id,
          season_number,
          episode_number,
          episode_title,
          is_rewatch,
          watched_at,
          created_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        ),
    ]);

  if (
    libraryResult.error ||
    reviewsResult.error ||
    episodesResult.error
  ) {
    console.error(
      "Error loading series:",
      libraryResult.error,
      reviewsResult.error,
      episodesResult.error
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Series
        </h1>

        <p className="mt-4 text-red-400">
          No se pudo cargar tu biblioteca.
        </p>
      </main>
    );
  }

  const library =
    (
      libraryResult.data ??
      []
    ) as LibrarySeries[];

  const watched =
    (
      reviewsResult.data ??
      []
    ) as LibraryReview[];

  const episodeWatches =
    (
      episodesResult.data ??
      []
    ) as EpisodeWatchRow[];

  const overrides =
    await getMediaArtworkOverrides(
      "series",
      [
        ...library.map(
          (
            show
          ) =>
            show.external_id
        ),

        ...watched.map(
          (
            review
          ) =>
            review.external_id
        ),
      ]
    );

  const watchedWithArtwork =
    watched.map(
      (
        review
      ) => {
        const override =
          overrides.get(
            review.external_id
          );

        return {
          ...review,

          cover_url:
            override
              ?.poster_url ??
            review.cover_url,

          cover_position_x:
            override
              ?.poster_position_x ??
            50,

          cover_position_y:
            override
              ?.poster_position_y ??
            50,

          cover_zoom:
            override
              ?.poster_zoom ??
            1,
        };
      }
    );

  const watching =
    library.filter(
      (
        show
      ) =>
        show.status ===
        "IN_PROGRESS"
    );

  const pending =
    library.filter(
      (
        show
      ) =>
        show.status ===
        "PENDING"
    );

  const lastEpisodeBySeries =
    new Map<
      string,
      LastEpisode
    >();

  for (
    const watch of
    episodeWatches
  ) {
    if (
      lastEpisodeBySeries.has(
        watch.series_id
      )
    ) {
      continue;
    }

    lastEpisodeBySeries.set(
      watch.series_id,
      {
        seasonNumber:
          watch.season_number,

        episodeNumber:
          watch.episode_number,

        episodeTitle:
          watch.episode_title,
      }
    );
  }

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Series
        </h1>

        <p className="mt-2 text-zinc-400">
          Tus series en curso, vistas y pendientes
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Viendo
        </h2>

        {watching.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            No estás viendo ninguna serie actualmente.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {watching.map(
              (
                show
              ) => (
                <WatchingSeriesCard
                  key={
                    show.id
                  }
                  show={
                    show
                  }
                  artwork={
                    getArtwork(
                      show.cover_url,
                      overrides.get(
                        show.external_id
                      )
                    )
                  }
                  lastEpisode={
                    lastEpisodeBySeries.get(
                      show.external_id
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Vistas
        </h2>

        {watchedWithArtwork.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has marcado ninguna serie como vista.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {watchedWithArtwork.map(
              (
                review
              ) => (
                <LibraryReviewModalCard
                  key={
                    review.id
                  }
                  review={
                    review
                  }
                  mediaType="SERIES"
                />
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Pendientes
        </h2>

        {pending.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            No tienes series pendientes.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {pending.map(
              (
                show
              ) => (
                <SeriesLibraryCard
                  key={
                    show.id
                  }
                  show={
                    show
                  }
                  artwork={
                    getArtwork(
                      show.cover_url,
                      overrides.get(
                        show.external_id
                      )
                    )
                  }
                  label="Pendiente"
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function WatchingSeriesCard({
  show,
  artwork,
  lastEpisode,
}: {
  show:
    LibrarySeries;

  artwork:
    ArtworkProps;

  lastEpisode:
    | LastEpisode
    | undefined;
}) {
  return (
    <Link
      href={`/series/${show.external_id}`}
      className="block"
    >
      <SeriesCover
        title={
          show.title
        }
        artwork={
          artwork
        }
      />

      <div className="mt-3">
        <h3 className="font-semibold text-zinc-100">
          {
            show.title
          }
        </h3>

        <div className="mt-1 flex gap-2 text-sm text-zinc-500">
          {show.release_year && (
            <>
              <span>
                {
                  show.release_year
                }
              </span>

              <span>
                ·
              </span>
            </>
          )}

          <span>
            Viendo
          </span>
        </div>

        {lastEpisode ? (
          <div className="mt-3">
            <p className="text-xs text-zinc-600">
              Último episodio visto
            </p>

            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
              T
              {
                lastEpisode.seasonNumber
              }{" "}
              E
              {
                lastEpisode.episodeNumber
              }
              {" · "}
              {
                lastEpisode.episodeTitle
              }
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-600">
            Aún no has marcado episodios
          </p>
        )}
      </div>
    </Link>
  );
}

function SeriesLibraryCard({
  show,
  artwork,
  label,
}: {
  show:
    LibrarySeries;

  artwork:
    ArtworkProps;

  label:
    string;
}) {
  return (
    <Link
      href={`/series/${show.external_id}`}
      className="block"
    >
      <SeriesCover
        title={
          show.title
        }
        artwork={
          artwork
        }
      />

      <div className="mt-3">
        <h3 className="font-semibold text-zinc-100">
          {
            show.title
          }
        </h3>

        <div className="mt-1 flex gap-2 text-sm text-zinc-500">
          {show.release_year && (
            <>
              <span>
                {
                  show.release_year
                }
              </span>

              <span>
                ·
              </span>
            </>
          )}

          <span>
            {
              label
            }
          </span>
        </div>
      </div>
    </Link>
  );
}

function SeriesCover({
  title,
  artwork,
}: {
  title:
    string;

  artwork:
    ArtworkProps;
}) {
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition hover:border-zinc-400">
      {artwork.coverUrl ? (
        <Image
          src={
            artwork.coverUrl
          }
          alt={
            title
          }
          fill
          unoptimized={
            shouldUseOriginalImage(
              artwork.coverUrl
            )
          }
          sizes="250px"
          className="object-cover"
          style={{
            objectPosition:
              `${artwork.positionX}% ${artwork.positionY}%`,

            transform:
              `scale(${artwork.zoom})`,
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-zinc-800 px-4 text-center text-zinc-500">
          Sin imagen
        </div>
      )}
    </div>
  );
}