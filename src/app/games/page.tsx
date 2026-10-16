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

type LibraryGame = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;

  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "DROPPED";
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
      override
        ?.poster_url ??
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

export default async function GamesPage() {
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
          "GAME"
        )
        .in(
          "status",
          [
            "PENDING",
            "IN_PROGRESS",
            "DROPPED",
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
          review_text
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "GAME"
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
    libraryResult.error ||
    reviewsResult.error
  ) {
    console.error(
      "Error loading games:",
      libraryResult.error,
      reviewsResult.error
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Juegos
        </h1>

        <p className="mt-4 text-red-400">
          No se pudieron cargar tus juegos.
        </p>
      </main>
    );
  }

  const games =
    (
      libraryResult.data ??
      []
    ) as LibraryGame[];

  const completed =
    (
      reviewsResult.data ??
      []
    ) as LibraryReview[];

  const overrides =
    await getMediaArtworkOverrides(
      "game",
      [
        ...games.map(
          (
            game
          ) =>
            game.external_id
        ),

        ...completed.map(
          (
            review
          ) =>
            review.external_id
        ),
      ]
    );

  const completedWithArtwork =
    completed.map(
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

  const playing =
    games.filter(
      (
        game
      ) =>
        game.status ===
        "IN_PROGRESS"
    );

  const pending =
    games.filter(
      (
        game
      ) =>
        game.status ===
        "PENDING"
    );

  const dropped =
    games.filter(
      (
        game
      ) =>
        game.status ===
        "DROPPED"
    );

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Juegos
        </h1>

        <p className="mt-2 text-zinc-400">
          Tus juegos en progreso, completados, pendientes y abandonados
        </p>
      </div>

      <GameSection
        title="Jugando"
        games={
          playing
        }
        overrides={
          overrides
        }
        emptyText="No estás jugando ningún juego actualmente."
        label="Jugando"
      />

      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Completados
        </h2>

        {completedWithArtwork.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has completado ningún juego.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {completedWithArtwork.map(
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
                  mediaType="GAME"
                />
              )
            )}
          </div>
        )}
      </section>

      <GameSection
        title="Pendientes"
        games={
          pending
        }
        overrides={
          overrides
        }
        emptyText="No tienes juegos pendientes."
        label="Pendiente"
      />

      <GameSection
        title="Abandonados"
        games={
          dropped
        }
        overrides={
          overrides
        }
        emptyText="No tienes juegos abandonados."
        label="Abandonado"
      />
    </main>
  );
}

function GameSection({
  title,
  games,
  overrides,
  emptyText,
  label,
}: {
  title:
    string;

  games:
    LibraryGame[];

  overrides:
    Map<
      string,
      MediaArtworkOverride
    >;

  emptyText:
    string;

  label:
    string;
}) {
  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold">
        {
          title
        }
      </h2>

      {games.length ===
      0 ? (
        <p className="mt-4 text-zinc-500">
          {
            emptyText
          }
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {games.map(
            (
              game
            ) => (
              <GameCard
                key={
                  game.id
                }
                game={
                  game
                }
                artwork={
                  getArtwork(
                    game.cover_url,
                    overrides.get(
                      game.external_id
                    )
                  )
                }
                label={
                  label
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function GameCard({
  game,
  artwork,
  label,
}: {
  game:
    LibraryGame;

  artwork:
    ArtworkProps;

  label:
    string;
}) {
  return (
    <Link
      href={`/games/${game.external_id}`}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition group-hover:border-zinc-500">
        {artwork.coverUrl ? (
          <Image
            src={
              artwork.coverUrl
            }
            alt={
              game.title
            }
            fill
            sizes="250px"
            unoptimized={
              shouldUseOriginalImage(
                artwork.coverUrl
              )
            }
            className="object-cover"
            style={{
              objectPosition:
                `${artwork.positionX}% ${artwork.positionY}%`,

              transform:
                `scale(${artwork.zoom})`,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900 px-4 text-center text-zinc-600">
            Sin imagen
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="line-clamp-2 font-semibold text-zinc-100">
          {
            game.title
          }
        </h3>

        <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
          {game.release_year && (
            <>
              <span>
                {
                  game.release_year
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