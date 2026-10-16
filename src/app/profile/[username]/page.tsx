import Image from "next/image";
import Link from "next/link";

import {
  getMediaArtworkMapKey,
  getMixedMediaArtworkOverrides,
  type MediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Heart,
  Library,
  Settings2,
  Tv,
} from "lucide-react";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  type ReactNode,
} from "react";

import FollowButton from "@/app/social/FollowButton";

import {
  FOLLOW_TABLE,
} from "@/lib/follows";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  createClient,
} from "@/lib/supabase/server";

import ProfileActivity from "../ProfileActivity";
import ProfileReviewModal from "../ProfileReviewModal";

import ProfileMediaHeader, {
  CroppedProfileImage,
  type ProfileCrop,
} from "../ProfileMediaHeader";

import ProfileSections from "../ProfileSections";

type SpecialRole =
  | "OWNER"
  | "BETA_TESTER"
  | null;

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

type ArtworkFields = {
  poster_position_x?:
    number;

  poster_position_y?:
    number;

  poster_zoom?:
    number;
};

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type MobileTab =
  | "profile"
  | "activity"
  | "reviews"
  | "pending";

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

  banner_url:
    | string
    | null;

  avatar_crop:
    | ProfileCrop
    | null;

  banner_crop:
    | ProfileCrop
    | null;

  special_role:
    SpecialRole;
};

type ProfileSectionRow = {
  section_key:
    SectionKey;

  visible:
    boolean;

  position:
    number;
};

type ProfileFavoriteRow = {
  id: string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  position:
    number;
} & ArtworkFields;

type LibraryItemRow = {
  id: string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  status:
    string;
} & ArtworkFields;

type ReviewRow = {
  id: string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  created_at:
    string;
} & ArtworkFields;

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;

  searchParams: Promise<{
    tab?: string;
  }>;
}

function isMobileTab(
  value:
    | string
    | undefined
): value is MobileTab {
  return (
    value ===
      "profile" ||
    value ===
      "activity" ||
    value ===
      "reviews" ||
    value ===
      "pending"
  );
}

function getMediaHref(
  mediaType:
    MediaType,

  externalId:
    string
) {
  switch (
    mediaType
  ) {
    case "MOVIE":
      return `/movies/${externalId}`;

    case "SERIES":
      return `/series/${externalId}`;

    case "BOOK":
      return `/books/${externalId}`;

    case "GAME":
      return `/games/${externalId}`;
  }
}

function getCurrentLabel(
  mediaType:
    MediaType
) {
  switch (
    mediaType
  ) {
    case "MOVIE":
      return "Pendiente";

    case "SERIES":
      return "Viendo";

    case "BOOK":
      return "Leyendo";

    case "GAME":
      return "Jugando";
  }
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PublicProfilePageProps) {
  const {
    username,
  } =
    await params;

  const {
    tab,
  } =
    await searchParams;

  const activeTab:
    MobileTab =
    isMobileTab(
      tab
    )
      ? tab
      : "profile";

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

  const {
    data:
      profileData,

    error:
      profileError,
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
        banner_url,
        avatar_crop,
        banner_crop,
        special_role
      `)
      .eq(
        "username",
        username
      )
      .maybeSingle();

  if (
    profileError
  ) {
    console.error(
      "Error loading public profile:",
      profileError
    );
  }

  if (
    !profileData
  ) {
    notFound();
  }

  const profile =
    profileData as Profile;

  const displayName =
    profile.display_name ??
    profile.username ??
    "Usuario";

  const isOwnProfile =
    profile.id ===
    user.id;

  let initialFollowing =
    false;

  if (
    !isOwnProfile
  ) {
    const {
      data:
        followData,

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
        )
        .eq(
          "following_id",
          profile.id
        )
        .maybeSingle();

    if (
      followError
    ) {
      console.error(
        "Error checking follow status:",
        followError
      );
    }

    initialFollowing =
      Boolean(
        followData
      );
  }

  const [
    followersResult,
    followingResult,
    sectionsResult,
    favoritesResult,
    libraryResult,
    reviewsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          FOLLOW_TABLE
        )
        .select(
          "follower_id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "following_id",
          profile.id
        ),

      supabase
        .from(
          FOLLOW_TABLE
        )
        .select(
          "following_id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "follower_id",
          profile.id
        ),

      supabase
        .from(
          "profile_sections"
        )
        .select(`
          section_key,
          visible,
          position
        `)
        .eq(
          "user_id",
          profile.id
        )
        .order(
          "position",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "profile_favorites"
        )
        .select(`
          id,
          media_type,
          external_id,
          title,
          cover_url,
          position
        `)
        .eq(
          "user_id",
          profile.id
        )
        .order(
          "position",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "library_items"
        )
        .select(`
          id,
          media_type,
          external_id,
          title,
          cover_url,
          status
        `)
        .eq(
          "user_id",
          profile.id
        ),

      supabase
        .from(
          "reviews"
        )
        .select(`
          id,
          media_type,
          external_id,
          title,
          cover_url,
          created_at
        `)
        .eq(
          "user_id",
          profile.id
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        ),
    ]);

  const followersCount =
    followersResult.count ??
    0;

  const followingCount =
    followingResult.count ??
    0;

  const sections =
    (
      sectionsResult.data ??
      []
    ) as ProfileSectionRow[];

  const rawFavorites =
    (
      favoritesResult.data ??
      []
    ) as ProfileFavoriteRow[];

  const rawLibrary =
    (
      libraryResult.data ??
      []
    ) as LibraryItemRow[];

  const rawReviews =
    (
      reviewsResult.data ??
      []
    ) as ReviewRow[];

  const artworkOverrides =
    await getMixedMediaArtworkOverrides([
      ...rawFavorites,
      ...rawLibrary,
      ...rawReviews,
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
    const override:
      | MediaArtworkOverride
      | undefined =
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

  const favorites =
    rawFavorites.map(
      applyArtwork
    );

  const library =
    rawLibrary.map(
      applyArtwork
    );

  const reviews =
    rawReviews.map(
      applyArtwork
    );

  const currentItems =
    library
      .filter(
        (
          item
        ) =>
          item.status ===
          "IN_PROGRESS"
      )
      .slice(
        0,
        4
      );

  const pendingItems =
    library.filter(
      (
        item
      ) =>
        item.status ===
        "PENDING"
    );

  const registeredMedia =
    new Map<
      string,
      MediaType
    >();

  for (
    const item of
    library
  ) {
    registeredMedia.set(
      `${item.media_type}:${item.external_id}`,
      item.media_type
    );
  }

  for (
    const review of
    reviews
  ) {
    registeredMedia.set(
      `${review.media_type}:${review.external_id}`,
      review.media_type
    );
  }

  const mediaCounts: Record<
    MediaType,
    number
  > = {
    MOVIE:
      0,

    SERIES:
      0,

    BOOK:
      0,

    GAME:
      0,
  };

  for (
    const mediaType of
    registeredMedia.values()
  ) {
    mediaCounts[
      mediaType
    ] +=
      1;
  }

  const recentReviews =
    reviews.slice(
      0,
      3
    );

  const safeUsername =
    profile.username ??
    username;

  const profilePath =
    `/profile/${encodeURIComponent(
      safeUsername
    )}`;

  const connectionsPath =
    `${profilePath}/connections`;

  return (
    <main className="pb-20">
      <div className="mx-auto w-full lg:max-w-[1160px]">
        <ProfileMediaHeader
          banner={
            profile.banner_url ? (
              <CroppedProfileImage
                src={
                  profile.banner_url
                }
                crop={
                  profile.banner_crop
                }
                alt={`Banner de ${displayName}`}
              />
            ) : null
          }
          avatar={
            profile.avatar_url ? (
              <CroppedProfileImage
                src={
                  profile.avatar_url
                }
                crop={
                  profile.avatar_crop
                }
                alt={
                  displayName
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-500">
                {displayName
                  .slice(
                    0,
                    1
                  )
                  .toUpperCase()}
              </div>
            )
          }
          action={
            isOwnProfile ? (
              <Link
                href="/profile/customize"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/95 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <Settings2
                  size={
                    15
                  }
                />

                Editar perfil
              </Link>
            ) : (
              <FollowButton
                currentUserId={
                  user.id
                }
                targetUserId={
                  profile.id
                }
                initialFollowing={
                  initialFollowing
                }
              />
            )
          }
        >
          <div className="text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                {
                  displayName
                }
              </h1>

              {profile.special_role ===
                "OWNER" && (
                <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-300">
                  Owner
                </span>
              )}
            </div>

            {profile.username && (
              <p className="mt-1 text-sm text-zinc-500">
                @{profile.username}
              </p>
            )}

            {profile.bio && (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                {
                  profile.bio
                }
              </p>
            )}

            <div className="mt-4 flex gap-5 text-sm">
              <Link
                href={`${connectionsPath}?tab=following`}
              >
                <strong>
                  {
                    followingCount
                  }
                </strong>{" "}
                Siguiendo
              </Link>

              <Link
                href={`${connectionsPath}?tab=followers`}
              >
                <strong>
                  {
                    followersCount
                  }
                </strong>{" "}
                Seguidores
              </Link>
            </div>
          </div>
        </ProfileMediaHeader>

        <nav className="mt-6 grid grid-cols-4 border-y border-zinc-800 lg:hidden">
          <MobileTabLink
            href={`${profilePath}?tab=profile`}
            active={
              activeTab ===
              "profile"
            }
          >
            Perfil
          </MobileTabLink>

          <MobileTabLink
            href={`${profilePath}?tab=activity`}
            active={
              activeTab ===
              "activity"
            }
          >
            Actividad
          </MobileTabLink>

          <MobileTabLink
            href={`${profilePath}?tab=reviews`}
            active={
              activeTab ===
              "reviews"
            }
          >
            Reviews
          </MobileTabLink>

          <MobileTabLink
            href={`${profilePath}?tab=pending`}
            active={
              activeTab ===
              "pending"
            }
          >
            Pendientes
          </MobileTabLink>
        </nav>

        <div className="px-4 pt-7 lg:hidden">
          {activeTab ===
            "profile" &&
            profile.username && (
              <ProfileSections
                profileUserId={
                  profile.id
                }
                username={
                  profile.username
                }
                sections={
                  sections
                }
                favorites={
                  favorites
                }
                includeActivity={
                  false
                }
              />
            )}

          {activeTab ===
            "activity" &&
            profile.username && (
              <ProfileActivity
                profileUserId={
                  profile.id
                }
                username={
                  profile.username
                }
                mode="preview"
              />
            )}

          {activeTab ===
            "reviews" && (
            <ReviewGrid
              reviews={
                reviews
              }
            />
          )}

          {activeTab ===
            "pending" && (
            <PendingGrid
              items={
                pendingItems
              }
            />
          )}
        </div>

        <div className="mt-9 hidden gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0">
            {profile.username && (
              <ProfileSections
                profileUserId={
                  profile.id
                }
                username={
                  profile.username
                }
                sections={
                  sections
                }
                favorites={
                  favorites
                }
              />
            )}
          </div>

          <aside className="space-y-8">
            <SidebarSection
              title="Estadísticas"
            >
              <StatRow
                icon={
                  <Library
                    size={14}
                  />
                }
                label="Registrados"
                value={
                  registeredMedia.size
                }
              />

              <StatRow
                icon={
                  <Clapperboard
                    size={14}
                  />
                }
                label="Películas"
                value={
                  mediaCounts.MOVIE
                }
              />

              <StatRow
                icon={
                  <Tv
                    size={14}
                  />
                }
                label="Series"
                value={
                  mediaCounts.SERIES
                }
              />

              <StatRow
                icon={
                  <Gamepad2
                    size={14}
                  />
                }
                label="Juegos"
                value={
                  mediaCounts.GAME
                }
              />

              <StatRow
                icon={
                  <BookOpen
                    size={14}
                  />
                }
                label="Libros"
                value={
                  mediaCounts.BOOK
                }
              />

              <StatRow
                icon={
                  <Heart
                    size={14}
                  />
                }
                label="Reviews"
                value={
                  reviews.length
                }
              />
            </SidebarSection>

            <SidebarSection
              title="Ahora mismo"
            >
              {currentItems.length >
              0 ? (
                <div className="space-y-3">
                  {currentItems.map(
                    (
                      item
                    ) => (
                      <Link
                        key={
                          item.id
                        }
                        href={getMediaHref(
                          item.media_type,
                          item.external_id
                        )}
                        className="flex gap-3"
                      >
                        {item.cover_url ? (
                          <div className="relative h-14 w-10 overflow-hidden">
                            <Image
                              src={
                                item.cover_url
                              }
                              alt={
                                item.title
                              }
                              fill
                              sizes="40px"
                              unoptimized={
                                shouldUseOriginalImage(
                                  item.cover_url
                                )
                              }
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-14 w-10 bg-zinc-900" />
                        )}

                        <div>
                          <p className="text-sm text-zinc-300">
                            {
                              item.title
                            }
                          </p>

                          <p className="text-xs text-zinc-600">
                            {getCurrentLabel(
                              item.media_type
                            )}
                          </p>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  No hay ningún medio en curso.
                </p>
              )}
            </SidebarSection>

            <SidebarSection
              title="Reviews recientes"
            >
              {recentReviews.length >
              0 ? (
                <div className="space-y-4">
                  {recentReviews.map(
                    (
                      review
                    ) => (
                      <ProfileReviewModal
                        key={
                          review.id
                        }
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
                          review.cover_url
                        }
                        posterPositionX={
                          review.poster_position_x
                        }
                        posterPositionY={
                          review.poster_position_y
                        }
                        posterZoom={
                          review.poster_zoom
                        }
                        createdAt={
                          review.created_at
                        }
                        variant="sidebar"
                      />
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  Todavía no hay reviews.
                </p>
              )}
            </SidebarSection>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ReviewGrid({
  reviews,
}: {
  reviews:
    (ReviewRow &
      ArtworkFields)[];
}) {
  if (
    reviews.length ===
    0
  ) {
    return (
      <p className="py-10 text-center text-sm text-zinc-600">
        Todavía no hay reviews.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {reviews.map(
        (
          review
        ) => (
          <ProfileReviewModal
            key={
              review.id
            }
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
              review.cover_url
            }
            posterPositionX={
              review.poster_position_x
            }
            posterPositionY={
              review.poster_position_y
            }
            posterZoom={
              review.poster_zoom
            }
            createdAt={
              review.created_at
            }
            variant="grid"
          />
        )
      )}
    </div>
  );
}

function MobileTabLink({
  href,
  active,
  children,
}: {
  href:
    string;

  active:
    boolean;

  children:
    ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      scroll={
        false
      }
      className={`relative flex min-h-[52px] items-center justify-center px-1 text-xs font-medium ${
        active
          ? "text-white"
          : "text-zinc-600"
      }`}
    >
      {
        children
      }

      {active && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-fuchsia-500" />
      )}
    </Link>
  );
}

function PendingGrid({
  items,
}: {
  items:
    LibraryItemRow[];
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <p className="py-10 text-center text-sm text-zinc-600">
        No hay nada pendiente.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {items.map(
        (
          item
        ) => (
          <Link
            key={
              item.id
            }
            href={getMediaHref(
              item.media_type,
              item.external_id
            )}
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-zinc-900">
              {item.cover_url && (
                <Image
                  src={
                    item.cover_url
                  }
                  alt={
                    item.title
                  }
                  fill
                  sizes="120px"
                  unoptimized={
                    shouldUseOriginalImage(
                      item.cover_url
                    )
                  }
                  className="object-cover"
                />
              )}
            </div>

            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
              {
                item.title
              }
            </p>
          </Link>
        )
      )}
    </div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <section>
      <div className="border-b border-zinc-800 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {
            title
          }
        </h2>
      </div>

      <div className="mt-4">
        {
          children
        }
      </div>
    </section>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon:
    ReactNode;

  label:
    string;

  value:
    number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        {
          icon
        }

        {
          label
        }
      </div>

      <span className="text-sm text-zinc-300">
        {
          value
        }
      </span>
    </div>
  );
}