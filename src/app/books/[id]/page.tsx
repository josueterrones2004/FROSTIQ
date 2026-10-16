import {
  BookOpen,
  UserRound,
} from "lucide-react";

import MediaDetailLayout from "@/components/media/MediaDetailLayout";
import MediaRatings from "@/components/media/MediaRatings";

import MediaReviews, {
  type MediaReviewItem,
} from "@/components/media/MediaReviews";

import {
  getMediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  getMediaRatingStats,
} from "@/lib/media-ratings";

import {
  getAuthorDetails,
  getBookDescription,
  getBookDetails,
  getOpenLibraryCoverUrl,
} from "@/lib/openlibrary";

import {
  createClient,
} from "@/lib/supabase/server";

import BookActions from "./BookActions";

interface BookPageProps {
  params: Promise<{
    id: string;
  }>;
}

type BookReviewRow = {
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

/* =========================================================
   SUBJECTS
========================================================= */

function cleanSubjects(
  subjects:
    | string[]
    | undefined,
) {
  const result:
    string[] = [];

  const seen =
    new Set<string>();

  for (
    const rawSubject
    of subjects ?? []
  ) {
    const parts =
      rawSubject.split(
        /[,;]+/,
      );

    for (
      const rawPart
      of parts
    ) {
      let subject =
        rawPart
          .trim()
          .replace(
            /[-_]+/g,
            " ",
          )
          .replace(
            /\s+/g,
            " ",
          );

      if (!subject) {
        continue;
      }

      const normalized =
        subject.toLowerCase();

      /*
       * Ruido habitual de Open Library.
       */

      if (
        normalized.startsWith(
          "nyt:",
        ) ||
        normalized.includes(
          "imaginary place",
        ) ||
        normalized.includes(
          "new york times",
        ) ||
        normalized.includes(
          "mass market",
        ) ||
        normalized.includes(
          "reviewed",
        ) ||
        normalized.includes(
          "=",
        ) ||
        /\b\d{4}\b/.test(
          normalized,
        )
      ) {
        continue;
      }

      if (
        normalized ===
          "general" ||
        normalized ===
          "books" ||
        normalized ===
          "literature"
      ) {
        continue;
      }

      if (
        subject.length >
        32
      ) {
        continue;
      }

      if (
        normalized ===
        "science fiction"
      ) {
        subject =
          "Science fiction";
      }

      if (
        normalized ===
        "fiction"
      ) {
        subject =
          "Fiction";
      }

      const dedupeKey =
        subject
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            "",
          );

      if (
        !dedupeKey ||
        seen.has(
          dedupeKey,
        )
      ) {
        continue;
      }

      seen.add(
        dedupeKey,
      );

      result.push(
        subject,
      );

      if (
        result.length >=
        4
      ) {
        return result;
      }
    }
  }

  return result;
}

/* =========================================================
   YEAR
========================================================= */

function getBookYear(
  book: unknown,
) {
  if (
    typeof book !==
      "object" ||
    book === null
  ) {
    return null;
  }

  if (
    !(
      "first_publish_date" in
      book
    )
  ) {
    return null;
  }

  const value =
    book.first_publish_date;

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const match =
    value.match(
      /\b(\d{4})\b/,
    );

  if (!match) {
    return null;
  }

  const year =
    Number(
      match[1],
    );

  return Number.isFinite(
    year,
  )
    ? year
    : null;
}

/* =========================================================
   REVIEWS
========================================================= */

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
  review: BookReviewRow,

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

/* =========================================================
   PAGE
========================================================= */

export default async function BookPage({
  params,
}: BookPageProps) {
  const {
    id,
  } =
    await params;

  const supabase =
    await createClient();

  const [
    book,
    override,
    ratingStats,
    authResult,
  ] =
    await Promise.all([
      getBookDetails(
        id,
      ),

      getMediaArtworkOverride(
        "book",
        id,
      ),

      getMediaRatingStats(
        "BOOK",
        id,
      ),

      supabase.auth.getUser(),
    ]);

  const user =
    authResult.data.user;

  /* =======================================================
     BOOK DATA
  ======================================================= */

  const description =
    getBookDescription(
      book.description,
    );

  const coverId =
    book.covers?.[0] ??
    null;

  const automaticCover =
    getOpenLibraryCoverUrl(
      coverId,
      "L",
    );

  const cover =
    override
      ?.poster_url ??
    automaticCover;

  /*
   * Open Library no suele dar backdrop.
   * Si el OWNER puso uno manual,
   * sí lo utilizamos.
   */

  const backdrop =
    override
      ?.backdrop_url ??
    null;

  /* =======================================================
     AUTHORS
  ======================================================= */

  const authorKeys =
    book.authors
      ?.map(
        (
          entry,
        ) =>
          entry.author
            ?.key,
      )
      .filter(
        (
          key,
        ): key is string =>
          Boolean(
            key,
          ),
      ) ??
    [];

  const authorResults =
    await Promise.all(
      authorKeys.map(
        (
          key,
        ) =>
          getAuthorDetails(
            key,
          ),
      ),
    );

  const authors =
    authorResults
      .filter(
        (
          author,
        ): author is NonNullable<
          typeof author
        > =>
          Boolean(
            author,
          ),
      )
      .map(
        (
          author,
        ) =>
          author.name,
      );

  /* =======================================================
     GENRES
  ======================================================= */

  const subjects =
    cleanSubjects(
      book.subjects,
    );

  /* =======================================================
     YEAR
  ======================================================= */

  const releaseYear =
    getBookYear(
      book,
    );

  /* =======================================================
     META
  ======================================================= */

  const meta:
    string[] = [];

  if (
    authors.length >
    0
  ) {
    meta.push(
      authors.join(
        ", ",
      ),
    );
  }

  if (
    releaseYear
  ) {
    meta.push(
      String(
        releaseYear,
      ),
    );
  }

  /* =======================================================
     INFORMATION
  ======================================================= */

  const information = [
    {
      label:
        "Tipo",

      value:
        "Libro",

      icon: (
        <BookOpen
          size={15}
        />
      ),
    },

    ...(authors.length >
    0
      ? [
          {
            label:
              authors.length ===
              1
                ? "Autor"
                : "Autores",

            value:
              authors.join(
                ", ",
              ),

            icon: (
              <UserRound
                size={15}
              />
            ),
          },
        ]
      : []),
  ];

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
        "BOOK",
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
      .limit(50);

  if (
    reviewsError
  ) {
    console.error(
      "Error loading book reviews:",
      reviewsError,
    );
  }

  const reviewRows =
    (
      reviewRowsData ??
      []
    ) as BookReviewRow[];

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

  /* =======================================================
     REVIEW PROFILES
  ======================================================= */

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
        "Error loading book review profiles:",
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

  /* =======================================================
     FOLLOWING
  ======================================================= */

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
        "Error loading followed users for book reviews:",
        followingError,
      );
    }

    followingIds =
      new Set(
        (
          followingData ??
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

  /* =======================================================
     REVIEW ITEMS
  ======================================================= */

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
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-black">
      <MediaDetailLayout
        title={
          book.title
        }
        eyebrow="Libro"
        heroMode="compact"
        coverUrl={
          cover
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
         * YA NO pasamos tags={subjects}.
         *
         * Así desaparecen de debajo
         * del título/autor.
         */

        description={
          description
        }
        noDescriptionText="No hay una sinopsis disponible para este libro."
        information={
          information
        }
      >
        <BookActions
          book={{
            id,

            title:
              book.title,

            coverUrl:
              cover,

            authors,
          }}
        />

        <MediaRatings
          stats={
            ratingStats
          }
        />
      </MediaDetailLayout>

      {/* ==================================================
          GÉNEROS

          En móvil ocupa todo el ancho.
          En desktop se coloca en la columna derecha,
          debajo de Información.
      ================================================== */}

      {subjects.length >
      0 ? (
        <section className="-mt-8 bg-black sm:-mt-10 lg:-mt-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
              <div className="hidden lg:block" />

              <div>
                <div className="border-b border-white/10 pb-3">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.21em] text-zinc-500">
                    Géneros
                  </h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {subjects.map(
                    (
                      subject,
                    ) => (
                      <span
                        key={
                          subject
                        }
                        className="rounded-full bg-white/[0.045] px-3 py-1.5 text-xs text-zinc-300"
                      >
                        {
                          subject
                        }
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================================================
          REVIEWS

          Después de Información + Géneros.
      ================================================== */}

      <section
        className={`bg-black pb-12 ${
          subjects.length >
          0
            ? "pt-9"
            : "-mt-8 pt-0 sm:-mt-10 lg:-mt-12"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <MediaReviews
            friendReviews={
              friendReviews
            }
            reviews={
              communityReviews
            }
            mediaTitle={
              book.title
            }
            mediaYear={
              releaseYear
            }
            mediaPosterUrl={
              cover
            }
            mediaTypeLabel="Libro"
          />
        </div>
      </section>
    </div>
  );
}