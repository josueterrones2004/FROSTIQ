"use client";

import {
  Clock,
  Loader2,
  Search,
  X,
} from "lucide-react";

import Image from "next/image";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

type Source =
  | "games"
  | "screen"
  | "books";

type Suggestion = {
  key: string;

  title: string;

  kind:
    | "game"
    | "movie"
    | "series"
    | "book";

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

type SourceResults =
  Record<
    Source,
    Suggestion[]
  >;

const EMPTY_RESULTS:
  SourceResults = {
  games: [],
  screen: [],
  books: [],
};

const SOURCES:
  Source[] = [
  "games",
  "screen",
  "books",
];

const RECENT_KEY =
  "media-tracker-recent-searches";

function normalize(
  value:
    string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

function getKindLabel(
  kind:
    Suggestion["kind"]
) {
  if (
    kind ===
    "game"
  ) {
    return "Juego";
  }

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

  return "Libro";
}

function parseRecent(
  value:
    string |
    null
) {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }

    return parsed
      .filter(
        (
          item
        ): item is string =>
          typeof item ===
          "string"
      )
      .slice(
        0,
        6
      );
  } catch {
    return [];
  }
}

function mergeSuggestions(
  results:
    SourceResults
) {
  const all = [
    ...results.games,
    ...results.screen,
    ...results.books,
  ];

  const strongByKind =
    new Map<
      Suggestion["kind"],
      number
    >();

  for (
    const result of
    all
  ) {
    if (
      result.score >=
      95
    ) {
      strongByKind.set(
        result.kind,
        (
          strongByKind.get(
            result.kind
          ) ??
          0
        ) +
          1
      );
    }
  }

  const seen =
    new Set<
      string
    >();

  return all
    .map(
      (
        result
      ) => ({
        ...result,

        finalScore:
          result.score +
          Math.min(
            (
              strongByKind.get(
                result.kind
              ) ??
              0
            ) *
              4,
            16
          ),
      })
    )
    .sort(
      (
        first,
        second
      ) =>
        second.finalScore -
        first.finalScore
    )
    .filter(
      (
        result
      ) => {
        /*
         * Aquí usamos el ID real.
         *
         * De esta forma dos obras distintas
         * con el mismo título no desaparecen.
         */
        const key =
          result.key;

        if (
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    )
    .slice(
      0,
      8
    );
}

export default function GlobalSearch({
  className =
    "",

  onNavigate,
}: {
  className?:
    string;

  onNavigate?:
    () => void;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const containerRef =
    useRef<
      HTMLDivElement
    >(
      null
    );

  const requestIdRef =
    useRef(
      0
    );

  /*
   * Indica que la siguiente navegación
   * salió desde este buscador.
   *
   * Cuando cambie la URL forzaremos
   * scroll al inicio.
   */
  const scrollToTopRef =
    useRef(
      false
    );

  const cacheRef =
    useRef(
      new Map<
        string,
        Suggestion[]
      >()
    );

  const currentQuery =
    pathname ===
    "/search"
      ? searchParams.get(
          "q"
        ) ??
        ""
      : "";

  const [
    value,
    setValue,
  ] =
    useState(
      currentQuery
    );

  const [
    sourceResults,
    setSourceResults,
  ] =
    useState<SourceResults>(
      EMPTY_RESULTS
    );

  const [
    recent,
    setRecent,
  ] =
    useState<
      string[]
    >(
      []
    );

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    fetching,
    setFetching,
  ] =
    useState(
      false
    );

  const [
    navigating,
    setNavigating,
  ] =
    useState(
      false
    );

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(
      -1
    );

  const suggestions =
    mergeSuggestions(
      sourceResults
    );

  /*
   * SCROLL DESPUÉS DE NAVEGAR
   */

  useEffect(
    () => {
      if (
        !scrollToTopRef.current
      ) {
        return;
      }

      scrollToTopRef.current =
        false;

      const frame =
        window.requestAnimationFrame(
          () => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior:
                "auto",
            });
          }
        );

      return () =>
        window.cancelAnimationFrame(
          frame
        );
    },
    [
      pathname,
      currentQuery,
    ]
  );

  /*
   * RECENTS
   */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            setRecent(
              parseRecent(
                window.localStorage.getItem(
                  RECENT_KEY
                )
              )
            );
          },
          0
        );

      return () =>
        window.clearTimeout(
          timeout
        );
    },
    []
  );

  /*
   * URL -> INPUT
   */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            setValue(
              currentQuery
            );

            setNavigating(
              false
            );
          },
          0
        );

      return () =>
        window.clearTimeout(
          timeout
        );
    },
    [
      currentQuery,
      pathname,
    ]
  );

  /*
   * CLICK OUTSIDE
   */

  useEffect(
    () => {
      function handleClick(
        event:
          MouseEvent
      ) {
        if (
          !containerRef.current
            ?.contains(
              event.target as Node
            )
        ) {
          setOpen(
            false
          );

          setActiveIndex(
            -1
          );
        }
      }

      document.addEventListener(
        "mousedown",
        handleClick
      );

      return () =>
        document.removeEventListener(
          "mousedown",
          handleClick
        );
    },
    []
  );

  /*
   * PROGRESSIVE AUTOCOMPLETE
   */

  useEffect(
    () => {
      const query =
        value.trim();

      requestIdRef.current +=
        1;

      const requestId =
        requestIdRef.current;

      if (
        query.length <
        2
      ) {
        const timeout =
          window.setTimeout(
            () => {
              if (
                requestId !==
                requestIdRef.current
              ) {
                return;
              }

              setSourceResults({
                ...EMPTY_RESULTS,
              });

              setFetching(
                false
              );

              setActiveIndex(
                -1
              );
            },
            0
          );

        return () =>
          window.clearTimeout(
            timeout
          );
      }

      const controllers =
        SOURCES.map(
          () =>
            new AbortController()
        );

      const timeout =
        window.setTimeout(
          () => {
            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            const normalizedQuery =
              normalize(
                query
              );

            const initial:
              SourceResults = {
              games:
                cacheRef.current.get(
                  `games:${normalizedQuery}`
                ) ??
                [],

              screen:
                cacheRef.current.get(
                  `screen:${normalizedQuery}`
                ) ??
                [],

              books:
                cacheRef.current.get(
                  `books:${normalizedQuery}`
                ) ??
                [],
            };

            setSourceResults(
              initial
            );

            const missing =
              SOURCES.filter(
                (
                  source
                ) =>
                  !cacheRef.current.has(
                    `${source}:${normalizedQuery}`
                  )
              );

            if (
              missing.length ===
              0
            ) {
              setFetching(
                false
              );

              return;
            }

            setFetching(
              true
            );

            let remaining =
              missing.length;

            missing.forEach(
              (
                source
              ) => {
                const sourceIndex =
                  SOURCES.indexOf(
                    source
                  );

                const controller =
                  controllers[
                    sourceIndex
                  ];

                void fetch(
                  `/api/search-suggestions?q=${encodeURIComponent(
                    query
                  )}&source=${source}`,
                  {
                    signal:
                      controller.signal,
                  }
                )
                  .then(
                    async (
                      response
                    ) => {
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
                        ? data.results as Suggestion[]
                        : [];
                    }
                  )
                  .then(
                    (
                      results
                    ) => {
                      if (
                        requestId !==
                        requestIdRef.current
                      ) {
                        return;
                      }

                      cacheRef.current.set(
                        `${source}:${normalizedQuery}`,
                        results
                      );

                      setSourceResults(
                        (
                          current
                        ) => ({
                          ...current,

                          [source]:
                            results,
                        })
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
                    }
                  )
                  .finally(
                    () => {
                      if (
                        requestId !==
                        requestIdRef.current
                      ) {
                        return;
                      }

                      remaining -=
                        1;

                      if (
                        remaining <=
                        0
                      ) {
                        setFetching(
                          false
                        );
                      }
                    }
                  );
              }
            );
          },
          100
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
      value,
    ]
  );

  /*
   * RECENT
   */

  function saveRecent(
    query:
      string
  ) {
    const clean =
      query.trim();

    if (!clean) {
      return;
    }

    setRecent(
      (
        current
      ) => {
        const next = [
          clean,

          ...current.filter(
            (
              item
            ) =>
              item.toLowerCase() !==
              clean.toLowerCase()
          ),
        ].slice(
          0,
          6
        );

        window.localStorage.setItem(
          RECENT_KEY,
          JSON.stringify(
            next
          )
        );

        return next;
      }
    );
  }

  function removeRecent(
    query:
      string
  ) {
    setRecent(
      (
        current
      ) => {
        const next =
          current.filter(
            (
              item
            ) =>
              item !==
              query
          );

        window.localStorage.setItem(
          RECENT_KEY,
          JSON.stringify(
            next
          )
        );

        return next;
      }
    );
  }

  /*
   * FULL SEARCH
   */

  function goToSearch(
    query:
      string
  ) {
    const clean =
      query.trim();

    if (!clean) {
      return;
    }

    saveRecent(
      clean
    );

    setValue(
      clean
    );

    setOpen(
      false
    );

    setActiveIndex(
      -1
    );

    setNavigating(
      true
    );

    scrollToTopRef.current =
      true;

    onNavigate?.();

    router.push(
      `/search?q=${encodeURIComponent(
        clean
      )}`,
      {
        scroll:
          true,
      }
    );
  }

  function openSuggestion(
    suggestion:
      Suggestion
  ) {
    saveRecent(
      suggestion.title
    );

    setValue(
      suggestion.title
    );

    setOpen(
      false
    );

    setActiveIndex(
      -1
    );

    setNavigating(
      true
    );

    scrollToTopRef.current =
      true;

    onNavigate?.();

    router.push(
      suggestion.href,
      {
        scroll:
          true,
      }
    );
  }

  /*
   * SUBMIT
   */

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      activeIndex >=
        0 &&
      suggestions[
        activeIndex
      ]
    ) {
      openSuggestion(
        suggestions[
          activeIndex
        ]
      );

      return;
    }

    goToSearch(
      value
    );
  }

  /*
   * KEYBOARD
   */

  function handleKeyboard(
    event:
      KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key ===
      "ArrowDown"
    ) {
      if (
        suggestions.length ===
        0
      ) {
        return;
      }

      event.preventDefault();

      setActiveIndex(
        (
          current
        ) =>
          current >=
          suggestions.length -
            1
            ? 0
            : current +
              1
      );

      return;
    }

    if (
      event.key ===
      "ArrowUp"
    ) {
      if (
        suggestions.length ===
        0
      ) {
        return;
      }

      event.preventDefault();

      setActiveIndex(
        (
          current
        ) =>
          current <=
          0
            ? suggestions.length -
              1
            : current -
              1
      );

      return;
    }

    if (
      event.key ===
      "Escape"
    ) {
      setOpen(
        false
      );

      setActiveIndex(
        -1
      );
    }
  }

  const showRecent =
    open &&
    value.trim().length ===
      0 &&
    recent.length >
      0;

  const showSuggestions =
    open &&
    value.trim().length >=
      2;

  return (
    <div
      ref={
        containerRef
      }
      className={`relative ${className}`}
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <div className="relative">
          {navigating ? (
            <Loader2
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin text-fuchsia-400"
            />
          ) : (
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
            />
          )}

          <input
            type="search"
            value={
              value
            }
            onFocus={() =>
              setOpen(
                true
              )
            }
            onChange={(
              event
            ) => {
              setValue(
                event.target.value
              );

              setOpen(
                true
              );

              setNavigating(
                false
              );

              setActiveIndex(
                -1
              );
            }}
            onKeyDown={
              handleKeyboard
            }
            autoComplete="off"
            placeholder="Buscar títulos..."
            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-10 pr-4 text-[15px] text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
          />
        </div>
      </form>

      {(showRecent ||
        showSuggestions) && (
        <div className="absolute left-0 right-0 top-[52px] z-[80] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {showRecent && (
            <div className="p-2">
              <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Búsquedas recientes
              </p>

              {recent.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="flex items-center rounded-lg hover:bg-zinc-900"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        goToSearch(
                          item
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-300"
                    >
                      <Clock
                        size={15}
                        className="shrink-0 text-zinc-600"
                      />

                      <span className="truncate">
                        {
                          item
                        }
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeRecent(
                          item
                        )
                      }
                      className="mr-2 rounded-md p-1.5 text-zinc-700 hover:bg-zinc-800 hover:text-zinc-300"
                      aria-label={`Eliminar ${item}`}
                    >
                      <X
                        size={14}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {showSuggestions && (
            <div className="p-2">
              {suggestions.length ===
                0 &&
              fetching ? (
                <div className="flex items-center gap-2 px-3 py-4 text-sm text-zinc-600">
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  Buscando...
                </div>
              ) : suggestions.length ===
                  0 &&
                !fetching ? (
                <p className="px-3 py-4 text-sm text-zinc-600">
                  No encontramos coincidencias.
                </p>
              ) : (
                <>
                  {suggestions.map(
                    (
                      suggestion,
                      index
                    ) => (
                      <button
                        key={
                          suggestion.key
                        }
                        type="button"
                        onMouseEnter={() =>
                          setActiveIndex(
                            index
                          )
                        }
                        onClick={() =>
                          openSuggestion(
                            suggestion
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                          activeIndex ===
                          index
                            ? "bg-zinc-900"
                            : "hover:bg-zinc-900"
                        }`}
                      >
                        <div className="relative h-[54px] w-9 shrink-0 overflow-hidden rounded bg-zinc-900">
                          {suggestion.image ? (
                            <Image
                              src={
                                suggestion.image
                              }
                              alt={
                                suggestion.title
                              }
                              fill
                              sizes="36px"
                              unoptimized={
                                shouldUseOriginalImage(
                                  suggestion.image
                                )
                              }
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[8px] text-zinc-700">
                              —
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {
                              suggestion.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {getKindLabel(
                              suggestion.kind
                            )}

                            {suggestion.year &&
                              ` · ${suggestion.year}`}
                          </p>
                        </div>
                      </button>
                    )
                  )}

                  {fetching && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700">
                      <Loader2
                        size={12}
                        className="animate-spin"
                      />

                      Buscando más resultados...
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      goToSearch(
                        value
                      )
                    }
                    className="mt-1 w-full border-t border-zinc-800 px-3 py-3 text-left text-sm font-medium text-fuchsia-400 transition hover:text-fuchsia-300"
                  >
                    Ver todos los resultados para “
                    {value.trim()}
                    ”
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}