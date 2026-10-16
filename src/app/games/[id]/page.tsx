import {
  notFound,
} from "next/navigation";

import GameBigPictureLayout from "@/components/games/GameBigPictureLayout";

import type {
  BigPictureMediaItem,
} from "@/components/media/MediaBigPictureShell";

import MediaReviews, {
  type MediaReviewItem,
} from "@/components/media/MediaReviews";

import {
  getIGDBBackdropUrl,
  getIGDBGame,
  getIGDBImageUrl,
  getIGDBReleaseYear,
} from "@/lib/igdb";

import {
  getMediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  getMediaRatingStats,
} from "@/lib/media-ratings";

import {
  createClient,
} from "@/lib/supabase/server";

import GameActions from "./GameActions";

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

type GameReviewRow = {
  id: string;
  user_id: string;

  review_text:
    | string
    | null;

  rating:
    | number
    | string
    | null;

  liked:
    | boolean
    | null;

  contains_spoilers:
    | boolean
    | null;

  created_at: string;

  consumed_at:
    | string
    | null;
};

type ReviewProfileRow = {
  id: string;

  username:
    | string
    | null;

  display_name:
    | string
    | null;

  avatar_url:
    | string
    | null;
};

type FollowRow = {
  following_id: string;
};

const HIDDEN_PLATFORMS =
  new Set([
    "google stadia",
    "stadia",
  ]);

function normalizePlatformKey(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function getPlatformDisplayName(
  value: string,
) {
  const clean =
    value.trim();

  const normalized =
    normalizePlatformKey(
      clean,
    );

  if (
    normalized ===
      "pc (microsoft windows)" ||
    normalized ===
      "microsoft windows" ||
    normalized ===
      "windows pc"
  ) {
    return "PC";
  }

  return clean;
}

function getPlatformPriority(
  platform: string,
) {
  const normalized =
    normalizePlatformKey(
      platform,
    );

  if (
    normalized ===
    "playstation 5"
  ) {
    return 10;
  }

  if (
    normalized.includes(
      "xbox series",
    )
  ) {
    return 20;
  }

  if (
    normalized ===
    "nintendo switch 2"
  ) {
    return 30;
  }

  if (
    normalized ===
    "pc"
  ) {
    return 40;
  }

  if (
    normalized ===
    "playstation 4"
  ) {
    return 50;
  }

  if (
    normalized ===
    "xbox one"
  ) {
    return 60;
  }

  if (
    normalized ===
    "nintendo switch"
  ) {
    return 70;
  }

  if (
    normalized ===
    "mac"
  ) {
    return 80;
  }

  if (
    normalized.includes(
      "linux",
    )
  ) {
    return 90;
  }

  return 100;
}

function cleanPlatforms(
  platforms: {
    name: string;
  }[],
) {
  const seen =
    new Set<string>();

  return platforms
    .map(
      (platform) =>
        platform.name.trim(),
    )
    .filter(Boolean)
    .filter(
      (platform) =>
        !HIDDEN_PLATFORMS.has(
          normalizePlatformKey(
            platform,
          ),
        ),
    )
    .map(
      getPlatformDisplayName,
    )
    .filter(
      (platform) => {
        const key =
          normalizePlatformKey(
            platform,
          );

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      },
    )
    .sort(
      (
        first,
        second,
      ) => {
        const priorityDifference =
          getPlatformPriority(
            first,
          ) -
          getPlatformPriority(
            second,
          );

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference;
        }

        return first.localeCompare(
          second,
          "es",
        );
      },
    );
}

function formatReleaseDate(
  timestamp:
    | number
    | undefined,
) {
  if (!timestamp) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(
      new Date(
        timestamp * 1000,
      ),
    );
  } catch {
    return null;
  }
}

function uniqueUrls(
  values: (
    | string
    | null
  )[],
) {
  return Array.from(
    new Set(
      values.filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      ),
    ),
  );
}

function normalizeRating(
  value:
    | number
    | string
    | null,
) {
  if (
    value === null
  ) {
    return null;
  }

  const numeric =
    Number(value);

  return Number.isFinite(
    numeric,
  )
    ? numeric
    : null;
}

function buildReviewItem(
  review: GameReviewRow,

  profile:
    | ReviewProfileRow
    | undefined,
): MediaReviewItem {
  const displayName =
    profile
      ?.display_name
      ?.trim() ||
    profile
      ?.username
      ?.trim() ||
    "Usuario";

  return {
    id:
      review.id,

    userId:
      review.user_id,

    username:
      profile
        ?.username ??
      null,

    displayName,

    avatarUrl:
      profile
        ?.avatar_url ??
      null,

    reviewText:
      review
        .review_text
        ?.trim() ??
      "",

    rating:
      normalizeRating(
        review.rating,
      ),

    liked:
      Boolean(
        review.liked,
      ),

    containsSpoilers:
      Boolean(
        review
          .contains_spoilers,
      ),

    createdAt:
      review.created_at,

    consumedAt:
      review.consumed_at,
  };
}

export default async function GamePage({
  params,
}: GamePageProps) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const [
    game,
    override,
    ratingStats,
    authResult,
  ] =
    await Promise.all([
      getIGDBGame(id),

      getMediaArtworkOverride(
        "game",
        id,
      ),

      getMediaRatingStats(
        "GAME",
        id,
      ),

      supabase.auth.getUser(),
    ]);

  if (!game) {
    notFound();
  }

  const user =
    authResult.data.user;

  /*
   * OWNER
   */

  let isOwner =
    false;

  if (user) {
    const {
      data: profile,

      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles",
        )
        .select(
          "special_role",
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle();

    if (
      profileError
    ) {
      console.error(
        "Error checking game owner status:",
        profileError,
      );
    }

    isOwner =
      profile
        ?.special_role ===
      "OWNER";
  }

  /*
   * ARTWORK
   */

  const automaticCover =
    getIGDBImageUrl(
      game.cover
        ?.image_id,
      "cover_big",
    );

  const automaticBackdrop =
    getIGDBBackdropUrl(
      game,
    );

  const cover =
    override
      ?.poster_url ??
    automaticCover;

  const backdrop =
    override
      ?.backdrop_url ??
    automaticBackdrop;

  /*
   * INFO
   */

  const releaseYear =
    getIGDBReleaseYear(
      game.first_release_date,
    );

  const releaseDate =
    formatReleaseDate(
      game.first_release_date,
    );

  const platforms =
    cleanPlatforms(
      game.platforms ??
        [],
    );

  const genres =
    Array.from(
      new Set(
        (
          game.genres ??
          []
        )
          .map(
            (genre) =>
              genre.name.trim(),
          )
          .filter(
            Boolean,
          ),
      ),
    );

  /*
   * REVIEWS
   */

  const {
    data:
      reviewRowsData,

    error:
      reviewsError,
  } =
    await supabase
      .from(
        "reviews",
      )
      .select(`
        id,
        user_id,
        review_text,
        rating,
        liked,
        contains_spoilers,
        created_at,
        consumed_at
      `)
      .eq(
        "media_type",
        "GAME",
      )
      .eq(
        "external_id",
        String(
          game.id,
        ),
      )
      .not(
        "review_text",
        "is",
        null,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(50);

  if (
    reviewsError
  ) {
    console.error(
      "Error loading game reviews:",
      reviewsError,
    );
  }

  const reviewRows =
    (
      reviewRowsData ??
      []
    ) as GameReviewRow[];

  /*
   * No enseñamos registros
   * que no tengan realmente
   * texto de review.
   */

  const reviewsWithText =
    reviewRows.filter(
      (review) =>
        Boolean(
          review
            .review_text
            ?.trim(),
        ),
    );

  /*
   * PERFILES DE LOS AUTORES
   */

  const reviewUserIds =
    Array.from(
      new Set(
        reviewsWithText.map(
          (review) =>
            review.user_id,
        ),
      ),
    );

  let reviewProfiles:
    ReviewProfileRow[] =
      [];

  if (
    reviewUserIds.length >
    0
  ) {
    const {
      data:
        profilesData,

      error:
        profilesError,
    } =
      await supabase
        .from(
          "profiles",
        )
        .select(`
          id,
          username,
          display_name,
          avatar_url
        `)
        .in(
          "id",
          reviewUserIds,
        );

    if (
      profilesError
    ) {
      console.error(
        "Error loading game review profiles:",
        profilesError,
      );
    }

    reviewProfiles =
      (
        profilesData ??
        []
      ) as ReviewProfileRow[];
  }

  const profileByUserId =
    new Map(
      reviewProfiles.map(
        (
          profile,
        ) => [
          profile.id,
          profile,
        ],
      ),
    );

  /*
   * USUARIOS SEGUIDOS
   */

  let followingIds =
    new Set<string>();

  if (user) {
    const {
      data:
        followingData,

      error:
        followingError,
    } =
      await supabase
        .from(
          "profile_follows",
        )
        .select(
          "following_id",
        )
        .eq(
          "follower_id",
          user.id,
        );

    if (
      followingError
    ) {
      console.error(
        "Error loading followed users for game reviews:",
        followingError,
      );
    }

    followingIds =
      new Set(
        (
          followingData ??
          []
        ).map(
          (follow) =>
            (
              follow as FollowRow
            ).following_id,
        ),
      );
  }

  /*
   * CONVERTIR A MediaReviewItem
   */

  const allReviews =
    reviewsWithText.map(
      (review) =>
        buildReviewItem(
          review,

          profileByUserId.get(
            review.user_id,
          ),
        ),
    );

  /*
   * Amigos separados
   * de las reviews normales
   * para no duplicarlas.
   */

  const friendReviews =
    allReviews.filter(
      (review) =>
        followingIds.has(
          review.userId,
        ),
    );

  const communityReviews =
    allReviews.filter(
      (review) =>
        !followingIds.has(
          review.userId,
        ),
    );

  const reviewsContent = (
    <MediaReviews
      friendReviews={
        friendReviews
      }
      reviews={
        communityReviews
      }
      mediaTitle={
        game.name
      }
      mediaYear={
        releaseYear
      }
      mediaPosterUrl={
        cover
      }
      mediaTypeLabel="Juego"
    />
  );

  /*
   * GALERÍA
   */

  const screenshotUrls =
    uniqueUrls(
      (
        game.screenshots ??
        []
      ).map(
        (screenshot) =>
          getIGDBImageUrl(
            screenshot
              .image_id,
            "1080p",
          ),
      ),
    );

  const artworkUrls =
    uniqueUrls(
      (
        game.artworks ??
        []
      ).map(
        (artwork) =>
          getIGDBImageUrl(
            artwork
              .image_id,
            "1080p",
          ),
      ),
    ).filter(
      (url) =>
        url !==
        backdrop,
    );

  const galleryItems:
    BigPictureMediaItem[] =
      [
        ...screenshotUrls.map(
          (
            url,
            index,
          ) => ({
            id:
              `game-${game.id}-screenshot-${index}`,

            src:
              url,

            alt:
              `${game.name} captura ${index + 1}`,
          }),
        ),

        ...artworkUrls.map(
          (
            url,
            index,
          ) => ({
            id:
              `game-${game.id}-artwork-${index}`,

            src:
              url,

            alt:
              `${game.name} artwork ${index + 1}`,
          }),
        ),
      ].slice(
        0,
        10,
      );

  /*
   * DEV / EDIT ART
   */

  const devSearchParams =
    new URLSearchParams({
      kind:
        "game",

      id:
        String(
          game.id,
        ),

      title:
        game.name,

      href:
        `/games/${game.id}`,
    });

  if (cover) {
    devSearchParams.set(
      "image",
      cover,
    );
  }

  if (
    releaseYear
  ) {
    devSearchParams.set(
      "year",

      String(
        releaseYear,
      ),
    );
  }

  const developerActionHref =
    isOwner
      ? `/admin/media?${devSearchParams.toString()}`
      : null;

  /*
   * ACCIONES
   */

  const actions =
    user ? (
      <GameActions
        game={{
          id:
            String(
              game.id,
            ),

          title:
            game.name,

          coverUrl:
            cover,

          backdropUrl:
            backdrop,

          releaseYear,
        }}
      />
    ) : undefined;

  return (
    <GameBigPictureLayout
      title={
        game.name
      }
      description={
        game.summary ??
        null
      }
      posterUrl={
        cover
      }
      backdropUrl={
        backdrop
      }
      posterPositionX={
        override
          ?.poster_position_x ??
        50
      }
      posterPositionY={
        override
          ?.poster_position_y ??
        50
      }
      posterZoom={
        override
          ?.poster_zoom ??
        1
      }
      backdropPositionX={
        override
          ?.backdrop_position_x ??
        50
      }
      backdropPositionY={
        override
          ?.backdrop_position_y ??
        50
      }
      backdropZoom={
        override
          ?.backdrop_zoom ??
        1
      }
      galleryItems={
        galleryItems
      }
      year={
        releaseYear
      }
      releaseDate={
        releaseDate
      }
      platforms={
        platforms
      }
      genres={
        genres
      }
      ratingStats={
        ratingStats
      }
      actions={
        actions
      }
      mainContent={
        reviewsContent
      }
      developerActionHref={
        developerActionHref
      }
    />
  );
}