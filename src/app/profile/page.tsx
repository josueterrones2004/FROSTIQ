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
  redirect,
} from "next/navigation";

import {
  type ReactNode,
} from "react";

import ProfileActivity from "./ProfileActivity";

import ProfileMediaHeader, {
  CroppedProfileImage,
  type ProfileCrop,
} from "./ProfileMediaHeader";

import ProfileSections from "./ProfileSections";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  createClient,
} from "@/lib/supabase/server";

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

interface ProfilePageProps {
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

function getMediaLabel(
  mediaType:
    MediaType
) {
  switch (
    mediaType
  ) {
    case "MOVIE":
      return "Película";

    case "SERIES":
      return "Serie";

    case "BOOK":
      return "Libro";

    case "GAME":
      return "Juego";
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

function formatShortDate(
  value:
    string
) {
  try {
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
      new Date(
        value
      )
    );
  } catch {
    return "";
  }
}

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
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

  if (!user) {
    redirect(
      "/auth"
    );
  }

  const [
    profileResult,
    sectionsResult,
    favoritesResult,
    followersResult,
    followingResult,
    libraryResult,
    reviewsResult,
  ] =
    await Promise.all([
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
          banner_url,
          avatar_crop,
          banner_crop,
          special_role
        `)
        .eq(
          "id",
          user.id
        )
        .maybeSingle(),

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
          user.id
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
          user.id
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
          "profile_follows"
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
          user.id
        ),

      supabase
        .from(
          "profile_follows"
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
          user.id
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
          user.id
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
          user.id
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
    profileResult.error
  ) {
    console.error(
      "Error loading profile:",
      profileResult.error
    );
  }

  if (
    sectionsResult.error
  ) {
    console.error(
      "Error loading profile sections:",
      sectionsResult.error
    );
  }

  if (
    favoritesResult.error
  ) {
    console.error(
      "Error loading profile favorites:",
      favoritesResult.error
    );
  }

  if (
    followersResult.error
  ) {
    console.error(
      "Error loading followers:",
      followersResult.error
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

  if (
    libraryResult.error
  ) {
    console.error(
      "Error loading profile library:",
      libraryResult.error
    );
  }

  if (
    reviewsResult.error
  ) {
    console.error(
      "Error loading profile reviews:",
      reviewsResult.error
    );
  }

  const profile =
    profileResult.data as
      | Profile
      | null;

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

  const followersCount =
    followersResult.count ??
    0;

  const followingCount =
    followingResult.count ??
    0;

  const displayName =
    profile?.display_name ??
    profile?.username ??
    "Usuario";

  const username =
    profile?.username;

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
    MOVIE: 0,
    SERIES: 0,
    BOOK: 0,
    GAME: 0,
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

  return (
    <main className="pb-20">
      <div className="mx-auto w-full lg:max-w-[1160px]">
        <ProfileMediaHeader
          banner={
            profile?.banner_url ? (
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
            profile?.avatar_url ? (
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
            <Link
              href="/profile/customize"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/95 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <Settings2
                size={
                  15
                }
              />

              <span className="hidden sm:inline">
                Editar perfil
              </span>

              <span className="sm:hidden">
                Editar
              </span>
            </Link>
          }
        >
          <div className="text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100 lg:text-[28px]">
                {
                  displayName
                }
              </h1>

              {profile?.special_role ===
                "OWNER" && (
                <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-300 lg:text-[11px]">
                  Owner
                </span>
              )}

              {profile?.special_role ===
                "BETA_TESTER" && (
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400 lg:text-[11px]">
                  Beta Tester
                </span>
              )}
            </div>

            {username && (
              <p className="mt-0.5 text-sm text-zinc-500">
                @{username}
              </p>
            )}

            {profile?.bio?.trim() ? (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                {
                  profile.bio
                }
              </p>
            ) : null}

            {username && (
              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                <Link
                  href={`/profile/${username}/connections?tab=following`}
                  className="group"
                >
                  <span className="font-semibold text-zinc-200 transition group-hover:text-white">
                    {
                      followingCount
                    }
                  </span>

                  <span className="ml-1.5 text-zinc-500 transition group-hover:text-zinc-300">
                    Siguiendo
                  </span>
                </Link>

                <Link
                  href={`/profile/${username}/connections?tab=followers`}
                  className="group"
                >
                  <span className="font-semibold text-zinc-200 transition group-hover:text-white">
                    {
                      followersCount
                    }
                  </span>

                  <span className="ml-1.5 text-zinc-500 transition group-hover:text-zinc-300">
                    Seguidores
                  </span>
                </Link>
              </div>
            )}
          </div>
        </ProfileMediaHeader>

        <nav className="mt-6 grid w-full grid-cols-3 border-y border-zinc-800 lg:hidden">
          <MobileTabLink
            href="/profile?tab=profile"
            active={
              activeTab ===
              "profile"
            }
          >
            Perfil
          </MobileTabLink>

          <MobileTabLink
            href="/profile?tab=activity"
            active={
              activeTab ===
              "activity"
            }
          >
            Actividad reciente
          </MobileTabLink>

          <MobileTabLink
            href="/profile?tab=pending"
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
            username && (
              <ProfileSections
                profileUserId={
                  user.id
                }
                username={
                  username
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
            username && (
              <section>
                <MobileSectionTitle>
                  Actividad reciente
                </MobileSectionTitle>

                <ProfileActivity
                  profileUserId={
                    user.id
                  }
                  username={
                    username
                  }
                  mode="preview"
                />
              </section>
            )}

          {activeTab ===
            "pending" && (
            <section>
              <MobileSectionTitle>
                Pendientes
              </MobileSectionTitle>

              <PendingGrid
                items={
                  pendingItems
                }
              />
            </section>
          )}
        </div>

        <div className="mt-9 hidden items-start gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_270px] xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0">
            {username && (
              <ProfileSections
                profileUserId={
                  user.id
                }
                username={
                  username
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

          <aside className="space-y-8 lg:sticky lg:top-24">
            <SidebarSection
              title="Estadísticas"
            >
              <div className="divide-y divide-zinc-900">
                <StatRow
                  icon={
                    <Library
                      size={
                        14
                      }
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
                      size={
                        14
                      }
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
                      size={
                        14
                      }
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
                      size={
                        14
                      }
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
                      size={
                        14
                      }
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
                      size={
                        14
                      }
                    />
                  }
                  label="Reviews"
                  value={
                    reviews.length
                  }
                />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-zinc-900 pt-3 text-xs">
                <span className="text-zinc-600">
                  Pendientes
                </span>

                <span className="font-medium text-zinc-400">
                  {
                    pendingItems.length
                  }
                </span>
              </div>
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
                        className="group flex items-center gap-3"
                      >
                        {item.cover_url ? (
                          <div className="relative h-14 w-10 shrink-0 overflow-hidden bg-zinc-900">
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
                              style={{
                                objectPosition:
                                  `${item.poster_position_x ?? 50}% ${item.poster_position_y ?? 50}%`,

                                transform:
                                  `scale(${item.poster_zoom ?? 1})`,
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-14 w-10 shrink-0 bg-zinc-900" />
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-300 transition group-hover:text-white">
                            {
                              item.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
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
                <p className="text-sm leading-6 text-zinc-600">
                  No tienes ningún medio en curso.
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
                      <Link
                        key={
                          review.id
                        }
                        href={getMediaHref(
                          review.media_type,
                          review.external_id
                        )}
                        className="group flex gap-3"
                      >
                        {review.cover_url ? (
                          <div className="relative h-14 w-10 shrink-0 overflow-hidden bg-zinc-900">
                            <Image
                              src={
                                review.cover_url
                              }
                              alt={
                                review.title
                              }
                              fill
                              sizes="40px"
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
                          </div>
                        ) : (
                          <div className="h-14 w-10 shrink-0 bg-zinc-900" />
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-300 transition group-hover:text-white">
                            {
                              review.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {getMediaLabel(
                              review.media_type
                            )}
                          </p>

                          <p className="mt-0.5 text-[11px] text-zinc-700">
                            {formatShortDate(
                              review.created_at
                            )}
                          </p>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  Todavía no has publicado reviews.
                </p>
              )}
            </SidebarSection>

            <SidebarSection
              title="Social"
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-zinc-500">
                  <span>
                    Seguidores
                  </span>

                  <span className="font-medium text-zinc-300">
                    {
                      followersCount
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-500">
                  <span>
                    Siguiendo
                  </span>

                  <span className="font-medium text-zinc-300">
                    {
                      followingCount
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-zinc-500">
                  <span>
                    Favoritos
                  </span>

                  <span className="font-medium text-zinc-300">
                    {
                      favorites.length
                    }
                  </span>
                </div>
              </div>
            </SidebarSection>
          </aside>
        </div>
      </div>
    </main>
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
      className={`relative flex min-h-[52px] items-center justify-center px-2 text-center text-[13px] font-medium leading-4 transition ${
        active
          ? "text-zinc-100"
          : "text-zinc-600 hover:text-zinc-300"
      }`}
    >
      {
        children
      }

      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-fuchsia-500" />
      )}
    </Link>
  );
}

function MobileSectionTitle({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="mb-4 border-b border-zinc-800 pb-2.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {
          children
        }
      </h2>
    </div>
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
        No tienes nada pendiente.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
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
            className="group min-w-0"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-zinc-900">
              {item.cover_url ? (
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
                  style={{
                    objectPosition:
                      `${item.poster_position_x ?? 50}% ${item.poster_position_y ?? 50}%`,

                    transform:
                      `scale(${item.poster_zoom ?? 1})`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-zinc-600">
                  Sin portada
                </div>
              )}
            </div>

            <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-zinc-500">
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
      <div className="border-b border-zinc-800 pb-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
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
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="text-zinc-600">
          {
            icon
          }
        </span>

        <span>
          {
            label
          }
        </span>
      </div>

      <span className="text-sm font-medium tabular-nums text-zinc-300">
        {
          value
        }
      </span>
    </div>
  );
}