import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  getMediaArtworkMapKey,
  getMixedMediaArtworkOverrides,
  type MediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  createClient,
} from "@/lib/supabase/server";

import Image from "next/image";
import Link from "next/link";

import {
  Eye,
  Heart,
  HeartCrack,
  ListPlus,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Tv,
} from "lucide-react";

import ProfileReviewModal from "./ProfileReviewModal";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

type ActivityEvent = {
  id: string;

  user_id: string;

  activity_type:
    | "ADDED_PENDING"
    | "STARTED"
    | "EPISODE_WATCHED"
    | "COMPLETED"
    | "REVIEWED";

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

  review_text:
    | string
    | null;

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

  consumed_at:
    string;

  cover_url:
    | string
    | null;

  release_year:
    | number
    | null;
};

interface ProfileActivityProps {
  profileUserId:
    string;

  username:
    string;

  mode?:
    | "preview"
    | "full";
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

  return `/games/${externalId}`;
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
        60_000
    );

  const hours =
    Math.floor(
      difference /
        3_600_000
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

function getActivityLabel(
  activity:
    ActivityEvent
) {
  if (
    activity.activity_type ===
    "ADDED_PENDING"
  ) {
    return "Añadido a pendientes";
  }

  if (
    activity.activity_type ===
    "STARTED"
  ) {
    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "Empezó a leer";
    }

    if (
      activity.media_type ===
      "GAME"
    ) {
      return "Empezó a jugar";
    }

    return "Empezó a ver";
  }

  if (
    activity.activity_type ===
    "EPISODE_WATCHED"
  ) {
    return "Episodio visto";
  }

  if (
    activity.activity_type ===
    "REVIEWED"
  ) {
    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "Leído";
    }

    if (
      activity.media_type ===
      "GAME"
    ) {
      return "Completado";
    }

    return "Visto";
  }

  return "Completado";
}

function getFullActivityText(
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

    return "empezó a ver";
  }

  if (
    activity.activity_type ===
    "EPISODE_WATCHED"
  ) {
    return "vio un episodio de";
  }

  if (
    activity.activity_type ===
    "REVIEWED"
  ) {
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

    return "vio";
  }

  return "completó";
}

function ReviewIcons({
  review,
  size = 16,
}: {
  review:
    Review;

  size?:
    number;
}) {
  const repeat =
    review.experience !==
    "FIRST_TIME";

  return (
    <div className="flex items-center gap-2 text-zinc-500">
      {review.liked ? (
        <Heart
          size={
            size
          }
          fill="currentColor"
          className="text-red-500"
        />
      ) : (
        <HeartCrack
          size={
            size
          }
        />
      )}

      {repeat ? (
        <RotateCcw
          size={
            size
          }
        />
      ) : (
        <Eye
          size={
            size
          }
        />
      )}

      {review.contains_spoilers ? (
        <ShieldAlert
          size={
            size
          }
        />
      ) : (
        <Shield
          size={
            size
          }
        />
      )}
    </div>
  );
}

function ActivityStatus({
  activity,
}: {
  activity:
    ActivityEvent;
}) {
  if (
    activity.activity_type ===
    "ADDED_PENDING"
  ) {
    return (
      <ListPlus
        size={
          16
        }
      />
    );
  }

  if (
    activity.activity_type ===
    "STARTED"
  ) {
    return (
      <Play
        size={
          16
        }
      />
    );
  }

  if (
    activity.activity_type ===
    "EPISODE_WATCHED"
  ) {
    return (
      <Tv
        size={
          16
        }
      />
    );
  }

  return null;
}

function getArtworkOverride(
  activity:
    ActivityEvent,

  overrides:
    Map<
      string,
      MediaArtworkOverride
    >
) {
  return (
    overrides.get(
      getMediaArtworkMapKey(
        activity.media_type,
        activity.external_id
      )
    ) ??
    null
  );
}

function getCoverData(
  activity:
    ActivityEvent,

  review:
    | Review
    | undefined,

  override:
    | MediaArtworkOverride
    | null
) {
  return {
    cover:
      override
        ?.poster_url ??
      review
        ?.cover_url ??
      activity.cover_url,

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

function StandardPoster({
  href,
  cover,
  title,
  positionX,
  positionY,
  zoom,
  size,
}: {
  href:
    string;

  cover:
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

  size:
    | "preview"
    | "full";
}) {
  return (
    <Link
      href={
        href
      }
      className={`block overflow-hidden border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600 ${
        size ===
        "preview"
          ? "rounded-xl"
          : "rounded-lg"
      }`}
    >
      {cover ? (
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <Image
            src={
              cover
            }
            alt={
              title
            }
            fill
            sizes={
              size ===
              "preview"
                ? "155px"
                : "85px"
            }
            unoptimized={
              shouldUseOriginalImage(
                cover
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
        </div>
      ) : (
        <div className="flex aspect-[2/3] items-center justify-center px-3 text-center text-xs text-zinc-600">
          Sin portada
        </div>
      )}
    </Link>
  );
}

export default async function ProfileActivity({
  profileUserId,
  username,
  mode = "preview",
}: ProfileActivityProps) {
  const supabase =
    await createClient();

  const limit =
    mode ===
    "preview"
      ? 6
      : 100;

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
        season_number,
        episode_number,
        episode_title,
        created_at
      `)
      .eq(
        "user_id",
        profileUserId
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(
        limit
      );

  if (
    activityError
  ) {
    console.error(
      "Error loading profile activity:",
      activityError
    );
  }

  const activities =
    (
      activityRows ??
      []
    ) as ActivityEvent[];

  const reviewIds =
    activities
      .map(
        (
          activity
        ) =>
          activity.review_id
      )
      .filter(
        (
          reviewId
        ): reviewId is string =>
          Boolean(
            reviewId
          )
      );

  let reviews:
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
        "Error loading profile reviews:",
        error
      );
    }

    reviews =
      (
        data ??
        []
      ) as Review[];
  }

  const reviewsById =
    new Map(
      reviews.map(
        (
          review
        ) => [
          review.id,
          review,
        ]
      )
    );

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

  if (
    activities.length ===
    0
  ) {
    return (
      <p className="text-sm text-zinc-600">
        Todavía no hay actividad.
      </p>
    );
  }

  if (
    mode ===
    "preview"
  ) {
    return (
      <div>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {activities.map(
            (
              activity
            ) => {
              const review =
                activity.review_id
                  ? reviewsById.get(
                      activity.review_id
                    )
                  : undefined;

              const override =
                getArtworkOverride(
                  activity,
                  artworkOverrides
                );

              const {
                cover,
                positionX,
                positionY,
                zoom,
              } =
                getCoverData(
                  activity,
                  review,
                  override
                );

              const href =
                getMediaHref(
                  activity.media_type,
                  activity.external_id
                );

              return (
                <div
                  key={
                    activity.id
                  }
                  className="w-[155px] shrink-0"
                >
                  {review ? (
                    <ProfileReviewModal
                      reviewId={
                        review.id
                      }
                      mediaType={
                        review.media_type
                      }
                      title={
                        review.title
                      }
                      coverUrl={
                        cover
                      }
                      posterPositionX={
                        positionX
                      }
                      posterPositionY={
                        positionY
                      }
                      posterZoom={
                        zoom
                      }
                      createdAt={
                        activity.created_at
                      }
                      variant="poster"
                    />
                  ) : (
                    <StandardPoster
                      href={
                        href
                      }
                      cover={
                        cover
                      }
                      title={
                        activity.title
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
                      size="preview"
                    />
                  )}

                  <div className="mt-2">
                    {review ? (
                      <>
                        <ReviewIcons
                          review={
                            review
                          }
                        />

                        <p className="mt-1 truncate text-[11px] text-zinc-600">
                          Ver review
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <ActivityStatus
                          activity={
                            activity
                          }
                        />

                        <span className="truncate text-xs">
                          {activity.activity_type ===
                            "EPISODE_WATCHED" &&
                          activity.season_number !==
                            null &&
                          activity.episode_number !==
                            null
                            ? `T${activity.season_number} E${activity.episode_number}`
                            : getActivityLabel(
                                activity
                              )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>

        <Link
          href={`/profile/${encodeURIComponent(
            username
          )}/activity`}
          className="mt-2 inline-block text-sm text-zinc-500 transition hover:text-zinc-200"
        >
          Ver más actividad reciente →
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {activities.map(
        (
          activity
        ) => {
          const review =
            activity.review_id
              ? reviewsById.get(
                  activity.review_id
                )
              : undefined;

          const override =
            getArtworkOverride(
              activity,
              artworkOverrides
            );

          const {
            cover,
            positionX,
            positionY,
            zoom,
          } =
            getCoverData(
              activity,
              review,
              override
            );

          const href =
            getMediaHref(
              activity.media_type,
              activity.external_id
            );

          return (
            <article
              key={
                activity.id
              }
              className="flex gap-5 py-5"
            >
              <div className="w-[85px] shrink-0">
                {review ? (
                  <ProfileReviewModal
                    reviewId={
                      review.id
                    }
                    mediaType={
                      review.media_type
                    }
                    title={
                      review.title
                    }
                    coverUrl={
                      cover
                    }
                    posterPositionX={
                      positionX
                    }
                    posterPositionY={
                      positionY
                    }
                    posterZoom={
                      zoom
                    }
                    createdAt={
                      activity.created_at
                    }
                    variant="poster"
                  />
                ) : (
                  <StandardPoster
                    href={
                      href
                    }
                    cover={
                      cover
                    }
                    title={
                      activity.title
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
                    size="full"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-zinc-400">
                      {getFullActivityText(
                        activity
                      )}{" "}

                      <Link
                        href={
                          href
                        }
                        className="font-medium text-zinc-100 transition hover:text-fuchsia-300"
                      >
                        {
                          activity.title
                        }
                      </Link>
                    </p>

                    {activity.activity_type ===
                      "EPISODE_WATCHED" &&
                      activity.season_number !==
                        null &&
                      activity.episode_number !==
                        null && (
                        <p className="mt-2 text-sm text-zinc-400">
                          T
                          {
                            activity.season_number
                          }{" "}
                          E
                          {
                            activity.episode_number
                          }

                          {activity.episode_title
                            ? ` · ${activity.episode_title}`
                            : ""}
                        </p>
                      )}
                  </div>

                  <span className="shrink-0 text-xs text-zinc-600">
                    {formatActivityDate(
                      activity.created_at
                    )}
                  </span>
                </div>

                {review && (
                  <div className="mt-4">
                    <ReviewIcons
                      review={
                        review
                      }
                      size={
                        17
                      }
                    />

                    {review.contains_spoilers ? (
                      <p className="mt-3 text-sm text-zinc-600">
                        Esta reseña contiene spoilers.
                        Pulsa la portada para verla.
                      </p>
                    ) : review.review_text ? (
                      <p className="mt-3 line-clamp-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                        {
                          review.review_text
                        }
                      </p>
                    ) : (
                      <p className="mt-3 text-sm italic text-zinc-600">
                        Review sin texto.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        }
      )}
    </div>
  );
}