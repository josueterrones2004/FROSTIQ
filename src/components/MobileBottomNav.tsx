"use client";

import {
  BookOpen,
  ChevronRight,
  Clock,
  Film,
  Gamepad2,
  House,
  Library,
  Loader2,
  LogIn,
  Search,
  Tv,
  UserRound,
  Users,
  X,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

type MobileBottomNavProfile = {
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

interface MobileBottomNavProps {
  profile:
    | MobileBottomNavProfile
    | null;

  authenticated:
    boolean;
}

type MediaKind =
  | "movie"
  | "series"
  | "game"
  | "book";

type DiscoverResult = {
  key:
    string;

  kind:
    MediaKind;

  title:
    string;

  image:
    | string
    | null;

  imagePositionX:
    number;

  imagePositionY:
    number;

  imageZoom:
    number;

  year:
    | number
    | null;

  href:
    string;
};

type SearchResult = {
  key:
    string;

  title:
    string;

  kind:
    MediaKind;

  image:
    | string
    | null;

  year:
    | number
    | null;

  subtitle:
    string;

  href:
    string;

  score:
    number;
};

type SearchSource =
  | "games"
  | "screen"
  | "books";

type LibraryItem = {
  href:
    string;

  label:
    string;

  description:
    string;

  icon:
    ReactNode;

  prefixes?:
    string[];
};

const searchSources:
  SearchSource[] = [
    "games",
    "screen",
    "books",
  ];

const libraryItems:
  LibraryItem[] = [
    {
      href:
        "/movies",

      label:
        "Películas",

      description:
        "Explora tus películas",

      icon:
        <Film
          size={
            21
          }
        />,

      prefixes: [
        "/movies",
      ],
    },

    {
      href:
        "/series",

      label:
        "Series",

      description:
        "Series, temporadas y episodios",

      icon:
        <Tv
          size={
            21
          }
        />,

      prefixes: [
        "/series",
      ],
    },

    {
      href:
        "/games",

      label:
        "Juegos",

      description:
        "Tu colección de videojuegos",

      icon:
        <Gamepad2
          size={
            21
          }
        />,

      prefixes: [
        "/games",
      ],
    },

    {
      href:
        "/books",

      label:
        "Libros",

      description:
        "Libros y lecturas",

      icon:
        <BookOpen
          size={
            21
          }
        />,

      prefixes: [
        "/books",
      ],
    },

    {
      href:
        "/profile?tab=pending",

      label:
        "Pendientes",

      description:
        "Todo lo que tienes por empezar",

      icon:
        <Clock
          size={
            21
          }
        />,
    },
  ];

function routeMatches(
  pathname:
    string,

  href:
    string
) {
  if (
    href ===
    "/"
  ) {
    return (
      pathname ===
      "/"
    );
  }

  return (
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

function getProfileLabel(
  profile:
    | MobileBottomNavProfile
    | null
) {
  return (
    profile?.display_name ??
    profile?.username ??
    "Perfil"
  );
}

function getKindLabel(
  kind:
    MediaKind
) {
  if (
    kind ===
    "movie"
  ) {
    return "Película";
  }

  if (
    kind ===
    "series"
  ) {
    return "Serie";
  }

  if (
    kind ===
    "game"
  ) {
    return "Juego";
  }

  return "Libro";
}

function mergeSearchResults(
  groups:
    SearchResult[][]
) {
  const seen =
    new Set<
      string
    >();

  return groups
    .flat()
    .sort(
      (
        first,
        second
      ) =>
        second.score -
        first.score
    )
    .filter(
      (
        item
      ) => {
        if (
          seen.has(
            item.key
          )
        ) {
          return false;
        }

        seen.add(
          item.key
        );

        return true;
      }
    )
    .slice(
      0,
      24
    );
}

export default function MobileBottomNav({
  profile,
  authenticated,
}: MobileBottomNavProps) {
  const pathname =
    usePathname();

  const [
    searchOpen,
    setSearchOpen,
  ] =
    useState(
      false
    );

  const [
    libraryOpen,
    setLibraryOpen,
  ] =
    useState(
      false
    );

  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );

  const [
    discoverItems,
    setDiscoverItems,
  ] =
    useState<
      DiscoverResult[]
    >(
      []
    );

  const [
    discoverLoading,
    setDiscoverLoading,
  ] =
    useState(
      false
    );

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<
      SearchResult[]
    >(
      []
    );

  const [
    searching,
    setSearching,
  ] =
    useState(
      false
    );

  const searchInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const requestIdRef =
    useRef(
      0
    );

  const sheetOpen =
    searchOpen ||
    libraryOpen;

  const underlyingVisible =
    !searchOpen &&
    !libraryOpen;

  const homeActive =
    underlyingVisible &&
    pathname ===
      "/";

  const searchActive =
    searchOpen;

  const libraryRouteActive =
    [
      "/movies",
      "/series",
      "/games",
      "/books",
    ].some(
      (
        route
      ) =>
        routeMatches(
          pathname,
          route
        )
    );

  const libraryActive =
    authenticated &&
    (
      libraryOpen ||
      (
        underlyingVisible &&
        libraryRouteActive
      )
    );

  const socialActive =
    authenticated &&
    underlyingVisible &&
    routeMatches(
      pathname,
      "/social"
    );

  const profileActive =
    authenticated &&
    underlyingVisible &&
    routeMatches(
      pathname,
      "/profile"
    );

  const cleanQuery =
    query.trim();

  const showingSearchResults =
    cleanQuery.length >=
    2;

  /*
   * BLOQUEAR SCROLL DEL FONDO
   */

  useEffect(
    () => {
      if (
        !sheetOpen
      ) {
        return;
      }

      const previous =
        document.body.style
          .overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          previous;
      };
    },
    [
      sheetOpen,
    ]
  );

  /*
   * CERRAR CON ESC
   */

  useEffect(
    () => {
      if (
        !sheetOpen
      ) {
        return;
      }

      function handleKeyDown(
        event:
          KeyboardEvent
      ) {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }

        setSearchOpen(
          false
        );

        setLibraryOpen(
          false
        );
      }

      document.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () =>
        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
    },
    [
      sheetOpen,
    ]
  );

  /*
   * BÚSQUEDA EN VIVO
   *
   * Importante:
   * no hacemos setState directamente al
   * principio del effect para evitar
   * react-hooks/set-state-in-effect.
   */

  useEffect(
    () => {
      const current =
        cleanQuery;

      requestIdRef.current +=
        1;

      const requestId =
        requestIdRef.current;

      if (
        current.length <
        2
      ) {
        return;
      }

      const controllers =
        searchSources.map(
          () =>
            new AbortController()
        );

      const timeout =
        window.setTimeout(
          () => {
            setSearching(
              true
            );

            const requests =
              searchSources.map(
                async (
                  source,
                  index
                ) => {
                  const response =
                    await fetch(
                      `/api/search-suggestions?q=${encodeURIComponent(
                        current
                      )}&source=${source}`,
                      {
                        signal:
                          controllers[
                            index
                          ].signal,

                        cache:
                          "no-store",
                      }
                    );

                  if (
                    !response.ok
                  ) {
                    return [];
                  }

                  const data =
                    await response.json();

                  return Array.isArray(
                    data.results
                  )
                    ? data.results as SearchResult[]
                    : [];
                }
              );

            void Promise.all(
              requests
            )
              .then(
                (
                  groups
                ) => {
                  if (
                    requestId !==
                    requestIdRef.current
                  ) {
                    return;
                  }

                  setSearchResults(
                    mergeSearchResults(
                      groups
                    )
                  );
                }
              )
              .catch(
                (
                  error
                ) => {
                  if (
                    error instanceof
                      DOMException &&
                    error.name ===
                      "AbortError"
                  ) {
                    return;
                  }

                  console.error(
                    "Error searching mobile results:",
                    error
                  );
                }
              )
              .finally(
                () => {
                  if (
                    requestId ===
                    requestIdRef.current
                  ) {
                    setSearching(
                      false
                    );
                  }
                }
              );
          },
          120
        );

      return () => {
        window.clearTimeout(
          timeout
        );

        for (
          const controller of
          controllers
        ) {
          controller.abort();
        }
      };
    },
    [
      cleanQuery,
    ]
  );

  async function loadDiscover() {
    if (
      discoverItems.length >
        0 ||
      discoverLoading
    ) {
      return;
    }

    setDiscoverLoading(
      true
    );

    try {
      const response =
        await fetch(
          "/api/mobile-discover",
          {
            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        return;
      }

      const data =
        await response.json();

      if (
        Array.isArray(
          data.results
        )
      ) {
        setDiscoverItems(
          data.results as DiscoverResult[]
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Error loading mobile discover:",
        error
      );
    } finally {
      setDiscoverLoading(
        false
      );
    }
  }

  function closePanels() {
    requestIdRef.current +=
      1;

    setSearching(
      false
    );

    setSearchOpen(
      false
    );

    setLibraryOpen(
      false
    );
  }

  function openSearch() {
    requestIdRef.current +=
      1;

    setLibraryOpen(
      false
    );

    setQuery(
      ""
    );

    setSearchResults(
      []
    );

    setSearching(
      false
    );

    setSearchOpen(
      true
    );

    void loadDiscover();

    window.requestAnimationFrame(
      () => {
        searchInputRef.current
          ?.focus();
      }
    );
  }

  function openLibrary() {
    if (
      !authenticated
    ) {
      return;
    }

    requestIdRef.current +=
      1;

    setSearching(
      false
    );

    setSearchOpen(
      false
    );

    setLibraryOpen(
      true
    );
  }

  function handleSearchChange(
    value:
      string
  ) {
    setQuery(
      value
    );

    if (
      value
        .trim()
        .length <
      2
    ) {
      requestIdRef.current +=
        1;

      setSearchResults(
        []
      );

      setSearching(
        false
      );
    }
  }

  function clearSearch() {
    requestIdRef.current +=
      1;

    setQuery(
      ""
    );

    setSearchResults(
      []
    );

    setSearching(
      false
    );

    searchInputRef.current
      ?.focus();
  }

  return (
    <>
      {/* FULL SCREEN SEARCH */}

      {searchOpen && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Buscar"
          className="fixed inset-x-0 top-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-[160] flex flex-col bg-zinc-950 lg:hidden"
        >
          <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 px-4 pb-4 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={
                    19
                  }
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  ref={
                    searchInputRef
                  }
                  type="search"
                  value={
                    query
                  }
                  onChange={(
                    event
                  ) =>
                    handleSearchChange(
                      event.target.value
                    )
                  }
                  placeholder="Buscar películas, series, juegos o libros"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-11 pr-10 text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500/60 focus:bg-zinc-900"
                />

                {query && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
                    aria-label="Limpiar búsqueda"
                  >
                    <X
                      size={
                        17
                      }
                    />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={
                  closePanels
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
                aria-label="Cerrar búsqueda"
              >
                <X
                  size={
                    21
                  }
                />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {!showingSearchResults &&
              discoverLoading &&
              discoverItems.length ===
                0 && (
                <LoadingList />
              )}

            {!showingSearchResults &&
              !discoverLoading &&
              discoverItems.length ===
                0 && (
                <EmptyState>
                  No se pudieron cargar resultados.
                </EmptyState>
              )}

            {!showingSearchResults &&
              discoverItems.length >
                0 && (
                <div>
                  {discoverItems.map(
                    (
                      item
                    ) => (
                      <MediaResultRow
                        key={
                          item.key
                        }
                        href={
                          item.href
                        }
                        title={
                          item.title
                        }
                        kind={
                          item.kind
                        }
                        image={
                          item.image
                        }
                        year={
                          item.year
                        }
                        imagePositionX={
                          item.imagePositionX
                        }
                        imagePositionY={
                          item.imagePositionY
                        }
                        imageZoom={
                          item.imageZoom
                        }
                        onNavigate={
                          closePanels
                        }
                      />
                    )
                  )}
                </div>
              )}

            {showingSearchResults &&
              searching &&
              searchResults.length ===
                0 && (
                <LoadingList />
              )}

            {showingSearchResults &&
              !searching &&
              searchResults.length ===
                0 && (
                <EmptyState>
                  No encontramos resultados para &quot;{cleanQuery}&quot;.
                </EmptyState>
              )}

            {showingSearchResults &&
              searchResults.length >
                0 && (
                <div>
                  {searchResults.map(
                    (
                      item
                    ) => (
                      <MediaResultRow
                        key={
                          item.key
                        }
                        href={
                          item.href
                        }
                        title={
                          item.title
                        }
                        kind={
                          item.kind
                        }
                        image={
                          item.image
                        }
                        year={
                          item.year
                        }
                        imagePositionX={
                          50
                        }
                        imagePositionY={
                          50
                        }
                        imageZoom={
                          1
                        }
                        onNavigate={
                          closePanels
                        }
                      />
                    )
                  )}

                  {searching && (
                    <div className="flex items-center justify-center gap-2 py-5 text-xs text-zinc-600">
                      <Loader2
                        size={
                          14
                        }
                        className="animate-spin"
                      />

                      Actualizando resultados
                    </div>
                  )}
                </div>
              )}
          </div>
        </section>
      )}

      {/* LIBRARY BACKDROP */}

      {libraryOpen && (
        <button
          type="button"
          aria-label="Cerrar biblioteca"
          onClick={
            closePanels
          }
          className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* LIBRARY */}

      {libraryOpen && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Biblioteca"
          className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-[160] overflow-hidden rounded-t-[26px] border-t border-zinc-800 bg-zinc-950 shadow-[0_-24px_70px_rgba(0,0,0,0.55)] lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-300">
                <Library
                  size={
                    19
                  }
                />
              </div>

              <h2 className="text-lg font-semibold text-zinc-100">
                Biblioteca
              </h2>
            </div>

            <button
              type="button"
              onClick={
                closePanels
              }
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              aria-label="Cerrar biblioteca"
            >
              <X
                size={
                  19
                }
              />
            </button>
          </div>

          <nav>
            {libraryItems.map(
              (
                item
              ) => {
                const active =
                  item.prefixes
                    ?.some(
                      (
                        prefix
                      ) =>
                        routeMatches(
                          pathname,
                          prefix
                        )
                    ) ??
                  false;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    onClick={
                      closePanels
                    }
                    className={`group flex min-h-[68px] items-center gap-3 border-b border-zinc-900 px-4 transition last:border-b-0 ${
                      active
                        ? "bg-fuchsia-500/10"
                        : "active:bg-zinc-900"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        active
                          ? "bg-fuchsia-500/15 text-fuchsia-300"
                          : "text-zinc-500 group-active:text-zinc-300"
                      }`}
                    >
                      {
                        item.icon
                      }
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[15px] font-medium ${
                          active
                            ? "text-fuchsia-200"
                            : "text-zinc-200"
                        }`}
                      >
                        {
                          item.label
                        }
                      </p>

                      <p className="mt-0.5 truncate text-xs text-zinc-600">
                        {
                          item.description
                        }
                      </p>
                    </div>

                    <ChevronRight
                      size={
                        18
                      }
                      className="shrink-0 text-zinc-700"
                    />
                  </Link>
                );
              }
            )}
          </nav>
        </section>
      )}

      {/* BOTTOM NAV */}

      <nav className="fixed inset-x-0 bottom-0 z-[170] border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:hidden">
        {authenticated ? (
          <div className="grid h-[68px] grid-cols-5">
            <Link
              href="/"
              onClick={
                closePanels
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <ActiveLine
                active={
                  homeActive
                }
              />

              <House
                size={
                  21
                }
                strokeWidth={
                  homeActive
                    ? 2.3
                    : 1.9
                }
                className={
                  homeActive
                    ? "text-zinc-100"
                    : "text-zinc-500"
                }
              />

              <NavLabel
                active={
                  homeActive
                }
              >
                Inicio
              </NavLabel>
            </Link>

            <button
              type="button"
              onClick={
                openSearch
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <ActiveLine
                active={
                  searchActive
                }
              />

              <Search
                size={
                  21
                }
                strokeWidth={
                  searchActive
                    ? 2.3
                    : 1.9
                }
                className={
                  searchActive
                    ? "text-zinc-100"
                    : "text-zinc-500"
                }
              />

              <NavLabel
                active={
                  searchActive
                }
              >
                Buscar
              </NavLabel>
            </button>

            <button
              type="button"
              onClick={
                openLibrary
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <ActiveLine
                active={
                  libraryActive
                }
              />

              <Library
                size={
                  21
                }
                strokeWidth={
                  libraryActive
                    ? 2.3
                    : 1.9
                }
                className={
                  libraryActive
                    ? "text-zinc-100"
                    : "text-zinc-500"
                }
              />

              <NavLabel
                active={
                  libraryActive
                }
              >
                Biblioteca
              </NavLabel>
            </button>

            <Link
              href="/social"
              onClick={
                closePanels
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <ActiveLine
                active={
                  socialActive
                }
              />

              <Users
                size={
                  21
                }
                strokeWidth={
                  socialActive
                    ? 2.3
                    : 1.9
                }
                className={
                  socialActive
                    ? "text-zinc-100"
                    : "text-zinc-500"
                }
              />

              <NavLabel
                active={
                  socialActive
                }
              >
                Social
              </NavLabel>
            </Link>

            <Link
              href="/profile"
              onClick={
                closePanels
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <ActiveLine
                active={
                  profileActive
                }
              />

              {profile?.avatar_url ? (
                <div
                  className={`h-[23px] w-[23px] overflow-hidden rounded-full border ${
                    profileActive
                      ? "border-fuchsia-400 ring-1 ring-fuchsia-400/30"
                      : "border-zinc-700"
                  }`}
                >
                  <Image
                    src={
                      profile.avatar_url
                    }
                    alt={getProfileLabel(
                      profile
                    )}
                    width={
                      46
                    }
                    height={
                      46
                    }
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <UserRound
                  size={
                    22
                  }
                  strokeWidth={
                    profileActive
                      ? 2.3
                      : 1.9
                  }
                  className={
                    profileActive
                      ? "text-zinc-100"
                      : "text-zinc-500"
                  }
                />
              )}

              <NavLabel
                active={
                  profileActive
                }
              >
                Perfil
              </NavLabel>
            </Link>
          </div>
        ) : (
          <div className="grid h-[68px] grid-cols-3">
            <Link
              href="/"
              onClick={
                closePanels
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <ActiveLine
                active={
                  homeActive
                }
              />

              <House
                size={
                  21
                }
                strokeWidth={
                  homeActive
                    ? 2.3
                    : 1.9
                }
                className={
                  homeActive
                    ? "text-zinc-100"
                    : "text-zinc-500"
                }
              />

              <NavLabel
                active={
                  homeActive
                }
              >
                Inicio
              </NavLabel>
            </Link>

            <button
              type="button"
              onClick={
                openSearch
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <ActiveLine
                active={
                  searchActive
                }
              />

              <Search
                size={
                  21
                }
                strokeWidth={
                  searchActive
                    ? 2.3
                    : 1.9
                }
                className={
                  searchActive
                    ? "text-zinc-100"
                    : "text-zinc-500"
                }
              />

              <NavLabel
                active={
                  searchActive
                }
              >
                Buscar
              </NavLabel>
            </button>

            <Link
              href="/auth?mode=login"
              onClick={
                closePanels
              }
              className="relative flex min-w-0 flex-col items-center justify-center gap-1"
            >
              <LogIn
                size={
                  21
                }
                strokeWidth={
                  1.9
                }
                className="text-zinc-500"
              />

              <NavLabel
                active={
                  false
                }
              >
                Entrar
              </NavLabel>
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}

function MediaResultRow({
  href,
  title,
  kind,
  image,
  year,
  imagePositionX,
  imagePositionY,
  imageZoom,
  onNavigate,
}: {
  href:
    string;

  title:
    string;

  kind:
    MediaKind;

  image:
    | string
    | null;

  year:
    | number
    | null;

  imagePositionX:
    number;

  imagePositionY:
    number;

  imageZoom:
    number;

  onNavigate:
    () => void;
}) {
  return (
    <Link
      href={
        href
      }
      onClick={
        onNavigate
      }
      className="group flex min-h-[84px] items-center gap-4 border-b border-zinc-900 px-4 py-3 transition active:bg-zinc-900/80"
    >
      <div className="relative h-[60px] w-10 shrink-0 overflow-hidden rounded-md bg-zinc-900">
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
                `${imagePositionX}% ${imagePositionY}%`,

              transform:
                `scale(${imageZoom})`,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-700">
            <Library
              size={
                15
              }
            />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-zinc-200">
          {
            title
          }
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
          <span>
            {getKindLabel(
              kind
            )}
          </span>

          {year && (
            <>
              <span>
                ·
              </span>

              <span>
                {
                  year
                }
              </span>
            </>
          )}
        </div>
      </div>

      <ChevronRight
        size={
          18
        }
        className="shrink-0 text-zinc-700"
      />
    </Link>
  );
}

function LoadingList() {
  return (
    <div>
      {Array.from({
        length:
          8,
      }).map(
        (
          _,
          index
        ) => (
          <div
            key={
              index
            }
            className="flex min-h-[84px] items-center gap-4 border-b border-zinc-900 px-4 py-3"
          >
            <div className="h-[60px] w-10 animate-pulse rounded-md bg-zinc-900" />

            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-900" />

              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-zinc-900" />
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-8 text-center">
      <p className="max-w-xs text-sm leading-6 text-zinc-600">
        {
          children
        }
      </p>
    </div>
  );
}

function ActiveLine({
  active,
}: {
  active:
    boolean;
}) {
  if (
    !active
  ) {
    return null;
  }

  return (
    <span className="absolute top-0 h-[2px] w-5 rounded-full bg-fuchsia-400" />
  );
}

function NavLabel({
  active,
  children,
}: {
  active:
    boolean;

  children:
    ReactNode;
}) {
  return (
    <span
      className={`max-w-full truncate px-0.5 text-[10px] font-medium ${
        active
          ? "text-zinc-200"
          : "text-zinc-600"
      }`}
    >
      {
        children
      }
    </span>
  );
}