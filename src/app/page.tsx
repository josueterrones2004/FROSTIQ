import {
  Heart,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import PublicLanding from "@/components/home/PublicLanding";

import DiscoverSection from "@/components/home/DiscoverSection";

import {
  getDiscoverItems,
} from "@/lib/discover";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  getMediaArtworkMapKey,
  getMixedMediaArtworkOverrides,
} from "@/lib/media-artwork";

import {
  createClient,
} from "@/lib/supabase/server";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

type ActivityType =
  | "ADDED_PENDING"
  | "STARTED"
  | "EPISODE_WATCHED"
  | "COMPLETED"
  | "REVIEWED";

type ArtworkFields = {
  poster_position_x?:
    number;

  poster_position_y?:
    number;

  poster_zoom?:
    number;
};

type LibraryItem = {
  id:
    string;

  external_id:
    string;

  media_type:
    MediaType;

  title:
    string;

  cover_url:
    | string
    | null;

  release_year:
    | number
    | null;

  status:
    string;

  created_at:
    string;
} & ArtworkFields;

type ActivityEvent = {
  id:
    string;

  user_id:
    string;

  activity_type:
    ActivityType;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  season_number:
    | number
    | null;

  episode_number:
    | number
    | null;

  episode_title:
    | string
    | null;

  created_at:
    string;
} & ArtworkFields;

type FriendProfile = {
  id:
    string;

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

type FriendReview = {
  id:
    string;

  user_id:
    string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  review_text:
    | string
    | null;

  liked:
    boolean;

  contains_spoilers:
    boolean;

  cover_url:
    | string
    | null;

  created_at:
    string;
} & ArtworkFields;

type SingleFriendActivity = {
  type:
    "single";

  activity:
    ActivityEvent;
};

type EpisodeActivityGroup = {
  type:
    "episode-group";

  id:
    string;

  user_id:
    string;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  poster_position_x?:
    number;

  poster_position_y?:
    number;

  poster_zoom?:
    number;

  season_number:
    | number
    | null;

  episode_numbers:
    number[];

  created_at:
    string;
};

type FriendActivityItem =
  | SingleFriendActivity
  | EpisodeActivityGroup;

export default async function HomePage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (
    !user
  ) {
    return (
      <PublicLanding />
    );
  }

  const [
    libraryResult,
    activityResult,
    followingResult,
    discoverItems,
  ] =
    await Promise.all([
      supabase
        .from(
          "library_items"
        )
        .select(`
          id,
          external_id,
          media_type,
          title,
          cover_url,
          release_year,
          status,
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

      supabase
        .from(
          "activity_events"
        )
        .select(`
          id,
          user_id,
          activity_type,
          media_type,
          external_id,
          title,
          cover_url,
          season_number,
          episode_number,
          episode_title,
          created_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .in(
          "activity_type",
          [
            "EPISODE_WATCHED",
            "COMPLETED",
            "REVIEWED",
          ]
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          6
        ),

      supabase
        .from(
          "profile_follows"
        )
        .select(
          "following_id"
        )
        .eq(
          "follower_id",
          user.id
        ),

      getDiscoverItems()
        .catch(
          (
            error
          ) => {
            console.error(
              "Error loading discover items:",
              error
            );

            return [];
          }
        ),
    ]);

  if (
    libraryResult.error
  ) {
    return (
      <main>
        <p className="text-red-400">
          No se pudo cargar tu biblioteca.
        </p>
      </main>
    );
  }

  if (
    activityResult.error
  ) {
    console.error(
      "Error loading activity:",
      activityResult.error
    );
  }

  if (
    followingResult.error
  ) {
    console.error(
      "Error loading following:",
      followingResult.error
    );
  }

  const rawLibrary =
    (
      libraryResult.data ??
      []
    ) as LibraryItem[];

  const rawOwnActivity =
    (
      activityResult.data ??
      []
    ) as ActivityEvent[];

  const followingIds =
    (
      followingResult.data ??
      []
    ).map(
      (
        follow
      ) =>
        follow.following_id
    );

  let rawFriendActivity:
    ActivityEvent[] =
    [];

  let rawFriendReviews:
    FriendReview[] =
    [];

  const friendProfiles =
    new Map<
      string,
      FriendProfile
    >();

  if (
    followingIds.length >
    0
  ) {
    const [
      friendActivityResult,
      friendReviewsResult,
      friendProfilesResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "activity_events"
          )
          .select(`
            id,
            user_id,
            activity_type,
            media_type,
            external_id,
            title,
            cover_url,
            season_number,
            episode_number,
            episode_title,
            created_at
          `)
          .in(
            "user_id",
            followingIds
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(
            40
          ),

        supabase
          .from(
            "reviews"
          )
          .select(`
            id,
            user_id,
            media_type,
            external_id,
            title,
            review_text,
            liked,
            contains_spoilers,
            cover_url,
            created_at
          `)
          .in(
            "user_id",
            followingIds
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(
            30
          ),

        supabase
          .from(
            "profiles"
          )
          .select(`
            id,
            username,
            display_name,
            avatar_url
          `)
          .in(
            "id",
            followingIds
          ),
      ]);

    if (
      friendActivityResult.error
    ) {
      console.error(
        "Error loading friend activity:",
        friendActivityResult.error
      );
    }

    if (
      friendReviewsResult.error
    ) {
      console.error(
        "Error loading friend reviews:",
        friendReviewsResult.error
      );
    }

    if (
      friendProfilesResult.error
    ) {
      console.error(
        "Error loading friend profiles:",
        friendProfilesResult.error
      );
    }

    rawFriendActivity =
      (
        friendActivityResult.data ??
        []
      ) as ActivityEvent[];

    rawFriendReviews =
      (
        friendReviewsResult.data ??
        []
      ).filter(
        (
          review
        ) =>
          Boolean(
            review.review_text
              ?.trim()
          )
      ) as FriendReview[];

    for (
      const profile of
      friendProfilesResult.data ??
      []
    ) {
      friendProfiles.set(
        profile.id,
        profile as FriendProfile
      );
    }
  }

  /*
   * ARTWORK GLOBAL
   */

  const artworkOverrides =
    await getMixedMediaArtworkOverrides([
      ...rawLibrary,
      ...rawOwnActivity,
      ...rawFriendActivity,
      ...rawFriendReviews,
    ]);

  function applyArtwork<
    T extends {
      media_type:
        MediaType;

      external_id:
        string;

      cover_url:
        | string
        | null;
    }
  >(
    item:
      T
  ): T &
    ArtworkFields {
    const override =
      artworkOverrides.get(
        getMediaArtworkMapKey(
          item.media_type,
          item.external_id
        )
      );

    return {
      ...item,

      cover_url:
        override
          ?.poster_url ??
        item.cover_url,

      poster_position_x:
        override
          ?.poster_position_x ??
        50,

      poster_position_y:
        override
          ?.poster_position_y ??
        50,

      poster_zoom:
        override
          ?.poster_zoom ??
        1,
    };
  }

  const library =
    rawLibrary.map(
      applyArtwork
    );

  const ownActivity =
    rawOwnActivity.map(
      applyArtwork
    );

  const friendActivitySource =
    rawFriendActivity.map(
      applyArtwork
    );

  const reviewPool =
    rawFriendReviews.map(
      applyArtwork
    );

  const pendingItems =
    library
      .filter(
        (
          item
        ) => {
          if (
            item.media_type ===
              "GAME" ||
            item.media_type ===
              "SERIES"
          ) {
            return (
              item.status ===
              "IN_PROGRESS"
            );
          }

          if (
            item.media_type ===
              "MOVIE" ||
            item.media_type ===
              "BOOK"
          ) {
            return (
              item.status ===
              "PENDING"
            );
          }

          return false;
        }
      )
      .slice(
        0,
        12
      );

  const friendReviews =
    randomSubset(
      reviewPool,
      3
    );

  const friendActivity =
    groupFriendActivity(
      friendActivitySource
    ).slice(
      0,
      5
    );

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1440px] overflow-x-hidden pb-14">
      {/* TENDENCIAS */}

      <DiscoverSection
        items={
          discoverItems
        }
      />

      {/* PENDIENTE */}

      <HomeSection
        title="Pendiente"
        subtitle="Lo próximo y lo que tienes en curso"
      >
        {pendingItems.length ===
        0 ? (
          <EmptyState>
            No tienes películas o libros pendientes, ni series o juegos en curso.
          </EmptyState>
        ) : (
          <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-6 xl:gap-x-5">
            {pendingItems.map(
              (
                item
              ) => (
                <MediaPoster
                  key={
                    item.id
                  }
                  href={getMediaHref(
                    item.media_type,
                    item.external_id
                  )}
                  title={
                    item.title
                  }
                  image={
                    item.cover_url
                  }
                  positionX={
                    item.poster_position_x ??
                    50
                  }
                  positionY={
                    item.poster_position_y ??
                    50
                  }
                  zoom={
                    item.poster_zoom ??
                    1
                  }
                  footer={getPendingLabel(
                    item.media_type
                  )}
                />
              )
            )}
          </div>
        )}
      </HomeSection>

      {/* RESUMEN */}

      <div className="mt-11 grid min-w-0 gap-10 xl:grid-cols-2 xl:gap-12">
        {/* TU ACTIVIDAD */}

        <HomeSection
          title="Tu actividad"
          subtitle="Lo último que terminaste o viste"
          compact
        >
          {ownActivity.length ===
          0 ? (
            <EmptyState>
              Todavía no tienes actividad reciente.
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/30">
              {ownActivity.map(
                (
                  activity,
                  index
                ) => (
                  <RecentActivityRow
                    key={
                      activity.id
                    }
                    activity={
                      activity
                    }
                    border={
                      index !==
                      ownActivity.length -
                        1
                    }
                  />
                )
              )}
            </div>
          )}
        </HomeSection>

        {/* ACTIVIDAD AMIGOS */}

        <HomeSection
          title="Actividad de amigos"
          subtitle="Un vistazo rápido a las personas que sigues"
          compact
          action={
            <Link
              href="/social"
              className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600 transition hover:text-fuchsia-400"
            >
              Ver social
            </Link>
          }
        >
          {friendActivity.length ===
          0 ? (
            <EmptyState>
              Cuando las personas que sigues tengan actividad, aparecerá aquí.
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/30">
              {friendActivity.map(
                (
                  item,
                  index
                ) => {
                  const userId =
                    item.type ===
                    "single"
                      ? item
                          .activity
                          .user_id
                      : item.user_id;

                  const profile =
                    friendProfiles.get(
                      userId
                    );

                  return (
                    <FriendActivityRow
                      key={
                        item.type ===
                        "single"
                          ? item
                              .activity
                              .id
                          : item.id
                      }
                      item={
                        item
                      }
                      profile={
                        profile ??
                        null
                      }
                      border={
                        index !==
                        friendActivity.length -
                          1
                      }
                    />
                  );
                }
              )}
            </div>
          )}
        </HomeSection>
      </div>

      {/* REVIEWS */}

      <HomeSection
        title="Reviews de tu círculo"
        subtitle="Opiniones recientes de las personas que sigues"
        action={
          <Link
            href="/social"
            className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600 transition hover:text-fuchsia-400"
          >
            Ver social
          </Link>
        }
      >
        {friendReviews.length ===
        0 ? (
          <EmptyState>
            Cuando las personas que sigues escriban reviews, algunas aparecerán aquí.
          </EmptyState>
        ) : (
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {friendReviews.map(
              (
                review
              ) => {
                const profile =
                  friendProfiles.get(
                    review.user_id
                  );

                return (
                  <FriendReviewCard
                    key={
                      review.id
                    }
                    review={
                      review
                    }
                    profile={
                      profile ??
                      null
                    }
                  />
                );
              }
            )}
          </div>
        )}
      </HomeSection>
    </main>
  );
}

function HomeSection({
  title,
  subtitle,
  action,
  compact = false,
  children,
}: {
  title:
    string;

  subtitle?:
    string;

  action?:
    React.ReactNode;

  compact?:
    boolean;

  children:
    React.ReactNode;
}) {
  return (
    <section
      className={
        compact
          ? "min-w-0"
          : "mt-10 min-w-0 first:mt-0"
      }
    >
      <div className="mb-4 flex min-w-0 flex-col gap-2 border-b border-zinc-800 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
            {
              title
            }
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-zinc-600">
              {
                subtitle
              }
            </p>
          )}
        </div>

        {
          action
        }
      </div>

      {
        children
      }
    </section>
  );
}

function MediaPoster({
  href,
  title,
  image,
  positionX,
  positionY,
  zoom,
  footer,
}: {
  href:
    string;

  title:
    string;

  image:
    | string
    | null;

  positionX:
    number;

  positionY:
    number;

  zoom:
    number;

  footer:
    string;
}) {
  return (
    <Link
      href={
        href
      }
      className="group block min-w-0"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition group-hover:border-zinc-600">
        {image ? (
          <Image
            src={
              image
            }
            alt={
              title
            }
            fill
            sizes="(max-width: 640px) 50vw, 250px"
            unoptimized={
              shouldUseOriginalImage(
                image
              )
            }
            className="object-cover transition duration-200 group-hover:brightness-110"
            style={{
              objectPosition:
                `${positionX}% ${positionY}%`,

              transform:
                `scale(${zoom})`,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-sm text-zinc-600">
            Sin imagen
          </div>
        )}
      </div>

      <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-zinc-300 transition group-hover:text-white sm:text-[15px]">
        {
          title
        }
      </h3>

      <p className="mt-0.5 truncate text-xs text-zinc-600 sm:text-[13px]">
        {
          footer
        }
      </p>
    </Link>
  );
}

function RecentActivityRow({
  activity,
  border,
}: {
  activity:
    ActivityEvent;

  border:
    boolean;
}) {
  return (
    <Link
      href={getMediaHref(
        activity.media_type,
        activity.external_id
      )}
      className={`group flex min-w-0 items-center gap-3 px-3 py-3.5 transition hover:bg-zinc-900/45 sm:px-4 ${
        border
          ? "border-b border-zinc-900"
          : ""
      }`}
    >
      <SmallCover
        image={
          activity.cover_url
        }
        title={
          activity.title
        }
        positionX={
          activity.poster_position_x ??
          50
        }
        positionY={
          activity.poster_position_y ??
          50
        }
        zoom={
          activity.poster_zoom ??
          1
        }
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-5">
          <span className="text-zinc-600">
            {getOwnActivityText(
              activity
            )}{" "}
          </span>

          <span className="font-medium text-zinc-300 transition group-hover:text-white">
            {
              activity.title
            }
          </span>
        </p>

        {activity.activity_type ===
          "EPISODE_WATCHED" &&
          activity.episode_title && (
            <p className="mt-0.5 truncate text-xs text-zinc-600">
              {
                activity.episode_title
              }
            </p>
          )}
      </div>

      <time className="shrink-0 text-[11px] text-zinc-700 sm:text-xs">
        {formatDate(
          activity.created_at
        )}
      </time>
    </Link>
  );
}

function FriendActivityRow({
  item,
  profile,
  border,
}: {
  item:
    FriendActivityItem;

  profile:
    | FriendProfile
    | null;

  border:
    boolean;
}) {
  const name =
    getProfileName(
      profile
    );

  const profileHref =
    profile?.username
      ? `/profile/${encodeURIComponent(
          profile.username
        )}`
      : null;

  const externalId =
    item.type ===
    "single"
      ? item.activity.external_id
      : item.external_id;

  const mediaType =
    item.type ===
    "single"
      ? item.activity.media_type
      : "SERIES";

  const title =
    item.type ===
    "single"
      ? item.activity.title
      : item.title;

  const cover =
    item.type ===
    "single"
      ? item.activity.cover_url
      : item.cover_url;

  const positionX =
    item.type ===
    "single"
      ? item.activity
          .poster_position_x ??
        50
      : item.poster_position_x ??
        50;

  const positionY =
    item.type ===
    "single"
      ? item.activity
          .poster_position_y ??
        50
      : item.poster_position_y ??
        50;

  const zoom =
    item.type ===
    "single"
      ? item.activity
          .poster_zoom ??
        1
      : item.poster_zoom ??
        1;

  const createdAt =
    item.type ===
    "single"
      ? item.activity.created_at
      : item.created_at;

  const mediaHref =
    getMediaHref(
      mediaType,
      externalId
    );

  const actionText =
    item.type ===
    "episode-group"
      ? item.episode_numbers
          .length ===
        1
        ? `vio el episodio ${item.episode_numbers[0]} de`
        : `vio ${item.episode_numbers.length} episodios de`
      : getFriendActivityText(
          item.activity
        );

  return (
    <div
      className={`flex min-w-0 items-center gap-3 px-3 py-3.5 sm:px-4 ${
        border
          ? "border-b border-zinc-900"
          : ""
      }`}
    >
      <SmallCover
        image={
          cover
        }
        title={
          title
        }
        positionX={
          positionX
        }
        positionY={
          positionY
        }
        zoom={
          zoom
        }
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <ProfileAvatar
            profile={
              profile
            }
            size={
              24
            }
          />

          {profileHref ? (
            <Link
              href={
                profileHref
              }
              className="truncate text-sm font-semibold text-zinc-300 transition hover:text-fuchsia-300"
            >
              {
                name
              }
            </Link>
          ) : (
            <span className="truncate text-sm font-semibold text-zinc-300">
              {
                name
              }
            </span>
          )}
        </div>

        <p className="mt-1 min-w-0 truncate text-sm">
          <span className="text-zinc-600">
            {
              actionText
            }{" "}
          </span>

          <Link
            href={
              mediaHref
            }
            className="font-medium text-zinc-300 transition hover:text-white"
          >
            {
              title
            }
          </Link>
        </p>

        {item.type ===
          "episode-group" && (
          <p className="mt-0.5 truncate text-xs text-zinc-700">
            {getEpisodeGroupLabel(
              item
            )}
          </p>
        )}
      </div>

      <span className="shrink-0 text-[11px] text-zinc-700 sm:text-xs">
        {formatRelativeDate(
          createdAt
        )}
      </span>
    </div>
  );
}

function FriendReviewCard({
  review,
  profile,
}: {
  review:
    FriendReview;

  profile:
    | FriendProfile
    | null;
}) {
  const displayName =
    getProfileName(
      profile
    );

  const mediaHref =
    getMediaHref(
      review.media_type,
      review.external_id
    );

  const profileHref =
    profile?.username
      ? `/profile/${encodeURIComponent(
          profile.username
        )}`
      : null;

  return (
    <article className="flex min-w-0 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/20 p-3.5 transition hover:border-zinc-700 sm:gap-4 sm:p-4">
      <Link
        href={
          mediaHref
        }
        className="relative h-[112px] w-[76px] shrink-0 overflow-hidden rounded-md bg-zinc-900"
      >
        {review.cover_url ? (
          <Image
            src={
              review.cover_url
            }
            alt={
              review.title
            }
            fill
            sizes="76px"
            unoptimized={
              shouldUseOriginalImage(
                review.cover_url
              )
            }
            className="object-cover"
            style={{
              objectPosition:
                `${review.poster_position_x ?? 50}% ${review.poster_position_y ?? 50}%`,

              transform:
                `scale(${review.poster_zoom ?? 1})`,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-700">
            Sin portada
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <ProfileAvatar
            profile={
              profile
            }
            size={
              24
            }
          />

          {profileHref ? (
            <Link
              href={
                profileHref
              }
              className="min-w-0 truncate text-[13px] font-semibold text-zinc-300 transition hover:text-fuchsia-300"
            >
              {
                displayName
              }
            </Link>
          ) : (
            <span className="min-w-0 truncate text-[13px] font-semibold text-zinc-300">
              {
                displayName
              }
            </span>
          )}

          <span className="ml-auto shrink-0 text-[11px] text-zinc-700">
            {formatDate(
              review.created_at
            )}
          </span>
        </div>

        <Link
          href={
            mediaHref
          }
          className="mt-2.5 line-clamp-1 block text-[15px] font-semibold text-zinc-100 transition hover:text-fuchsia-300"
        >
          {
            review.title
          }
        </Link>

        {review.contains_spoilers ? (
          <p className="mt-1.5 text-[13px] italic leading-5 text-zinc-600">
            Esta review contiene spoilers.
          </p>
        ) : (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-zinc-500">
            {
              review.review_text
            }
          </p>
        )}

        {review.liked && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400">
            <Heart
              size={
                13
              }
              fill="currentColor"
            />

            Le gustó
          </div>
        )}
      </div>
    </article>
  );
}

function groupFriendActivity(
  activities:
    ActivityEvent[]
): FriendActivityItem[] {
  type TimedItem = {
    item:
      FriendActivityItem;

    timestamp:
      number;
  };

  type EpisodeBucket = {
    key:
      string;

    group:
      EpisodeActivityGroup;

    newestTimestamp:
      number;
  };

  const singles:
    TimedItem[] =
    [];

  const episodeBuckets:
    EpisodeBucket[] =
    [];

  const SESSION_WINDOW =
    24 *
    60 *
    60 *
    1000;

  for (
    const activity of
    activities
  ) {
    if (
      activity.activity_type !==
        "EPISODE_WATCHED" ||
      activity.episode_number ===
        null
    ) {
      singles.push({
        item: {
          type:
            "single",

          activity,
        },

        timestamp:
          new Date(
            activity.created_at
          ).getTime(),
      });

      continue;
    }

    const timestamp =
      new Date(
        activity.created_at
      ).getTime();

    const key =
      [
        activity.user_id,
        activity.external_id,
        activity.season_number ??
          "unknown",
      ].join(
        ":"
      );

    const existing =
      episodeBuckets.find(
        (
          bucket
        ) =>
          bucket.key ===
            key &&
          bucket.newestTimestamp -
            timestamp <=
            SESSION_WINDOW
      );

    if (
      existing
    ) {
      if (
        !existing.group
          .episode_numbers
          .includes(
            activity.episode_number
          )
      ) {
        existing.group
          .episode_numbers
          .push(
            activity.episode_number
          );
      }

      continue;
    }

    episodeBuckets.push({
      key,

      newestTimestamp:
        timestamp,

      group: {
        type:
          "episode-group",

        id:
          `episodes-${activity.user_id}-${activity.external_id}-${activity.season_number ?? "x"}-${activity.id}`,

        user_id:
          activity.user_id,

        external_id:
          activity.external_id,

        title:
          activity.title,

        cover_url:
          activity.cover_url,

        poster_position_x:
          activity.poster_position_x ??
          50,

        poster_position_y:
          activity.poster_position_y ??
          50,

        poster_zoom:
          activity.poster_zoom ??
          1,

        season_number:
          activity.season_number,

        episode_numbers: [
          activity.episode_number,
        ],

        created_at:
          activity.created_at,
      },
    });
  }

  const groupedEpisodes:
    TimedItem[] =
    episodeBuckets.map(
      (
        bucket
      ) => {
        bucket.group
          .episode_numbers
          .sort(
            (
              first,
              second
            ) =>
              first -
              second
          );

        return {
          item:
            bucket.group,

          timestamp:
            bucket.newestTimestamp,
        };
      }
    );

  return [
    ...singles,
    ...groupedEpisodes,
  ]
    .sort(
      (
        first,
        second
      ) =>
        second.timestamp -
        first.timestamp
    )
    .map(
      ({
        item,
      }) =>
        item
    );
}

function getEpisodeGroupLabel(
  group:
    EpisodeActivityGroup
) {
  const numbers =
    group.episode_numbers;

  if (
    numbers.length ===
    0
  ) {
    return "";
  }

  const lowest =
    Math.min(
      ...numbers
    );

  const highest =
    Math.max(
      ...numbers
    );

  const season =
    group.season_number !==
    null
      ? `T${group.season_number} · `
      : "";

  if (
    numbers.length ===
    1
  ) {
    return `${season}E${lowest}`;
  }

  const expectedCount =
    highest -
    lowest +
    1;

  if (
    expectedCount ===
    numbers.length
  ) {
    return `${season}E${lowest}–E${highest}`;
  }

  const episodeList =
    numbers
      .map(
        (
          episode
        ) =>
          `E${episode}`
      )
      .join(
        ", "
      );

  return `${season}${episodeList}`;
}

function ProfileAvatar({
  profile,
  size,
}: {
  profile:
    | FriendProfile
    | null;

  size:
    number;
}) {
  const name =
    getProfileName(
      profile
    );

  if (
    profile?.avatar_url
  ) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full bg-zinc-800"
        style={{
          width:
            size,

          height:
            size,
        }}
      >
        <Image
          src={
            profile.avatar_url
          }
          alt={
            name
          }
          fill
          sizes={`${size}px`}
          unoptimized={
            shouldUseOriginalImage(
              profile.avatar_url
            )
          }
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-fuchsia-500/10 text-xs font-semibold text-fuchsia-300"
      style={{
        width:
          size,

        height:
          size,
      }}
    >
      {name
        .slice(
          0,
          1
        )
        .toUpperCase()}
    </div>
  );
}

function SmallCover({
  image,
  title,
  positionX,
  positionY,
  zoom,
}: {
  image:
    | string
    | null;

  title:
    string;

  positionX:
    number;

  positionY:
    number;

  zoom:
    number;
}) {
  return (
    <div className="relative h-[54px] w-9 shrink-0 overflow-hidden rounded bg-zinc-900 sm:h-[58px] sm:w-10">
      {image ? (
        <Image
          src={
            image
          }
          alt={
            title
          }
          fill
          sizes="40px"
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
        <div className="flex h-full items-center justify-center text-xs text-zinc-700">
          —
        </div>
      )}
    </div>
  );
}

function EmptyState({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <p className="py-6 text-sm text-zinc-600">
      {
        children
      }
    </p>
  );
}

function getMediaHref(
  mediaType:
    string,

  externalId:
    | string
    | number
) {
  if (
    mediaType ===
    "MOVIE"
  ) {
    return `/movies/${externalId}`;
  }

  if (
    mediaType ===
    "SERIES"
  ) {
    return `/series/${externalId}`;
  }

  if (
    mediaType ===
    "GAME"
  ) {
    return `/games/${externalId}`;
  }

  return `/books/${externalId}`;
}

function getPendingLabel(
  mediaType:
    string
) {
  if (
    mediaType ===
    "GAME"
  ) {
    return "Juego · Jugando";
  }

  if (
    mediaType ===
    "SERIES"
  ) {
    return "Serie · En curso";
  }

  if (
    mediaType ===
    "BOOK"
  ) {
    return "Libro · Pendiente";
  }

  return "Película · Pendiente";
}

function getOwnActivityText(
  activity:
    ActivityEvent
) {
  if (
    activity.activity_type ===
    "EPISODE_WATCHED"
  ) {
    if (
      activity.episode_number !==
      null
    ) {
      return `Viste el episodio ${activity.episode_number} de`;
    }

    return "Viste un episodio de";
  }

  if (
    activity.media_type ===
    "MOVIE"
  ) {
    return "Terminaste de ver";
  }

  if (
    activity.media_type ===
    "SERIES"
  ) {
    return "Terminaste la serie";
  }

  if (
    activity.media_type ===
    "BOOK"
  ) {
    return "Terminaste de leer";
  }

  return "Completaste";
}

function getFriendActivityText(
  activity:
    ActivityEvent
) {
  if (
    activity.activity_type ===
    "EPISODE_WATCHED"
  ) {
    if (
      activity.episode_number !==
      null
    ) {
      return `vio el episodio ${activity.episode_number} de`;
    }

    return "vio un episodio de";
  }

  if (
    activity.activity_type ===
    "ADDED_PENDING"
  ) {
    return "añadió a pendientes";
  }

  if (
    activity.activity_type ===
    "STARTED"
  ) {
    if (
      activity.media_type ===
      "GAME"
    ) {
      return "empezó a jugar";
    }

    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "empezó a leer";
    }

    return "empezó a ver";
  }

  if (
    activity.media_type ===
    "MOVIE"
  ) {
    return "terminó de ver";
  }

  if (
    activity.media_type ===
    "SERIES"
  ) {
    return "terminó la serie";
  }

  if (
    activity.media_type ===
    "BOOK"
  ) {
    return "terminó de leer";
  }

  return "completó";
}

function getProfileName(
  profile:
    | FriendProfile
    | null
) {
  return (
    profile?.display_name ||
    profile?.username ||
    "Usuario"
  );
}

function formatDate(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day:
        "numeric",

      month:
        "short",
    }
  ).format(
    new Date(
      value
    )
  );
}

function formatRelativeDate(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  const difference =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        60_000
    );

  const hours =
    Math.floor(
      difference /
        3_600_000
    );

  const days =
    Math.floor(
      difference /
        86_400_000
    );

  if (
    minutes <
    1
  ) {
    return "Ahora";
  }

  if (
    minutes <
    60
  ) {
    return `Hace ${minutes} min`;
  }

  if (
    hours <
    24
  ) {
    return hours ===
      1
      ? "Hace 1 h"
      : `Hace ${hours} h`;
  }

  if (
    days <
    7
  ) {
    return days ===
      1
      ? "Hace 1 día"
      : `Hace ${days} días`;
  }

  return formatDate(
    value
  );
}

function randomSubset<T>(
  values:
    T[],

  maximum:
    number
) {
  const result =
    [
      ...values,
    ];

  for (
    let index =
      result.length -
      1;

    index >
    0;

    index--
  ) {
    const swapIndex =
      Math.floor(
        Math.random() *
          (
            index +
            1
          )
      );

    [
      result[
        index
      ],
      result[
        swapIndex
      ],
    ] = [
      result[
        swapIndex
      ],
      result[
        index
      ],
    ];
  }

  return result.slice(
    0,
    maximum
  );
}