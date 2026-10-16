import {
  notFound,
} from "next/navigation";

import type {
  MediaReviewItem,
} from "@/components/media/MediaReviews";

import type {
  MovieCastMember,
  MovieCrewMember,
  MovieDetailsInfo,
} from "@/components/movies/MovieInfoTabs";

import MovieBigPictureLayout from "@/components/movies/MovieBigPictureLayout";

import {
  FOLLOW_TABLE,
} from "@/lib/follows";

import {
  getMediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  getMediaRatingStats,
} from "@/lib/media-ratings";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getMovieDetails,
} from "@/lib/tmdb";

import MovieActions from "./MovieActions";

interface MoviePageProps {
  params: Promise<{
    id: string;
  }>;
}

type Genre = {
  id: number;
  name: string;
};

type ProductionCompany = {
  id: number;
  name: string;
};

type ProductionCountry = {
  iso_3166_1: string;
  name: string;
};

type SpokenLanguage = {
  iso_639_1?: string;
  english_name?: string;
  name?: string;
};

type MovieDetails = {
  id: number;

  title: string;

  original_title?:
    string;

  overview?:
    string;

  poster_path?:
    | string
    | null;

  backdrop_path?:
    | string
    | null;

  release_date?:
    string;

  runtime?:
    number;

  genres?:
    Genre[];

  production_companies?:
    ProductionCompany[];

  production_countries?:
    ProductionCountry[];

  original_language?:
    string;

  spoken_languages?:
    SpokenLanguage[];
};

type TMDBCastMember = {
  id: number;
  name: string;

  character?:
    string;

  order?:
    number;

  profile_path?:
    | string
    | null;
};

type TMDBCrewMember = {
  id: number;
  name: string;

  job?:
    string;

  department?:
    string;

  profile_path?:
    | string
    | null;
};

type TMDBCreditsResponse = {
  cast?:
    TMDBCastMember[];

  crew?:
    TMDBCrewMember[];
};

type TMDBAlternativeTitle = {
  title: string;
};

type AlternativeTitlesResponse = {
  titles?:
    TMDBAlternativeTitle[];
};

type ReviewRow = {
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

type ReviewProfile = {
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
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
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

function uniqueStrings(
  values: string[],
) {
  return Array.from(
    new Set(
      values
        .map(
          (value) =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  );
}

function getLanguageName(
  code:
    | string
    | undefined,

  fallback?:
    string,
) {
  if (!code) {
    return (
      fallback ??
      null
    );
  }

  try {
    const displayNames =
      new Intl.DisplayNames(
        [
          "es-MX",
        ],
        {
          type:
            "language",
        },
      );

    const value =
      displayNames.of(
        code,
      );

    if (value) {
      return (
        value
          .charAt(0)
          .toUpperCase() +
        value.slice(1)
      );
    }
  } catch {
    // fallback
  }

  return (
    fallback ??
    code.toUpperCase()
  );
}

function getCountryName(
  code:
    | string
    | undefined,

  fallback?:
    string,
) {
  if (!code) {
    return (
      fallback ??
      null
    );
  }

  try {
    const displayNames =
      new Intl.DisplayNames(
        [
          "es-MX",
        ],
        {
          type:
            "region",
        },
      );

    return (
      displayNames.of(
        code,
      ) ??
      fallback ??
      code
    );
  } catch {
    return (
      fallback ??
      code
    );
  }
}

function getPersonImageUrl(
  profilePath:
    | string
    | null
    | undefined,
) {
  if (!profilePath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w185${profilePath}`;
}

async function getMovieExtraData(
  id: string,
) {
  const token =
    process.env.TMDB_READ_TOKEN;

  if (!token) {
    return {
      credits: {
        cast: [],
        crew: [],
      } satisfies TMDBCreditsResponse,

      alternativeTitles: {
        titles: [],
      } satisfies AlternativeTitlesResponse,
    };
  }

  const headers = {
    Authorization:
      `Bearer ${token}`,

    accept:
      "application/json",
  };

  const [
    creditsResponse,
    titlesResponse,
  ] =
    await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/movie/${id}/credits?language=es-MX`,
        {
          headers,

          next: {
            revalidate:
              3600,
          },
        },
      ),

      fetch(
        `https://api.themoviedb.org/3/movie/${id}/alternative_titles`,
        {
          headers,

          next: {
            revalidate:
              3600,
          },
        },
      ),
    ]);

  let credits:
    TMDBCreditsResponse =
    {
      cast: [],
      crew: [],
    };

  let alternativeTitles:
    AlternativeTitlesResponse =
    {
      titles: [],
    };

  if (
    creditsResponse.ok
  ) {
    credits =
      await creditsResponse.json();
  } else {
    console.error(
      "Error loading movie credits:",
      creditsResponse.status,
    );
  }

  if (
    titlesResponse.ok
  ) {
    alternativeTitles =
      await titlesResponse.json();
  } else {
    console.error(
      "Error loading alternative movie titles:",
      titlesResponse.status,
    );
  }

  return {
    credits,
    alternativeTitles,
  };
}

export default async function MoviePage({
  params,
}: MoviePageProps) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const [
    movieResult,
    artwork,
    ratingStats,
    authResult,
    extraData,
    reviewsResult,
  ] =
    await Promise.all([
      getMovieDetails(id),

      getMediaArtworkOverride(
        "movie",
        id,
      ),

      getMediaRatingStats(
        "MOVIE",
        id,
      ),

      supabase.auth.getUser(),

      getMovieExtraData(
        id,
      ),

      supabase
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
          "MOVIE",
        )
        .eq(
          "external_id",
          id,
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
        .limit(
          20,
        ),
    ]);

  if (!movieResult) {
    notFound();
  }

  const movie =
    movieResult as MovieDetails;

  const user =
    authResult.data.user;

  if (
    reviewsResult.error
  ) {
    console.error(
      "Error loading movie reviews:",
      reviewsResult.error,
    );
  }

  const rawReviews =
    (
      reviewsResult.data ??
      []
    ) as ReviewRow[];

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
        "Error checking movie owner status:",
        profileError,
      );
    }

    isOwner =
      profile
        ?.special_role ===
      "OWNER";
  }

  /*
   * REVIEWS / PROFILES
   */

  const reviewUserIds =
    Array.from(
      new Set(
        rawReviews.map(
          (review) =>
            review.user_id,
        ),
      ),
    );

  let reviewProfiles:
    ReviewProfile[] =
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
        "Error loading review profiles:",
        error,
      );
    }

    reviewProfiles =
      (
        data ??
        []
      ) as ReviewProfile[];
  }

  const profileMap =
    new Map(
      reviewProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ],
      ),
    );

  const followedUserIds =
    new Set<string>();

  if (user) {
    const {
      data:
        followsData,

      error:
        followsError,
    } =
      await supabase
        .from(
          FOLLOW_TABLE,
        )
        .select(
          "following_id",
        )
        .eq(
          "follower_id",
          user.id,
        );

    if (
      followsError
    ) {
      console.error(
        "Error loading followed users:",
        followsError,
      );
    }

    for (
      const follow of
      (
        followsData ??
        []
      ) as FollowRow[]
    ) {
      followedUserIds.add(
        follow.following_id,
      );
    }
  }

  const allReviews:
    MediaReviewItem[] =
    rawReviews
      .filter(
        (review) =>
          Boolean(
            review.review_text
              ?.trim(),
          ),
      )
      .map(
        (review) => {
          const profile =
            profileMap.get(
              review.user_id,
            );

          const parsedRating =
            review.rating ===
              null
              ? null
              : Number(
                  review.rating,
                );

          return {
            id:
              review.id,

            userId:
              review.user_id,

            username:
              profile
                ?.username ??
              null,

            displayName:
              profile
                ?.display_name ??
              profile
                ?.username ??
              "Usuario",

            avatarUrl:
              profile
                ?.avatar_url ??
              null,

            reviewText:
              review.review_text
                ?.trim() ??
              "",

            rating:
              parsedRating !==
                null &&
              Number.isFinite(
                parsedRating,
              )
                ? parsedRating
                : null,

            liked:
              review.liked ===
              true,

            containsSpoilers:
              review
                .contains_spoilers ===
              true,

            createdAt:
              review.created_at,

            consumedAt:
              review.consumed_at,
          };
        },
      );

  const friendReviews =
    allReviews
      .filter(
        (review) =>
          followedUserIds.has(
            review.userId,
          ),
      )
      .slice(
        0,
        4,
      );

  const friendReviewIds =
    new Set(
      friendReviews.map(
        (review) =>
          review.id,
      ),
    );

  const communityReviews =
    allReviews
      .filter(
        (review) =>
          !friendReviewIds.has(
            review.id,
          ),
      )
      .slice(
        0,
        8,
      );

  /*
   * CAST
   */

  const cast:
    MovieCastMember[] =
    (
      extraData
        .credits
        .cast ??
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
        40,
      )
      .map(
        (member) => ({
          name:
            member.name,

          character:
            member.character
              ?.trim() ||
            null,

          imageUrl:
            getPersonImageUrl(
              member.profile_path,
            ),
        }),
      );

  /*
   * CREW
   */

  const interestingJobs =
    new Set([
      "Director",
      "Producer",
      "Executive Producer",
      "Screenplay",
      "Writer",
      "Story",
      "Director of Photography",
      "Original Music Composer",
      "Editor",
    ]);

  const crew:
    MovieCrewMember[] =
    (
      extraData
        .credits
        .crew ??
      []
    )
      .filter(
        (member) =>
          Boolean(
            member.job &&
              interestingJobs.has(
                member.job,
              ),
          ),
      )
      .slice(
        0,
        40,
      )
      .map(
        (member) => ({
          name:
            member.name,

          job:
            member.job ??
            member.department ??
            "Equipo",

          imageUrl:
            getPersonImageUrl(
              member.profile_path,
            ),
        }),
      );

  /*
   * DETAILS
   */

  const studios =
    uniqueStrings(
      (
        movie.production_companies ??
        []
      ).map(
        (company) =>
          company.name,
      ),
    );

  const countries =
    uniqueStrings(
      (
        movie.production_countries ??
        []
      )
        .map(
          (country) =>
            getCountryName(
              country.iso_3166_1,
              country.name,
            ),
        )
        .filter(
          (
            country,
          ): country is string =>
            Boolean(
              country,
            ),
        ),
    );

  const originalLanguage =
    getLanguageName(
      movie.original_language,
    );

  const spokenLanguages =
    uniqueStrings(
      (
        movie.spoken_languages ??
        []
      )
        .map(
          (language) =>
            getLanguageName(
              language.iso_639_1,
              language.name ??
                language.english_name,
            ),
        )
        .filter(
          (
            language,
          ): language is string =>
            Boolean(
              language,
            ),
        ),
    );

  const alternativeTitles =
    uniqueStrings(
      (
        extraData
          .alternativeTitles
          .titles ??
        []
      ).map(
        (title) =>
          title.title,
      ),
    ).slice(
      0,
      20,
    );

  const details:
    MovieDetailsInfo =
    {
      studios,
      countries,
      originalLanguage,
      spokenLanguages,
      alternativeTitles,
    };

  /*
   * ARTWORK
   */

  const automaticPoster =
    movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null;

  const automaticBackdrop =
    movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : null;

  const poster =
    artwork
      ?.poster_url ??
    automaticPoster;

  const backdrop =
    artwork
      ?.backdrop_url ??
    automaticBackdrop;

  const year =
    movie.release_date
      ? Number(
          movie.release_date.slice(
            0,
            4,
          ),
        )
      : null;

  const runtime =
    movie.runtime &&
    movie.runtime > 0
      ? movie.runtime
      : null;

  const releaseDate =
    formatReleaseDate(
      movie.release_date,
    );

  const originalTitle =
    movie.original_title &&
    movie.original_title !==
      movie.title
      ? movie.original_title
      : null;

  const genres =
    Array.from(
      new Set(
        (
          movie.genres ??
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
   * DEV BUTTON
   */

  const devSearchParams =
    new URLSearchParams({
      kind: "movie",

      id:
        String(
          movie.id,
        ),

      title:
        movie.title,

      href:
        `/movies/${movie.id}`,
    });

  if (poster) {
    devSearchParams.set(
      "image",
      poster,
    );
  }

  if (year) {
    devSearchParams.set(
      "year",
      String(year),
    );
  }

  const developerActionHref =
    isOwner
      ? `/admin/media?${devSearchParams.toString()}`
      : null;

  const actions =
    user ? (
      <MovieActions
        movie={{
          id:
            String(
              movie.id,
            ),

          title:
            movie.title,

          originalTitle:
            movie.original_title ??
            null,

          coverUrl:
            poster,

          backdropUrl:
            backdrop,

          releaseYear:
            year,
        }}
      />
    ) : undefined;

  return (
    <MovieBigPictureLayout
      title={
        movie.title
      }
      description={
        movie.overview ??
        null
      }
      posterUrl={
        poster
      }
      backdropUrl={
        backdrop
      }
      posterPositionX={
        artwork
          ?.poster_position_x ??
        50
      }
      posterPositionY={
        artwork
          ?.poster_position_y ??
        50
      }
      posterZoom={
        artwork
          ?.poster_zoom ??
        1
      }
      backdropPositionX={
        artwork
          ?.backdrop_position_x ??
        50
      }
      backdropPositionY={
        artwork
          ?.backdrop_position_y ??
        50
      }
      backdropZoom={
        artwork
          ?.backdrop_zoom ??
        1
      }
      year={year}
      releaseDate={
        releaseDate
      }
      runtime={
        runtime
      }
      originalTitle={
        originalTitle
      }
      genres={
        genres
      }
      ratingStats={
        ratingStats
      }
      cast={cast}
      crew={crew}
      details={
        details
      }
      friendReviews={
        friendReviews
      }
      reviews={
        communityReviews
      }
      actions={
        actions
      }
      developerActionHref={
        developerActionHref
      }
    />
  );
}