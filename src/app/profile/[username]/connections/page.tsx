import Link from "next/link";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

import {
  notFound,
  redirect,
} from "next/navigation";

import FollowButton from "@/app/social/FollowButton";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  CroppedProfileImage,
  type ProfileCrop,
} from "../../ProfileMediaHeader";

interface ConnectionsPageProps {
  params: Promise<{
    username:
      string;
  }>;

  searchParams: Promise<{
    tab?:
      string;

    page?:
      string;
  }>;
}

type SpecialRole =
  | "OWNER"
  | "BETA_TESTER"
  | null;

type Profile = {
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

  avatar_crop:
    | ProfileCrop
    | null;

  special_role:
    SpecialRole;
};

type Connection = {
  follower_id:
    string;

  following_id:
    string;
};

type ConnectionTab =
  | "followers"
  | "following";

const PAGE_SIZE =
  20;

export default async function ConnectionsPage({
  params,
  searchParams,
}: ConnectionsPageProps) {
  const {
    username,
  } =
    await params;

  const query =
    await searchParams;

  const activeTab:
    ConnectionTab =
    query.tab ===
      "following"
      ? "following"
      : "followers";

  const requestedPage =
    Number(
      query.page ??
        "1"
    );

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

  /*
   * PROFILE
   */

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
        avatar_url,
        avatar_crop,
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
      "Error loading profile:",
      profileError
    );

    throw new Error(
      "No se pudo cargar el perfil."
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

  /*
   * FOLLOW COUNTS
   */

  const [
    followersResult,
    followingResult,
  ] =
    await Promise.all([
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
          profile.id
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
          profile.id
        ),
    ]);

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

  const followersCount =
    followersResult.count ??
    0;

  const followingCount =
    followingResult.count ??
    0;

  const activeCount =
    activeTab ===
    "followers"
      ? followersCount
      : followingCount;

  /*
   * PAGINATION
   */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        activeCount /
          PAGE_SIZE
      )
    );

  const page =
    Number.isSafeInteger(
      requestedPage
    ) &&
    requestedPage >
      0
      ? Math.min(
          requestedPage,
          totalPages
        )
      : 1;

  const start =
    (
      page -
      1
    ) *
    PAGE_SIZE;

  const end =
    start +
    PAGE_SIZE -
    1;

  /*
   * CONNECTIONS
   */

  const filterColumn =
    activeTab ===
    "followers"
      ? "following_id"
      : "follower_id";

  const {
    data:
      connectionsData,

    error:
      connectionsError,
  } =
    await supabase
      .from(
        "profile_follows"
      )
      .select(`
        follower_id,
        following_id
      `)
      .eq(
        filterColumn,
        profile.id
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .range(
        start,
        end
      );

  if (
    connectionsError
  ) {
    console.error(
      "Error loading connections:",
      connectionsError
    );

    throw new Error(
      "No se pudo cargar la lista de usuarios."
    );
  }

  const connections =
    (
      connectionsData ??
      []
    ) as Connection[];

  const profileIds =
    connections.map(
      (
        connection
      ) =>
        activeTab ===
        "followers"
          ? connection.follower_id
          : connection.following_id
    );

  /*
   * CONNECTED PROFILES
   */

  let connectedProfiles:
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
          avatar_url,
          avatar_crop,
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
        "Error loading connected profiles:",
        error
      );

      throw new Error(
        "No se pudieron cargar los usuarios."
      );
    }

    const profilesById =
      new Map<
        string,
        Profile
      >(
        (
          (
            data ??
            []
          ) as Profile[]
        ).map(
          (
            connectedProfile
          ) => [
            connectedProfile.id,
            connectedProfile,
          ]
        )
      );

    /*
     * Supabase .in() no garantiza
     * conservar el orden de profileIds,
     * así que lo restauramos.
     */

    connectedProfiles =
      profileIds
        .map(
          (
            id
          ) =>
            profilesById.get(
              id
            )
        )
        .filter(
          (
            connectedProfile
          ):
            connectedProfile is Profile =>
              connectedProfile !==
              undefined
        );
  }

  /*
   * WHO CURRENT USER FOLLOWS
   */

  const followingIds =
    new Set<
      string
    >();

  const otherProfileIds =
    connectedProfiles
      .filter(
        (
          connectedProfile
        ) =>
          connectedProfile.id !==
          user.id
      )
      .map(
        (
          connectedProfile
        ) =>
          connectedProfile.id
      );

  if (
    otherProfileIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "profile_follows"
        )
        .select(
          "following_id"
        )
        .eq(
          "follower_id",
          user.id
        )
        .in(
          "following_id",
          otherProfileIds
        );

    if (
      error
    ) {
      console.error(
        "Error loading current follow status:",
        error
      );
    } else {
      for (
        const connection
        of data ??
        []
      ) {
        followingIds.add(
          connection.following_id
        );
      }
    }
  }

  /*
   * PATHS
   */

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
      <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 lg:py-8">
        {/* HEADER */}

        <header>
          <Link
            href={
              profilePath
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-100"
            aria-label="Volver al perfil"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="mt-5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {
                displayName
              }
            </h1>

            {profile.username && (
              <p className="mt-1 text-sm text-zinc-600">
                @
                {
                  profile.username
                }
              </p>
            )}
          </div>
        </header>

        {/* TABS */}

        <nav className="mt-7 grid grid-cols-2 border-b border-zinc-800">
          <ConnectionTabLink
            href={`${connectionsPath}?tab=followers`}
            active={
              activeTab ===
              "followers"
            }
          >
            Seguidores

            <span className="ml-1.5 text-zinc-600">
              {
                followersCount
              }
            </span>
          </ConnectionTabLink>

          <ConnectionTabLink
            href={`${connectionsPath}?tab=following`}
            active={
              activeTab ===
              "following"
            }
          >
            Siguiendo

            <span className="ml-1.5 text-zinc-600">
              {
                followingCount
              }
            </span>
          </ConnectionTabLink>
        </nav>

        {/* USERS */}

        {connectedProfiles.length ===
        0 ? (
          <div className="py-16 text-center">
            <Users
              size={30}
              className="mx-auto text-zinc-700"
            />

            <p className="mt-4 text-sm text-zinc-600">
              {activeTab ===
              "followers"
                ? "Todavía no tiene seguidores."
                : "Todavía no sigue a nadie."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {connectedProfiles.map(
              (
                connectedProfile
              ) => {
                const connectedName =
                  connectedProfile.display_name ??
                  connectedProfile.username ??
                  "Usuario";

                const isCurrentUser =
                  connectedProfile.id ===
                  user.id;

                const connectedPath =
                  connectedProfile.username
                    ? `/profile/${encodeURIComponent(
                        connectedProfile.username
                      )}`
                    : "/profile";

                return (
                  <article
                    key={
                      connectedProfile.id
                    }
                    className="flex min-w-0 items-center gap-3 py-4 sm:gap-4"
                  >
                    {/* AVATAR */}

                    <Link
                      href={
                        connectedPath
                      }
                      className="shrink-0"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-900 sm:h-14 sm:w-14">
                        {connectedProfile.avatar_url ? (
                          <CroppedProfileImage
                            src={
                              connectedProfile.avatar_url
                            }
                            crop={
                              connectedProfile.avatar_crop
                            }
                            alt={
                              connectedName
                            }
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-500">
                            {connectedName
                              .slice(
                                0,
                                1
                              )
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                          href={
                            connectedPath
                          }
                          className="min-w-0 truncate font-semibold text-zinc-200 transition hover:text-white"
                        >
                          {
                            connectedName
                          }
                        </Link>

                        {connectedProfile.special_role ===
                          "OWNER" && (
                          <span className="shrink-0 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-300">
                            Owner
                          </span>
                        )}

                        {connectedProfile.special_role ===
                          "BETA_TESTER" && (
                          <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500">
                            Beta Tester
                          </span>
                        )}
                      </div>

                      {connectedProfile.username && (
                        <Link
                          href={
                            connectedPath
                          }
                          className="mt-0.5 block truncate text-sm text-zinc-600 transition hover:text-zinc-400"
                        >
                          @
                          {
                            connectedProfile.username
                          }
                        </Link>
                      )}
                    </div>

                    {/* ACTION */}

                    <div className="shrink-0">
                      {isCurrentUser ? (
                        <span className="text-xs text-zinc-700">
                          Tú
                        </span>
                      ) : (
                        <FollowButton
                          currentUserId={
                            user.id
                          }
                          targetUserId={
                            connectedProfile.id
                          }
                          initialFollowing={
                            followingIds.has(
                              connectedProfile.id
                            )
                          }
                          compact
                        />
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

        {/* PAGINATION */}

        {totalPages >
          1 && (
          <div className="mt-8 flex items-center justify-between border-t border-zinc-900 pt-5">
            {page >
            1 ? (
              <Link
                href={`${connectionsPath}?tab=${activeTab}&page=${page - 1}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-3.5 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                <ChevronLeft
                  size={16}
                />

                Anterior
              </Link>
            ) : (
              <div />
            )}

            <span className="text-xs tabular-nums text-zinc-600">
              {
                page
              }
              {" / "}
              {
                totalPages
              }
            </span>

            {page <
            totalPages ? (
              <Link
                href={`${connectionsPath}?tab=${activeTab}&page=${page + 1}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-3.5 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                Siguiente

                <ChevronRight
                  size={16}
                />
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ConnectionTabLink({
  href,
  active,
  children,
}: {
  href:
    string;

  active:
    boolean;

  children:
    React.ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      scroll={
        false
      }
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={`relative flex min-h-[50px] items-center justify-center text-sm font-medium transition ${
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