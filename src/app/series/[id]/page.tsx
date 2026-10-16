import {
  CalendarDays,
  Layers3,
  ListVideo,
  Tv,
} from "lucide-react";

import MediaDetailLayout from "@/components/media/MediaDetailLayout";
import MediaRatings from "@/components/media/MediaRatings";

import MediaReviews, {
  type MediaReviewItem,
} from "@/components/media/MediaReviews";

import SeriesInfoTabs, {
  type SeriesCastMember,
  type SeriesCrewMember,
  type SeriesDetailsInfo,
} from "@/components/series/SeriesInfoTabs";

import {
  getMediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  getMediaRatingStats,
} from "@/lib/media-ratings";

import {
  getSeriesDetails,
} from "@/lib/tmdb";

import {
  createClient,
} from "@/lib/supabase/server";

import Seasons from "./Seasons";
import SeriesActions from "./SeriesActions";

type Genre = {
  id: number;
  name: string;
};

type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;

  poster_path?:
    | string
    | null;
};

type CastMember = {
  id: number;
  name: string;

  character?:
    | string
    | null;

  profile_path?:
    | string
    | null;

  order?: number;
};

type CrewMember = {
  id: number;
  name: string;

  job?:
    | string
    | null;

  department?:
    | string
    | null;

  profile_path?:
    | string
    | null;
};

type Creator = {
  id: number;
  name: string;

  profile_path?:
    | string
    | null;
};

type Network = {
  id: number;
  name: string;
};

type SeriesDetails = {
  id: number;
  name: string;

  original_name?: string;

  overview?: string;

  poster_path?:
    | string
    | null;

  backdrop_path?:
    | string
    | null;

  first_air_date?: string;

  number_of_seasons?: number;
  number_of_episodes?: number;

  genres?: Genre[];
  seasons?: Season[];

  status?:
    | string
    | null;

  type?:
    | string
    | null;

  original_language?:
    | string
    | null;

  origin_country?: string[];

  networks?: Network[];

  created_by?: Creator[];

  credits?: {
    cast?: CastMember[];
    crew?: CrewMember[];
  };
};

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

type SeriesReviewRow = {
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

function formatReleaseDate(
  date:
    | string
    | undefined,
) {
  if (!date) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day:
          "numeric",

        month:
          "long",

        year:
          "numeric",

        timeZone:
          "UTC",
      },
    ).format(
      new Date(
        `${date}T00:00:00Z`,
      ),
    );
  } catch {
    return date;
  }
}

function getProfileUrl(
  path:
    | string
    | null
    | undefined,
) {
  return path
    ? `https://image.tmdb.org/t/p/w185${path}`
    : null;
}

function translateStatus(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

  const map:
    Record<
      string,
      string
    > = {
      "Returning Series":
        "En emisión",

      Ended:
        "Finalizada",

      Canceled:
        "Cancelada",

      "In Production":
        "En producción",

      Planned:
        "Planificada",

      Pilot:
        "Piloto",
    };

  return (
    map[value] ??
    value
  );
}

function translateFormat(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

  const map:
    Record<
      string,
      string
    > = {
      Scripted:
        "Serie",

      Miniseries:
        "Miniserie",

      Documentary:
        "Documental",

      Reality:
        "Reality",

      News:
        "Noticias",

      Talk:
        "Talk show",

      Video:
        "Video",
    };

  return (
    map[value] ??
    value
  );
}

function languageName(
  code:
    | string
    | null
    | undefined,
) {
  if (!code) {
    return null;
  }

  try {
    return (
      new Intl.DisplayNames(
        ["es"],
        {
          type:
            "language",
        },
      ).of(code) ??
      code
    );
  } catch {
    return code;
  }
}

function countryName(
  code: string,
) {
  try {
    return (
      new Intl.DisplayNames(
        ["es"],
        {
          type:
            "region",
        },
      ).of(code) ??
      code
    );
  } catch {
    return code;
  }
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
  review: SeriesReviewRow,

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

export default async function SeriesDetailsPage({
  params,
}: SeriesPageProps) {
  const {
    id,
  } =
    await params;

  const supabase =
    await createClient();

  const [
    showResult,
    override,
    ratingStats,
    authResult,
  ] =
    await Promise.all([
      getSeriesDetails(
        id,
      ),

      getMediaArtworkOverride(
        "series",
        id,
      ),

      getMediaRatingStats(
        "SERIES",
        id,
      ),

      supabase.auth.getUser(),
    ]);

  const show =
    showResult as
      SeriesDetails;

  const user =
    authResult.data.user;

  /* =======================================================
     ARTWORK
  ======================================================= */

  const automaticPoster =
    show.poster_path
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : null;

  const automaticBackdrop =
    show.backdrop_path
      ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
      : null;

  const poster =
    override
      ?.poster_url ??
    automaticPoster;

  const backdrop =
    override
      ?.backdrop_url ??
    automaticBackdrop;

  /* =======================================================
     BASIC DATA
  ======================================================= */

  const year =
    show.first_air_date
      ? Number(
          show.first_air_date.slice(
            0,
            4,
          ),
        )
      : null;

  const releaseDate =
    formatReleaseDate(
      show.first_air_date,
    );

  const seasonCount =
    show.number_of_seasons ??
    null;

  const episodeCount =
    show.number_of_episodes ??
    null;

  const originalName =
    show.original_name &&
    show.original_name !==
      show.name
      ? show.original_name
      : null;

  const meta:
    string[] = [];

  if (year) {
    meta.push(
      String(
        year,
      ),
    );
  }

  if (
    seasonCount !==
    null
  ) {
    meta.push(
      `${seasonCount} ${
        seasonCount ===
        1
          ? "temporada"
          : "temporadas"
      }`,
    );
  }

  if (
    episodeCount !==
    null
  ) {
    meta.push(
      `${episodeCount} ${
        episodeCount ===
        1
          ? "episodio"
          : "episodios"
      }`,
    );
  }

  /* =======================================================
     INFO SIDEBAR
  ======================================================= */

  const information = [
    ...(releaseDate
      ? [
          {
            label:
              "Estreno",

            value:
              releaseDate,

            icon: (
              <CalendarDays
                size={15}
              />
            ),
          },
        ]
      : []),

    {
      label:
        "Tipo",

      value:
        "Serie",

      icon: (
        <Tv
          size={15}
        />
      ),
    },

    ...(seasonCount !==
    null
      ? [
          {
            label:
              "Temporadas",

            value:
              String(
                seasonCount,
              ),

            icon: (
              <Layers3
                size={15}
              />
            ),
          },
        ]
      : []),

    ...(episodeCount !==
    null
      ? [
          {
            label:
              "Episodios",

            value:
              String(
                episodeCount,
              ),

            icon: (
              <ListVideo
                size={15}
              />
            ),
          },
        ]
      : []),

    ...(originalName
      ? [
          {
            label:
              "Título original",

            value:
              originalName,

            icon: (
              <Tv
                size={15}
              />
            ),
          },
        ]
      : []),
  ];

  /* =======================================================
     CAST
  ======================================================= */

  const cast:
    SeriesCastMember[] =
      (
        show.credits
          ?.cast ??
        []
      )
        .sort(
          (
            first,
            second,
          ) =>
            (
              first.order ??
              999
            ) -
            (
              second.order ??
              999
            ),
        )
        .slice(
          0,
          30,
        )
        .map(
          (
            person,
          ) => ({
            id:
              person.id,

            name:
              person.name,

            character:
              person.character ??
              null,

            imageUrl:
              getProfileUrl(
                person.profile_path,
              ),
          }),
        );

  /* =======================================================
     CREW
  ======================================================= */

  const interestingJobs =
    new Set([
      "Executive Producer",
      "Producer",
      "Director",
      "Writer",
      "Screenplay",
      "Story",
      "Director of Photography",
      "Original Music Composer",
      "Editor",
    ]);

  const crewMap =
    new Map<
      string,
      SeriesCrewMember
    >();

  for (
    const creator
    of show.created_by ??
    []
  ) {
    crewMap.set(
      `creator-${creator.id}`,
      {
        id:
          `creator-${creator.id}`,

        name:
          creator.name,

        job:
          "Creador",

        imageUrl:
          getProfileUrl(
            creator.profile_path,
          ),
      },
    );
  }

  for (
    const member
    of show.credits
      ?.crew ??
    []
  ) {
    if (
      !member.job ||
      !interestingJobs.has(
        member.job,
      )
    ) {
      continue;
    }

    const key =
      `${member.id}-${member.job}`;

    if (
      crewMap.has(
        key,
      )
    ) {
      continue;
    }

    crewMap.set(
      key,
      {
        id:
          key,

        name:
          member.name,

        job:
          member.job,

        imageUrl:
          getProfileUrl(
            member.profile_path,
          ),
      },
    );
  }

  const crew =
    Array.from(
      crewMap.values(),
    ).slice(
      0,
      30,
    );

  /* =======================================================
     DETAILS
  ======================================================= */

  const details:
    SeriesDetailsInfo =
    {
      genres:
        (
          show.genres ??
          []
        ).map(
          (
            genre,
          ) =>
            genre.name,
        ),

      networks:
        (
          show.networks ??
          []
        ).map(
          (
            network,
          ) =>
            network.name,
        ),

      status:
        translateStatus(
          show.status,
        ),

      format:
        translateFormat(
          show.type,
        ),

      originalLanguage:
        languageName(
          show.original_language,
        ),

      countries:
        (
          show.origin_country ??
          []
        ).map(
          countryName,
        ),

      originalName,

      firstAirDate:
        releaseDate,

      seasonCount,

      episodeCount,
    };

  /* =======================================================
     REVIEWS
  ======================================================= */

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
        "SERIES",
      )
      .eq(
        "external_id",
        String(
          show.id,
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
      "Error loading series reviews:",
      reviewsError,
    );
  }

  const reviewRows =
    (
      reviewRowsData ??
      []
    ) as SeriesReviewRow[];

  const reviewsWithText =
    reviewRows.filter(
      (
        review,
      ) =>
        Boolean(
          review
            .review_text
            ?.trim(),
        ),
    );

  const reviewUserIds =
    Array.from(
      new Set(
        reviewsWithText.map(
          (
            review,
          ) =>
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
      data,
      error,
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

    if (error) {
      console.error(
        "Error loading series review profiles:",
        error,
      );
    }

    reviewProfiles =
      (
        data ??
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

  let followingIds =
    new Set<string>();

  if (user) {
    const {
      data,
      error,
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

    if (error) {
      console.error(
        "Error loading followed users for series reviews:",
        error,
      );
    }

    followingIds =
      new Set(
        (
          data ??
          []
        ).map(
          (
            follow,
          ) =>
            (
              follow as FollowRow
            ).following_id,
        ),
      );
  }

  const allReviews =
    reviewsWithText.map(
      (
        review,
      ) =>
        buildReviewItem(
          review,

          profileByUserId.get(
            review.user_id,
          ),
        ),
    );

  const friendReviews =
    allReviews.filter(
      (
        review,
      ) =>
        followingIds.has(
          review.userId,
        ),
    );

  const communityReviews =
    allReviews.filter(
      (
        review,
      ) =>
        !followingIds.has(
          review.userId,
        ),
    );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-full bg-black">
      <MediaDetailLayout
        title={
          show.name
        }
        eyebrow="Serie"
        coverUrl={
          poster
        }
        backdropUrl={
          backdrop
        }
        coverPositionX={
          override
            ?.poster_position_x ??
          50
        }
        coverPositionY={
          override
            ?.poster_position_y ??
          50
        }
        coverZoom={
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
        meta={
          meta
        }

        /*
         * SIN tags={...}
         * Los géneros ahora están en Detalles.
         */

        description={
          show.overview ??
          null
        }
        noDescriptionText="No hay una sinopsis disponible para esta serie."
        information={
          information
        }
        mainContent={
          <>
            <SeriesInfoTabs
              cast={
                cast
              }
              crew={
                crew
              }
              details={
                details
              }
            />

            <Seasons
              seriesId={
                show.id
              }
              seriesTitle={
                show.name
              }
              posterUrl={
                poster
              }
              seasons={
                show.seasons ??
                []
              }
            />
          </>
        }
      >
        <SeriesActions
          show={
            show
          }
        />

        <MediaRatings
          stats={
            ratingStats
          }
        />
      </MediaDetailLayout>

      {/* REVIEWS SIEMPRE HASTA ABAJO */}

      <section className="-mt-8 bg-black pb-12 sm:-mt-10 lg:-mt-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <MediaReviews
            friendReviews={
              friendReviews
            }
            reviews={
              communityReviews
            }
            mediaTitle={
              show.name
            }
            mediaYear={
              year
            }
            mediaPosterUrl={
              poster
            }
            mediaTypeLabel="Serie"
          />
        </div>
      </section>
    </div>
  );
}