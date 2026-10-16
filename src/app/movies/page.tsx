import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import Image from "next/image";
import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  getMediaArtworkOverrides,
  type MediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  createClient,
} from "@/lib/supabase/server";

import ReviewModalCard from "./ReviewModalCard";

type PendingMovie = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;
};

type ReviewRow = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  rating: number | null;
  liked: boolean;
  is_rewatch: boolean;
  contains_spoilers: boolean;
  show_consumed_date: boolean;
  consumed_at: string;
  review_text: string | null;
  created_at: string;
};

export default async function MoviesPage() {
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
    pendingResult,
    reviewsResult,
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
          release_year
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "MOVIE"
        )
        .eq(
          "status",
          "PENDING"
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
          show_consumed_date,
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
          "MOVIE"
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
    ]);

  if (
    pendingResult.error ||
    reviewsResult.error
  ) {
    console.error(
      "Error loading movies:",
      pendingResult.error,
      reviewsResult.error
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Películas
        </h1>

        <p className="mt-4 text-red-400">
          No se pudo cargar tu biblioteca.
        </p>
      </main>
    );
  }

  const pending =
    (
      pendingResult.data ??
      []
    ) as PendingMovie[];

  const watched =
    (
      reviewsResult.data ??
      []
    ) as ReviewRow[];

  const artwork =
    await getMediaArtworkOverrides(
      "movie",
      [
        ...pending.map(
          (
            item
          ) =>
            item.external_id
        ),

        ...watched.map(
          (
            item
          ) =>
            item.external_id
        ),
      ]
    );

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Películas
        </h1>

        <p className="mt-2 text-zinc-400">
          Tus películas vistas y pendientes
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Vistas
        </h2>

        {watched.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has marcado ninguna película como vista.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {watched.map(
              (
                review
              ) => {
                const override =
                  artwork.get(
                    review.external_id
                  );

                const resolvedReview = {
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

                return (
                  <ReviewModalCard
                    key={
                      review.id
                    }
                    review={
                      resolvedReview
                    }
                  />
                );
              }
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
            No tienes películas pendientes.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {pending.map(
              (
                movie
              ) => {
                const override =
                  artwork.get(
                    movie.external_id
                  );

                return (
                  <Link
                    key={
                      movie.id
                    }
                    href={`/movies/${movie.external_id}`}
                    className="block"
                  >
                    <MovieCover
                      title={
                        movie.title
                      }
                      coverUrl={
                        override
                          ?.poster_url ??
                        movie.cover_url
                      }
                      artwork={
                        override
                      }
                    />

                    <div className="mt-3">
                      <h3 className="font-semibold text-zinc-100">
                        {
                          movie.title
                        }
                      </h3>

                      <div className="mt-1 flex gap-2 text-sm text-zinc-500">
                        {movie.release_year && (
                          <>
                            <span>
                              {
                                movie.release_year
                              }
                            </span>

                            <span>
                              ·
                            </span>
                          </>
                        )}

                        <span>
                          Pendiente
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function MovieCover({
  title,
  coverUrl,
  artwork,
}: {
  title:
    string;

  coverUrl:
    | string
    | null;

  artwork:
    | MediaArtworkOverride
    | undefined;
}) {
  return (
    <div className="aspect-[2/3] overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition-colors duration-200 hover:border-zinc-400">
      {coverUrl ? (
        <Image
          src={
            coverUrl
          }
          alt={
            title
          }
          width={
            500
          }
          height={
            750
          }
          unoptimized={
            shouldUseOriginalImage(
              coverUrl
            )
          }
          className="h-full w-full object-cover"
          style={{
            objectPosition:
              `${artwork?.poster_position_x ?? 50}% ${artwork?.poster_position_y ?? 50}%`,

            transform:
              `scale(${artwork?.poster_zoom ?? 1})`,
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