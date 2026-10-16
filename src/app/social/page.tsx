import Image from "next/image";
import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  FOLLOW_TABLE,
} from "@/lib/follows";

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

import ActivityLikeButton from "./ActivityLikeButton";
import FollowButton from "./FollowButton";
import SocialReviewModal from "./SocialReviewModal";

interface SocialPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

type ActivityType =
  | "ADDED_PENDING"
  | "STARTED"
  | "EPISODE_WATCHED"
  | "COMPLETED"
  | "REVIEWED";

type Profile = {
  id: string;

  username:
    | string
    | null;

  display_name:
    | string
    | null;

  bio:
    | string
    | null;

  avatar_url:
    | string
    | null;

  special_role:
    | "OWNER"
    | "BETA_TESTER"
    | null;
};

type Follow = {
  following_id: string;
};

type ActivityEvent = {
  id: string;

  user_id: string;

  activity_type:
    ActivityType;

  media_type:
    MediaType;

  external_id: string;

  title: string;

  cover_url:
    | string
    | null;

  review_id:
    | string
    | null;

  episode_watch_id:
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

  created_at: string;
};

type Review = {
  id: string;

  media_type:
    MediaType;

  external_id: string;

  title: string;

  review_text: string;

  liked: boolean;

  experience:
    | "FIRST_TIME"
    | "REWATCH"
    | "REPLAY"
    | "REREAD";

  contains_spoilers:
    boolean;

  show_consumed_date:
    boolean;

  consumed_at: string;

  cover_url:
    | string
    | null;

  release_year:
    | number
    | null;
};

type ActivityLike = {
  activity_id: string;
  user_id: string;
};

type NormalFeedItem = {
  kind:
    "activity";

  activity:
    ActivityEvent;
};

type EpisodeGroupFeedItem = {
  kind:
    "episode-group";

  id: string;

  user_id: string;

  external_id: string;

  title: string;

  cover_url:
    | string
    | null;

  season_number: number;

  created_at: string;

  activities:
    ActivityEvent[];
};

type FeedItem =
  | NormalFeedItem
  | EpisodeGroupFeedItem;

function getDisplayName(
  profile:
    | Profile
    | undefined
) {
  return (
    profile?.display_name ??
    profile?.username ??
    "Usuario"
  );
}

function getInitial(
  profile:
    | Profile
    | undefined
) {
  return getDisplayName(
    profile
  )
    .slice(
      0,
      1
    )
    .toUpperCase();
}

function getMediaHref(
  mediaType:
    MediaType,

  externalId:
    string
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
    "BOOK"
  ) {
    return `/books/${externalId}`;
  }

  if (
    mediaType ===
    "GAME"
  ) {
    return `/games/${externalId}`;
  }

  return null;
}

function getActivityText(
  activity:
    ActivityEvent
) {
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
      "SERIES"
    ) {
      return "empezó a ver";
    }

    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "empezó a leer";
    }

    if (
      activity.media_type ===
      "GAME"
    ) {
      return "empezó a jugar";
    }

    return "empezó";
  }

  if (
    activity.activity_type ===
    "EPISODE_WATCHED"
  ) {
    return "vio un episodio de";
  }

  if (
    activity.activity_type ===
    "COMPLETED"
  ) {
    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "terminó de leer";
    }

    return "completó";
  }

  if (
    activity.activity_type ===
    "REVIEWED"
  ) {
    if (
      activity.media_type ===
      "MOVIE"
    ) {
      return "vio";
    }

    if (
      activity.media_type ===
      "SERIES"
    ) {
      return "terminó";
    }

    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "leyó";
    }

    if (
      activity.media_type ===
      "GAME"
    ) {
      return "completó";
    }

    return "escribió una review de";
  }

  return "";
}

function formatActivityDate(
  dateString:
    string
) {
  const date =
    new Date(
      dateString
    );

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        (
          1000 *
          60
        )
    );

  const hours =
    Math.floor(
      difference /
        (
          1000 *
          60 *
          60
        )
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

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

function getMediaLabel(
  mediaType:
    MediaType
) {
  if (
    mediaType ===
    "MOVIE"
  ) {
    return "Película";
  }

  if (
    mediaType ===
    "SERIES"
  ) {
    return "Serie";
  }

  if (
    mediaType ===
    "BOOK"
  ) {
    return "Libro";
  }

  if (
    mediaType ===
    "GAME"
  ) {
    return "Juego";
  }

  return "";
}

function groupActivityEvents(
  activities:
    ActivityEvent[]
): FeedItem[] {
  const result:
    FeedItem[] =
    [];

  let index =
    0;

  while (
    index <
    activities.length
  ) {
    const current =
      activities[
        index
      ];

    if (
      current.activity_type !==
        "EPISODE_WATCHED" ||
      current.media_type !==
        "SERIES" ||
      current.season_number ===
        null ||
      current.episode_number ===
        null
    ) {
      result.push({
        kind:
          "activity",

        activity:
          current,
      });

      index +=
        1;

      continue;
    }

    const episodeGroup:
      ActivityEvent[] =
      [
        current,
      ];

    let expectedEpisode =
      current.episode_number -
      1;

    let nextIndex =
      index +
      1;

    while (
      nextIndex <
      activities.length
    ) {
      const candidate =
        activities[
          nextIndex
        ];

      const canGroup =
        candidate.activity_type ===
          "EPISODE_WATCHED" &&
        candidate.media_type ===
          "SERIES" &&
        candidate.user_id ===
          current.user_id &&
        candidate.external_id ===
          current.external_id &&
        candidate.season_number ===
          current.season_number &&
        candidate.episode_number ===
          expectedEpisode;

      if (
        !canGroup
      ) {
        break;
      }

      episodeGroup.push(
        candidate
      );

      expectedEpisode -=
        1;

      nextIndex +=
        1;
    }

    if (
      episodeGroup.length >
      1
    ) {
      const cover =
        episodeGroup.find(
          (
            activity
          ) =>
            Boolean(
              activity.cover_url
            )
        )?.cover_url ??
        null;

      result.push({
        kind:
          "episode-group",

        id:
          current.id,

        user_id:
          current.user_id,

        external_id:
          current.external_id,

        title:
          current.title,

        cover_url:
          cover,

        season_number:
          current.season_number,

        created_at:
          current.created_at,

        activities:
          episodeGroup,
      });
    } else {
      result.push({
        kind:
          "activity",

        activity:
          current,
      });
    }

    index =
      nextIndex;
  }

  return result;
}

function getEpisodeRange(
  group:
    EpisodeGroupFeedItem
) {
  const episodeNumbers =
    group.activities
      .map(
        (
          activity
        ) =>
          activity.episode_number
      )
      .filter(
        (
          episode
        ): episode is number =>
          episode !==
          null
      )
      .sort(
        (
          first,
          second
        ) =>
          first -
          second
      );

  if (
    episodeNumbers.length ===
    0
  ) {
    return `T${group.season_number}`;
  }

  const first =
    episodeNumbers[
      0
    ];

  const last =
    episodeNumbers[
      episodeNumbers.length -
      1
    ];

  if (
    first ===
    last
  ) {
    return `T${group.season_number} · E${first}`;
  }

  return `T${group.season_number} · E${first}–E${last}`;
}

export default async function SocialPage({
  searchParams,
}: SocialPageProps) {
  const {
    q,
  } =
    await searchParams;

  const query =
    q?.trim() ??
    "";

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
    redirect(
      "/auth"
    );
  }

  /*
   * FOLLOWS
   */

  const {
    data:
      followRows,

    error:
      followError,
  } =
    await supabase
      .from(
        FOLLOW_TABLE
      )
      .select(
        "following_id"
      )
      .eq(
        "follower_id",
        user.id
      );

  if (
    followError
  ) {
    console.error(
      "Error loading follows:",
      followError
    );
  }

  const follows =
    (
      followRows ??
      []
    ) as Follow[];

  const followingIds =
    follows.map(
      (
        follow
      ) =>
        follow.following_id
    );

  const followingSet =
    new Set(
      followingIds
    );

  const feedUserIds =
    [
      user.id,
      ...followingIds,
    ];

  /*
   * ACTIVITY
   */

  const {
    data:
      activityRows,

    error:
      activityError,
  } =
    await supabase
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
        review_id,
        episode_watch_id,
        season_number,
        episode_number,
        episode_title,
        created_at
      `)
      .in(
        "user_id",
        feedUserIds
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(
        60
      );

  if (
    activityError
  ) {
    console.error(
      "Error loading activity:",
      activityError
    );
  }

  const activities =
    (
      activityRows ??
      []
    ) as ActivityEvent[];

  /*
   * GLOBAL ARTWORK
   */

  const artworkOverrides =
    await getMixedMediaArtworkOverrides(
      activities.map(
        (
          activity
        ) => ({
          media_type:
            activity.media_type,

          external_id:
            activity.external_id,
        })
      )
    );

  const feedItems =
    groupActivityEvents(
      activities
    );

  /*
   * FEED PROFILES
   */

  const profileIds =
    Array.from(
      new Set(
        activities.map(
          (
            activity
          ) =>
            activity.user_id
        )
      )
    );

  let feedProfiles:
    Profile[] =
    [];

  if (
    profileIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(`
          id,
          username,
          display_name,
          bio,
          avatar_url,
          special_role
        `)
        .in(
          "id",
          profileIds
        );

    if (
      error
    ) {
      console.error(
        "Error loading activity profiles:",
        error
      );
    }

    feedProfiles =
      (
        data ??
        []
      ) as Profile[];
  }

  const profilesById =
    new Map(
      feedProfiles.map(
        (
          profile
        ) => [
          profile.id,
          profile,
        ]
      )
    );

  /*
   * REVIEWS
   */

  const reviewIds =
    Array.from(
      new Set(
        activities
          .filter(
            (
              activity
            ) =>
              activity.review_id
          )
          .map(
            (
              activity
            ) =>
              activity.review_id as string
          )
      )
    );

  let feedReviews:
    Review[] =
    [];

  if (
    reviewIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "reviews"
        )
        .select(`
          id,
          media_type,
          external_id,
          title,
          review_text,
          liked,
          experience,
          contains_spoilers,
          show_consumed_date,
          consumed_at,
          cover_url,
          release_year
        `)
        .in(
          "id",
          reviewIds
        );

    if (
      error
    ) {
      console.error(
        "Error loading feed reviews:",
        error
      );
    }

    feedReviews =
      (
        data ??
        []
      ) as Review[];
  }

  const reviewsById =
    new Map(
      feedReviews.map(
        (
          review
        ) => [
          review.id,
          review,
        ]
      )
    );

  /*
   * LIKES
   */

  const activityIds =
    activities.map(
      (
        activity
      ) =>
        activity.id
    );

  let activityLikes:
    ActivityLike[] =
    [];

  if (
    activityIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "activity_likes"
        )
        .select(`
          activity_id,
          user_id
        `)
        .in(
          "activity_id",
          activityIds
        );

    if (
      error
    ) {
      console.error(
        "Error loading activity likes:",
        error
      );
    }

    activityLikes =
      (
        data ??
        []
      ) as ActivityLike[];
  }

  const likeCounts =
    new Map<
      string,
      number
    >();

  const likedByCurrentUser =
    new Set<
      string
    >();

  for (
    const like of
    activityLikes
  ) {
    likeCounts.set(
      like.activity_id,
      (
        likeCounts.get(
          like.activity_id
        ) ??
        0
      ) +
        1
    );

    if (
      like.user_id ===
      user.id
    ) {
      likedByCurrentUser.add(
        like.activity_id
      );
    }
  }

  /*
   * PEOPLE
   */

  let profileQuery =
    supabase
      .from(
        "profiles"
      )
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        special_role
      `)
      .neq(
        "id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(
        query
          ? 30
          : 8
      );

  if (
    query
  ) {
    profileQuery =
      profileQuery.or(
        `username.ilike.%${query}%,display_name.ilike.%${query}%`
      );
  }

  const {
    data:
      profiles,

    error:
      profilesError,
  } =
    await profileQuery;

  if (
    profilesError
  ) {
    console.error(
      "Error loading profiles:",
      profilesError
    );
  }

  const users =
    (
      profiles ??
      []
    ) as Profile[];

  return (
    <main className="mx-auto w-full max-w-[1380px] pb-20">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-zinc-100">
          Social
        </h1>

        <p className="mt-2 text-zinc-400">
          Mira qué están viendo, leyendo y jugando las personas que sigues.
        </p>
      </div>

      {/* PEOPLE */}

      <section className="mt-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              Personas
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Encuentra gente por nombre o usuario.
            </p>
          </div>

          {query && (
            <Link
              href="/social"
              className="shrink-0 text-sm text-zinc-500 transition hover:text-zinc-200"
            >
              Limpiar
            </Link>
          )}
        </div>

        <form
          method="GET"
          className="mt-5"
        >
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              name="q"
              defaultValue={
                query
              }
              placeholder="Buscar por nombre o usuario..."
              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
            />

            <button
              type="submit"
              className="shrink-0 rounded-xl bg-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400 sm:px-6"
            >
              Buscar
            </button>
          </div>
        </form>

        {query ? (
          <div className="mt-5">
            <p className="mb-3 text-sm text-zinc-500">
              Resultados para{" "}
              <span className="text-zinc-300">
                &quot;
                {query}
                &quot;
              </span>
            </p>

            {users.length ===
            0 ? (
              <div className="border-y border-zinc-900 py-10 text-center">
                <p className="text-sm text-zinc-600">
                  No se encontraron usuarios.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {users.map(
                  (
                    profile
                  ) => (
                    <PersonListItem
                      key={
                        profile.id
                      }
                      profile={
                        profile
                      }
                      currentUserId={
                        user.id
                      }
                      following={
                        followingSet.has(
                          profile.id
                        )
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {users.length ===
            0 ? (
              <p className="py-6 text-sm text-zinc-600">
                No hay usuarios para mostrar todavía.
              </p>
            ) : (
              users.map(
                (
                  profile
                ) => (
                  <PersonSuggestion
                    key={
                      profile.id
                    }
                    profile={
                      profile
                    }
                    currentUserId={
                      user.id
                    }
                    following={
                      followingSet.has(
                        profile.id
                      )
                    }
                  />
                )
              )
            )}
          </div>
        )}
      </section>

      {/* ACTIVITY */}

      <section className="mt-12 border-t border-zinc-900 pt-9">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-zinc-100">
            Actividad
          </h2>

          <span className="hidden text-sm text-zinc-600 sm:block">
            Tú y las personas que sigues
          </span>
        </div>

        {feedItems.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
            <p className="text-zinc-400">
              Todavía no hay actividad para mostrar.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Sigue personas o empieza a añadir contenido.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {feedItems.map(
              (
                item
              ) => {
                /*
                 * GROUPED EPISODES
                 */

                if (
                  item.kind ===
                  "episode-group"
                ) {
                  const profile =
                    profilesById.get(
                      item.user_id
                    );

                  const displayName =
                    getDisplayName(
                      profile
                    );

                  const username =
                    profile?.username;

                  const mediaHref =
                    `/series/${item.external_id}`;

                  const artworkOverride =
                    artworkOverrides.get(
                      getMediaArtworkMapKey(
                        "SERIES",
                        item.external_id
                      )
                    );

                  const cover =
                    artworkOverride
                      ?.poster_url ??
                    item.cover_url;

                  const coverPositionX =
                    artworkOverride
                      ?.poster_position_x ??
                    50;

                  const coverPositionY =
                    artworkOverride
                      ?.poster_position_y ??
                    50;

                  const coverZoom =
                    artworkOverride
                      ?.poster_zoom ??
                    1;

                  const primaryActivity =
                    item.activities[
                      0
                    ];

                  const likeCount =
                    likeCounts.get(
                      primaryActivity.id
                    ) ??
                    0;

                  const initialLiked =
                    likedByCurrentUser.has(
                      primaryActivity.id
                    );

                  return (
                    <article
                      key={`episode-group-${item.id}`}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <FeedAvatar
                          profile={
                            profile
                          }
                          username={
                            username
                          }
                          displayName={
                            displayName
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <FeedUserHeader
                            profile={
                              profile
                            }
                            username={
                              username
                            }
                            displayName={
                              displayName
                            }
                            createdAt={
                              item.created_at
                            }
                          />

                          <p className="mt-2 leading-6 text-zinc-300">
                            <span className="text-zinc-400">
                              vio{" "}
                              {
                                item.activities.length
                              }{" "}
                              episodios de{" "}
                            </span>

                            <Link
                              href={
                                mediaHref
                              }
                              className="font-medium text-zinc-100 transition hover:text-fuchsia-300"
                            >
                              {
                                item.title
                              }
                            </Link>
                          </p>

                          <div className="mt-4 flex items-center gap-4">
                            <Link
                              href={
                                mediaHref
                              }
                              className="w-[72px] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                            >
                              {cover ? (
                                <Image
                                  src={
                                    cover
                                  }
                                  alt={
                                    item.title
                                  }
                                  width={
                                    500
                                  }
                                  height={
                                    750
                                  }
                                  unoptimized={
                                    shouldUseOriginalImage(
                                      cover
                                    )
                                  }
                                  className="aspect-[2/3] w-full object-cover"
                                  style={{
                                    objectPosition:
                                      `${coverPositionX}% ${coverPositionY}%`,

                                    transform:
                                      `scale(${coverZoom})`,
                                  }}
                                />
                              ) : (
                                <div className="flex aspect-[2/3] items-center justify-center px-2 text-center text-[10px] text-zinc-600">
                                  Sin portada
                                </div>
                              )}
                            </Link>

                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-wide text-zinc-600">
                                Serie
                              </p>

                              <Link
                                href={
                                  mediaHref
                                }
                                className="mt-1 block line-clamp-2 font-medium text-zinc-200 transition hover:text-fuchsia-300"
                              >
                                {
                                  item.title
                                }
                              </Link>

                              <div className="mt-2 inline-flex rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-400">
                                {getEpisodeRange(
                                  item
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <ActivityLikeButton
                              activityId={
                                primaryActivity.id
                              }
                              currentUserId={
                                user.id
                              }
                              initialLiked={
                                initialLiked
                              }
                              initialCount={
                                likeCount
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }

                /*
                 * NORMAL ACTIVITY
                 */

                const {
                  activity,
                } =
                  item;

                const profile =
                  profilesById.get(
                    activity.user_id
                  );

                const displayName =
                  getDisplayName(
                    profile
                  );

                const username =
                  profile?.username;

                const mediaHref =
                  getMediaHref(
                    activity.media_type,
                    activity.external_id
                  );

                const artworkOverride =
                  artworkOverrides.get(
                    getMediaArtworkMapKey(
                      activity.media_type,
                      activity.external_id
                    )
                  );

                const cover =
                  artworkOverride
                    ?.poster_url ??
                  activity.cover_url;

                const coverPositionX =
                  artworkOverride
                    ?.poster_position_x ??
                  50;

                const coverPositionY =
                  artworkOverride
                    ?.poster_position_y ??
                  50;

                const coverZoom =
                  artworkOverride
                    ?.poster_zoom ??
                  1;

                const isEpisode =
                  activity.activity_type ===
                  "EPISODE_WATCHED";

                const review =
                  activity.review_id
                    ? reviewsById.get(
                        activity.review_id
                      )
                    : undefined;

                const likeCount =
                  likeCounts.get(
                    activity.id
                  ) ??
                  0;

                const initialLiked =
                  likedByCurrentUser.has(
                    activity.id
                  );

                return (
                  <article
                    key={
                      activity.id
                    }
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <FeedAvatar
                        profile={
                          profile
                        }
                        username={
                          username
                        }
                        displayName={
                          displayName
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <FeedUserHeader
                          profile={
                            profile
                          }
                          username={
                            username
                          }
                          displayName={
                            displayName
                          }
                          createdAt={
                            activity.created_at
                          }
                        />

                        <p className="mt-2 leading-6 text-zinc-300">
                          <span className="text-zinc-400">
                            {getActivityText(
                              activity
                            )}{" "}
                          </span>

                          {mediaHref &&
                          !isEpisode ? (
                            <Link
                              href={
                                mediaHref
                              }
                              className="font-medium text-zinc-100 transition hover:text-fuchsia-300"
                            >
                              {
                                activity.title
                              }
                            </Link>
                          ) : (
                            <span className="font-medium text-zinc-100">
                              {
                                activity.title
                              }
                            </span>
                          )}
                        </p>

                        {review ? (
                          <SocialReviewModal
                            review={{
                              ...review,

                              cover_url:
                                artworkOverride
                                  ?.poster_url ??
                                review.cover_url,

                              poster_position_x:
                                artworkOverride
                                  ?.poster_position_x ??
                                50,

                              poster_position_y:
                                artworkOverride
                                  ?.poster_position_y ??
                                50,

                              poster_zoom:
                                artworkOverride
                                  ?.poster_zoom ??
                                1,
                            }}
                          />
                        ) : isEpisode ? (
                          <div className="mt-4 flex items-center gap-4">
                            {mediaHref ? (
                              <Link
                                href={
                                  mediaHref
                                }
                                className="w-[72px] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                              >
                                {cover ? (
                                  <Image
                                    src={
                                      cover
                                    }
                                    alt={
                                      activity.title
                                    }
                                    width={
                                      500
                                    }
                                    height={
                                      750
                                    }
                                    unoptimized={
                                      shouldUseOriginalImage(
                                        cover
                                      )
                                    }
                                    className="aspect-[2/3] w-full object-cover"
                                    style={{
                                      objectPosition:
                                        `${coverPositionX}% ${coverPositionY}%`,

                                      transform:
                                        `scale(${coverZoom})`,
                                    }}
                                  />
                                ) : (
                                  <div className="flex aspect-[2/3] items-center justify-center px-2 text-center text-[10px] text-zinc-600">
                                    Sin portada
                                  </div>
                                )}
                              </Link>
                            ) : null}

                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-wide text-zinc-600">
                                Serie
                              </p>

                              {mediaHref ? (
                                <Link
                                  href={
                                    mediaHref
                                  }
                                  className="mt-1 block font-medium text-zinc-200 transition hover:text-fuchsia-300"
                                >
                                  {
                                    activity.title
                                  }
                                </Link>
                              ) : (
                                <p className="mt-1 font-medium text-zinc-200">
                                  {
                                    activity.title
                                  }
                                </p>
                              )}

                              <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-400">
                                T
                                {
                                  activity.season_number
                                }{" "}
                                E
                                {
                                  activity.episode_number
                                }

                                {activity.episode_title &&
                                  ` · ${activity.episode_title}`}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex gap-4">
                            {cover ? (
                              mediaHref ? (
                                <Link
                                  href={
                                    mediaHref
                                  }
                                  className="w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-800"
                                >
                                  <Image
                                    src={
                                      cover
                                    }
                                    alt={
                                      activity.title
                                    }
                                    width={
                                      500
                                    }
                                    height={
                                      750
                                    }
                                    unoptimized={
                                      shouldUseOriginalImage(
                                        cover
                                      )
                                    }
                                    className="aspect-[2/3] w-full object-cover"
                                    style={{
                                      objectPosition:
                                        `${coverPositionX}% ${coverPositionY}%`,

                                      transform:
                                        `scale(${coverZoom})`,
                                    }}
                                  />
                                </Link>
                              ) : (
                                <div className="w-16 shrink-0 overflow-hidden rounded-lg">
                                  <Image
                                    src={
                                      cover
                                    }
                                    alt={
                                      activity.title
                                    }
                                    width={
                                      500
                                    }
                                    height={
                                      750
                                    }
                                    unoptimized={
                                      shouldUseOriginalImage(
                                        cover
                                      )
                                    }
                                    className="aspect-[2/3] w-full object-cover"
                                    style={{
                                      objectPosition:
                                        `${coverPositionX}% ${coverPositionY}%`,

                                      transform:
                                        `scale(${coverZoom})`,
                                    }}
                                  />
                                </div>
                              )
                            ) : (
                              <div className="flex aspect-[2/3] w-16 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-center text-[10px] text-zinc-600">
                                Sin portada
                              </div>
                            )}

                            <div className="flex min-w-0 flex-col justify-center">
                              <span className="text-xs uppercase tracking-wide text-zinc-600">
                                {getMediaLabel(
                                  activity.media_type
                                )}
                              </span>

                              {mediaHref ? (
                                <Link
                                  href={
                                    mediaHref
                                  }
                                  className="mt-1 line-clamp-2 font-medium text-zinc-200 transition hover:text-fuchsia-300"
                                >
                                  {
                                    activity.title
                                  }
                                </Link>
                              ) : (
                                <p className="mt-1 line-clamp-2 font-medium text-zinc-200">
                                  {
                                    activity.title
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          <ActivityLikeButton
                            activityId={
                              activity.id
                            }
                            currentUserId={
                              user.id
                            }
                            initialLiked={
                              initialLiked
                            }
                            initialCount={
                              likeCount
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function FeedAvatar({
  profile,
  username,
  displayName,
}: {
  profile:
    | Profile
    | undefined;

  username:
    | string
    | null
    | undefined;

  displayName:
    string;
}) {
  const content =
    profile?.avatar_url ? (
      <Image
        src={
          profile.avatar_url
        }
        alt={
          displayName
        }
        width={
          128
        }
        height={
          128
        }
        unoptimized={
          shouldUseOriginalImage(
            profile.avatar_url
          )
        }
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-500">
        {getInitial(
          profile
        )}
      </div>
    );

  if (
    username
  ) {
    return (
      <Link
        href={`/profile/${encodeURIComponent(
          username
        )}`}
        className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-800"
      >
        {
          content
        }
      </Link>
    );
  }

  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-800">
      {
        content
      }
    </div>
  );
}

function FeedUserHeader({
  profile,
  username,
  displayName,
  createdAt,
}: {
  profile:
    | Profile
    | undefined;

  username:
    | string
    | null
    | undefined;

  displayName:
    string;

  createdAt:
    string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {username ? (
        <Link
          href={`/profile/${encodeURIComponent(
            username
          )}`}
          className="font-semibold text-zinc-100 transition hover:text-fuchsia-300"
        >
          {
            displayName
          }
        </Link>
      ) : (
        <span className="font-semibold text-zinc-100">
          {
            displayName
          }
        </span>
      )}

      {profile?.special_role ===
        "OWNER" && (
        <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-300">
          Owner
        </span>
      )}

      {profile?.special_role ===
        "BETA_TESTER" && (
        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
          Beta Tester
        </span>
      )}

      <span className="text-sm text-zinc-700">
        ·
      </span>

      <span className="text-sm text-zinc-600">
        {formatActivityDate(
          createdAt
        )}
      </span>
    </div>
  );
}

function PersonSuggestion({
  profile,
  currentUserId,
  following,
}: {
  profile:
    Profile;

  currentUserId:
    string;

  following:
    boolean;
}) {
  const displayName =
    getDisplayName(
      profile
    );

  const profileHref =
    profile.username
      ? `/profile/${encodeURIComponent(
          profile.username
        )}`
      : "/social";

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <Link
          href={
            profileHref
          }
          className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800"
        >
          {profile.avatar_url ? (
            <Image
              src={
                profile.avatar_url
              }
              alt={
                displayName
              }
              width={
                128
              }
              height={
                128
              }
              unoptimized={
                shouldUseOriginalImage(
                  profile.avatar_url
                )
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-500">
              {getInitial(
                profile
              )}
            </div>
          )}
        </Link>

        <FollowButton
          currentUserId={
            currentUserId
          }
          targetUserId={
            profile.id
          }
          initialFollowing={
            following
          }
          compact
        />
      </div>

      <div className="mt-3 min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={
              profileHref
            }
            className="min-w-0 truncate font-semibold text-zinc-100 transition hover:text-fuchsia-300"
          >
            {
              displayName
            }
          </Link>

          {profile.special_role ===
            "OWNER" && (
            <span className="shrink-0 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] font-medium text-fuchsia-300">
              Owner
            </span>
          )}

          {profile.special_role ===
            "BETA_TESTER" && (
            <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-500">
              Beta
            </span>
          )}
        </div>

        {profile.username && (
          <p className="mt-0.5 truncate text-sm text-zinc-600">
            @
            {
              profile.username
            }
          </p>
        )}

        {profile.bio?.trim() && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
            {
              profile.bio
            }
          </p>
        )}
      </div>
    </article>
  );
}

function PersonListItem({
  profile,
  currentUserId,
  following,
}: {
  profile:
    Profile;

  currentUserId:
    string;

  following:
    boolean;
}) {
  const displayName =
    getDisplayName(
      profile
    );

  const profileHref =
    profile.username
      ? `/profile/${encodeURIComponent(
          profile.username
        )}`
      : "/social";

  return (
    <article className="flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <Link
        href={
          profileHref
        }
        className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800"
      >
        {profile.avatar_url ? (
          <Image
            src={
              profile.avatar_url
            }
            alt={
              displayName
            }
            width={
              128
            }
            height={
              128
            }
            unoptimized={
              shouldUseOriginalImage(
                profile.avatar_url
              )
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-500">
            {getInitial(
              profile
            )}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={
              profileHref
            }
            className="truncate font-semibold text-zinc-100 transition hover:text-fuchsia-300"
          >
            {
              displayName
            }
          </Link>

          {profile.special_role ===
            "OWNER" && (
            <span className="shrink-0 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-300">
              Owner
            </span>
          )}

          {profile.special_role ===
            "BETA_TESTER" && (
            <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500">
              Beta Tester
            </span>
          )}
        </div>

        {profile.username && (
          <p className="mt-0.5 truncate text-sm text-zinc-600">
            @
            {
              profile.username
            }
          </p>
        )}
      </div>

      <FollowButton
        currentUserId={
          currentUserId
        }
        targetUserId={
          profile.id
        }
        initialFollowing={
          following
        }
        compact
      />
    </article>
  );
}