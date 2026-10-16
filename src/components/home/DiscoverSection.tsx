"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Film,
  Gamepad2,
  Sparkles,
  Tv,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  type TouchEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import type {
  DiscoverItem,
  DiscoverKind,
} from "@/lib/discover";

const AUTOPLAY_MS = 7000;

const mixedOrder: DiscoverKind[] = [
  "movie",
  "game",
  "series",
  "book",
];

function getKindLabel(
  kind: DiscoverKind
) {
  if (kind === "movie") {
    return "Película";
  }

  if (kind === "series") {
    return "Serie";
  }

  if (kind === "game") {
    return "Juego";
  }

  return "Libro";
}

function KindIcon({
  kind,
}: {
  kind: DiscoverKind;
}) {
  if (kind === "movie") {
    return (
      <Film size={11} />
    );
  }

  if (kind === "series") {
    return (
      <Tv size={11} />
    );
  }

  if (kind === "game") {
    return (
      <Gamepad2 size={11} />
    );
  }

  return (
    <BookOpen size={11} />
  );
}

function interleaveItems(
  items: DiscoverItem[],
  maximum = 24
) {
  const groups =
    new Map<
      DiscoverKind,
      DiscoverItem[]
    >();

  for (
    const kind of
    mixedOrder
  ) {
    groups.set(
      kind,
      items.filter(
        (item) =>
          item.kind === kind
      )
    );
  }

  const result:
    DiscoverItem[] = [];

  let index = 0;

  while (
    result.length <
    maximum
  ) {
    let added = false;

    for (
      const kind of
      mixedOrder
    ) {
      const item =
        groups.get(
          kind
        )?.[index];

      if (!item) {
        continue;
      }

      result.push(
        item
      );

      added = true;

      if (
        result.length >=
        maximum
      ) {
        break;
      }
    }

    if (!added) {
      break;
    }

    index += 1;
  }

  return result;
}

function getHeroSlides(
  items: DiscoverItem[]
) {
  const now =
    Date.now();

  const GAME_PAST_WINDOW =
    30 *
    24 *
    60 *
    60 *
    1000;

  const GAME_FUTURE_WINDOW =
    7 *
    24 *
    60 *
    60 *
    1000;

  const games =
    items
      .filter(
        (item) => {
          if (
            item.kind !==
            "game"
          ) {
            return false;
          }

          if (
            !item.isRecentRelease
          ) {
            return false;
          }

          if (
            !item.backdrop ||
            !item.releaseTimestamp
          ) {
            return false;
          }

          return (
            item.releaseTimestamp >=
              now -
                GAME_PAST_WINDOW &&
            item.releaseTimestamp <=
              now +
                GAME_FUTURE_WINDOW
          );
        }
      )
      .sort(
        (
          first,
          second
        ) => {
          const firstRelease =
            first.releaseTimestamp ??
            0;

          const secondRelease =
            second.releaseTimestamp ??
            0;

          const firstDistance =
            Math.abs(
              firstRelease -
                now
            );

          const secondDistance =
            Math.abs(
              secondRelease -
                now
            );

          if (
            firstDistance !==
            secondDistance
          ) {
            return (
              firstDistance -
              secondDistance
            );
          }

          return (
            secondRelease -
            firstRelease
          );
        }
      );

  const movies =
    items.filter(
      (item) =>
        item.kind ===
          "movie" &&
        Boolean(
          item.backdrop
        )
    );

  const series =
    items.filter(
      (item) =>
        item.kind ===
          "series" &&
        Boolean(
          item.backdrop
        )
    );

  const groups:
    DiscoverItem[][] = [
      movies,
      games,
      series,
    ];

  const slides:
    DiscoverItem[] = [];

  let index = 0;

  while (
    slides.length < 7
  ) {
    let added = false;

    for (
      const group of
      groups
    ) {
      const item =
        group[index];

      if (!item) {
        continue;
      }

      slides.push(
        item
      );

      added = true;

      if (
        slides.length >=
        7
      ) {
        break;
      }
    }

    if (!added) {
      break;
    }

    index += 1;
  }

  return slides;
}

function getItemsByKind(
  items: DiscoverItem[],
  kind: DiscoverKind,
  start = 0,
  limit = 12
) {
  return items
    .filter(
      (item) =>
        item.kind === kind
    )
    .slice(
      start,
      start + limit
    );
}

export default function DiscoverSection({
  items,
}: {
  items: DiscoverItem[];
}) {
  const [
    activeSlide,
    setActiveSlide,
  ] =
    useState(0);

  const [
    paused,
    setPaused,
  ] =
    useState(false);

  const [
    restartToken,
    setRestartToken,
  ] =
    useState(0);

  const touchStartX =
    useRef<
      number | null
    >(null);

  const touchStartY =
    useRef<
      number | null
    >(null);

  const didSwipe =
    useRef(false);

  const heroSlides =
    useMemo(
      () =>
        getHeroSlides(
          items
        ),
      [items]
    );

  const safeActiveSlide =
    heroSlides.length > 0
      ? activeSlide %
        heroSlides.length
      : 0;

  /*
   * Cada fuente ya llega ordenada por
   * tendencia / popularidad.
   *
   * Usamos los primeros 12 de cada tipo
   * para sus respectivas secciones.
   */

  const trendingMovies =
    useMemo(
      () =>
        getItemsByKind(
          items,
          "movie"
        ),
      [items]
    );

  const trendingSeries =
    useMemo(
      () =>
        getItemsByKind(
          items,
          "series"
        ),
      [items]
    );

  const trendingGames =
    useMemo(
      () =>
        getItemsByKind(
          items,
          "game"
        ),
      [items]
    );

  const trendingBooks =
    useMemo(
      () =>
        getItemsByKind(
          items,
          "book"
        ),
      [items]
    );

  /*
   * Para recomendaciones usamos títulos
   * posteriores al top 12 de cada categoría.
   *
   * Así no repetimos exactamente lo mismo
   * que aparece en Tendencias.
   */

  const recommendedItems =
    useMemo(
      () => {
        const remaining =
          mixedOrder.flatMap(
            (kind) =>
              getItemsByKind(
                items,
                kind,
                12,
                20
              )
          );

        return interleaveItems(
          remaining,
          12
        );
      },
      [items]
    );

  function goToSlide(
    index: number
  ) {
    if (
      heroSlides.length ===
      0
    ) {
      return;
    }

    const normalized =
      (
        (
          index %
          heroSlides.length
        ) +
        heroSlides.length
      ) %
      heroSlides.length;

    setActiveSlide(
      normalized
    );

    setRestartToken(
      (current) =>
        current + 1
    );
  }

  function handleTouchStart(
    event:
      TouchEvent<HTMLDivElement>
  ) {
    const touch =
      event.touches[0];

    if (!touch) {
      return;
    }

    touchStartX.current =
      touch.clientX;

    touchStartY.current =
      touch.clientY;

    didSwipe.current =
      false;

    setPaused(true);
  }

  function handleTouchEnd(
    event:
      TouchEvent<HTMLDivElement>
  ) {
    const touch =
      event.changedTouches[0];

    if (
      !touch ||
      touchStartX.current ===
        null ||
      touchStartY.current ===
        null
    ) {
      setPaused(false);

      return;
    }

    const differenceX =
      touch.clientX -
      touchStartX.current;

    const differenceY =
      touch.clientY -
      touchStartY.current;

    touchStartX.current =
      null;

    touchStartY.current =
      null;

    setPaused(false);

    if (
      Math.abs(
        differenceY
      ) >
      Math.abs(
        differenceX
      )
    ) {
      return;
    }

    const SWIPE_THRESHOLD =
      45;

    if (
      Math.abs(
        differenceX
      ) <
      SWIPE_THRESHOLD
    ) {
      return;
    }

    didSwipe.current =
      true;

    if (
      differenceX < 0
    ) {
      goToSlide(
        safeActiveSlide +
          1
      );
    } else {
      goToSlide(
        safeActiveSlide -
          1
      );
    }
  }

  if (
    items.length ===
    0
  ) {
    return null;
  }

  const currentHero =
    heroSlides[
      safeActiveSlide
    ];

  return (
    <div className="min-w-0">
      {/* ======================================
          ESTRENOS
      ====================================== */}

      {currentHero && (
        <section className="min-w-0">
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Sparkles
                size={15}
                className="text-fuchsia-400"
              />

              <h2 className="text-[14px] font-semibold uppercase tracking-[0.17em] text-zinc-200 sm:text-[15px]">
                Estrenos y novedades
              </h2>
            </div>

            <p className="mt-1 text-[13px] text-zinc-500 sm:text-sm">
              Nuevos títulos para ver, jugar y descubrir
            </p>
          </div>

          <div
            onMouseEnter={() =>
              setPaused(
                true
              )
            }
            onMouseLeave={() =>
              setPaused(
                false
              )
            }
            onTouchStart={
              handleTouchStart
            }
            onTouchEnd={
              handleTouchEnd
            }
            className="relative touch-pan-y"
          >
            <Link
              key={
                currentHero.key
              }
              href={
                currentHero.href
              }
              onClick={(
                event
              ) => {
                if (
                  didSwipe.current
                ) {
                  event.preventDefault();

                  didSwipe.current =
                    false;
                }
              }}
              className="group relative block h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:h-[340px] lg:h-[400px]"
            >
              {currentHero.backdrop ? (
                <Image
                  src={
                    currentHero.backdrop
                  }
                  alt={
                    currentHero.title
                  }
                  fill
                  priority
                  draggable={
                    false
                  }
                  sizes="100vw"
                  unoptimized={
                    shouldUseOriginalImage(
                      currentHero.backdrop
                    )
                  }
                  className="pointer-events-none select-none object-cover"
                  style={{
                    objectPosition:
                      `${currentHero.backdropPositionX}% ${currentHero.backdropPositionY}%`,

                    transform:
                      `scale(${currentHero.backdropZoom})`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-900" />
              )}

              {/* MOBILE */}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/42 via-black/10 to-transparent sm:hidden" />

              {/* DESKTOP */}

              <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[52%] bg-gradient-to-r from-black/38 via-black/12 to-transparent sm:block" />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[38%] bg-gradient-to-t from-black/30 via-transparent to-transparent sm:block" />

              {/* MOBILE INFO */}

              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:hidden">
                <div className="flex flex-wrap items-center gap-1.5">
                  <MediaBadge
                    kind={
                      currentHero.kind
                    }
                  />

                  {currentHero.year && (
                    <span className="rounded-full border border-white/20 bg-black/20 px-2 py-1 text-[9px] text-white backdrop-blur-sm">
                      {
                        currentHero.year
                      }
                    </span>
                  )}

                  <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/15 px-2 py-1 text-[9px] font-medium text-fuchsia-100 backdrop-blur-sm">
                    Novedad
                  </span>
                </div>

                <h3 className="mt-2 line-clamp-2 max-w-[94%] text-[21px] font-bold leading-[1.07] tracking-tight text-white drop-shadow-md">
                  {
                    currentHero.title
                  }
                </h3>
              </div>

              {/* DESKTOP INFO */}

              <div className="absolute inset-x-0 bottom-0 z-10 hidden pb-8 pl-[88px] pr-[88px] sm:block lg:pb-10 lg:pl-[100px] lg:pr-[100px]">
                <div className="max-w-[720px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <MediaBadge
                      kind={
                        currentHero.kind
                      }
                    />

                    {currentHero.year && (
                      <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                        {
                          currentHero.year
                        }
                      </span>
                    )}

                    <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/15 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100 backdrop-blur-sm">
                      Novedad
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-2 max-w-[680px] text-3xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-md lg:text-[42px]">
                    {
                      currentHero.title
                    }
                  </h3>

                  {currentHero.description ? (
                    <p className="mt-3 line-clamp-2 max-w-[650px] text-sm leading-6 text-white/90 drop-shadow-sm lg:text-[15px]">
                      {
                        currentHero.description
                      }
                    </p>
                  ) : currentHero.meta ? (
                    <p className="mt-3 truncate text-sm text-white/85">
                      {
                        currentHero.meta
                      }
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>

            {heroSlides.length >
              1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    goToSlide(
                      safeActiveSlide -
                        1
                    )
                  }
                  className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border border-white/20 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 sm:flex lg:left-5"
                  aria-label="Estreno anterior"
                >
                  <ArrowLeft
                    size={18}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    goToSlide(
                      safeActiveSlide +
                        1
                    )
                  }
                  className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border border-white/20 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 sm:flex lg:right-5"
                  aria-label="Siguiente estreno"
                >
                  <ArrowRight
                    size={18}
                  />
                </button>
              </>
            )}
          </div>

          {heroSlides.length >
            1 && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {heroSlides.map(
                (
                  item,
                  index
                ) => {
                  const active =
                    index ===
                    safeActiveSlide;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() =>
                        goToSlide(
                          index
                        )
                      }
                      aria-label={`Mostrar ${item.title}`}
                      aria-current={
                        active
                          ? "true"
                          : undefined
                      }
                      className={`relative h-1.5 overflow-hidden rounded-full transition-all ${
                        active
                          ? "w-7 bg-zinc-600"
                          : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
                      }`}
                    >
                      {active && (
                        <span
                          key={`${item.key}-${restartToken}`}
                          onAnimationEnd={() =>
                            goToSlide(
                              safeActiveSlide +
                                1
                            )
                          }
                          className="absolute inset-y-0 left-0 rounded-full bg-fuchsia-400"
                          style={{
                            animation:
                              `heroProgress ${AUTOPLAY_MS}ms linear forwards`,

                            animationPlayState:
                              paused
                                ? "paused"
                                : "running",
                          }}
                        />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </section>
      )}

      {/* ======================================
          TENDENCIAS
      ====================================== */}

      {(trendingMovies.length >
        0 ||
        trendingSeries.length >
          0 ||
        trendingGames.length >
          0 ||
        trendingBooks.length >
          0) && (
        <section className="mt-10 min-w-0 sm:mt-12">
          <div className="mb-6 border-b border-zinc-900 pb-3">
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.17em] text-zinc-200 sm:text-[15px]">
              Tendencias
            </h2>

            <p className="mt-1 text-[13px] text-zinc-500 sm:text-sm">
              Lo más popular de cada categoría
            </p>
          </div>

          <div className="space-y-9">
            {trendingMovies.length >
              0 && (
              <TrendCategory
                kind="movie"
                title="Películas en tendencia"
                subtitle="Las películas que más están destacando ahora"
                items={
                  trendingMovies
                }
              />
            )}

            {trendingSeries.length >
              0 && (
              <TrendCategory
                kind="series"
                title="Series en tendencia"
                subtitle="Las series que están dando de qué hablar"
                items={
                  trendingSeries
                }
              />
            )}

            {trendingGames.length >
              0 && (
              <TrendCategory
                kind="game"
                title="Juegos en tendencia"
                subtitle="Los juegos más populares del momento"
                items={
                  trendingGames
                }
              />
            )}

            {trendingBooks.length >
              0 && (
              <TrendCategory
                kind="book"
                title="Libros populares"
                subtitle="Los libros que más se están descubriendo"
                items={
                  trendingBooks
                }
              />
            )}
          </div>
        </section>
      )}

      {/* ======================================
          RECOMENDACIONES
      ====================================== */}

      {recommendedItems.length >
        0 && (
        <section className="mt-10 min-w-0 sm:mt-12">
          <DiscoverSectionHeader
            title="Más para descubrir"
            subtitle="Otros títulos que podrían interesarte"
          />

          <MediaRail
            items={
              recommendedItems
            }
          />
        </section>
      )}

      <style>{`
        @keyframes heroProgress {
          from {
            width: 0%;
          }

          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function TrendCategory({
  kind,
  title,
  subtitle,
  items,
}: {
  kind: DiscoverKind;
  title: string;
  subtitle: string;
  items: DiscoverItem[];
}) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">
              <KindIcon
                kind={
                  kind
                }
              />
            </span>

            <h3 className="truncate text-sm font-semibold text-zinc-200 sm:text-base">
              {title}
            </h3>
          </div>

          <p className="mt-1 pl-9 text-xs text-zinc-600 sm:text-[13px]">
            {subtitle}
          </p>
        </div>

        <Link
          href={
            kind === "movie"
              ? "/movies"
              : kind === "series"
                ? "/series"
                : kind === "game"
                  ? "/games"
                  : "/books"
          }
          className="shrink-0 text-xs font-medium text-zinc-500 transition hover:text-zinc-200"
        >
          Ver todo
        </Link>
      </div>

      <MediaRail
        items={items}
      />
    </div>
  );
}

function DiscoverSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 border-b border-zinc-900 pb-3">
      <h2 className="text-[14px] font-semibold uppercase tracking-[0.17em] text-zinc-200 sm:text-[15px]">
        {title}
      </h2>

      <p className="mt-1 text-[13px] text-zinc-500 sm:text-sm">
        {subtitle}
      </p>
    </div>
  );
}

function MediaRail({
  items,
}: {
  items: DiscoverItem[];
}) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:px-0">
      {items.map(
        (item) => (
          <div
            key={
              item.key
            }
            className="w-[128px] shrink-0 snap-start sm:w-[145px] lg:w-[158px] xl:w-[166px]"
          >
            <MediaCard
              item={
                item
              }
            />
          </div>
        )
      )}
    </div>
  );
}

function MediaCard({
  item,
}: {
  item: DiscoverItem;
}) {
  return (
    <Link
      href={
        item.href
      }
      className="group block min-w-0"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 p-1 transition duration-200 hover:border-white/20">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900">
          {item.image ? (
            <Image
              src={
                item.image
              }
              alt={
                item.title
              }
              fill
              sizes="170px"
              unoptimized={
                shouldUseOriginalImage(
                  item.image
                )
              }
              className="object-cover transition duration-300 group-hover:brightness-110"
              style={{
                objectPosition:
                  `${item.imagePositionX}% ${item.imagePositionY}%`,

                transform:
                  `scale(${item.imageZoom})`,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-700">
              Sin imagen
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          <div className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-medium text-zinc-100 backdrop-blur-sm">
            <span className="inline-flex items-center gap-1">
              <KindIcon
                kind={
                  item.kind
                }
              />

              {getKindLabel(
                item.kind
              )}
            </span>
          </div>
        </div>
      </div>

      <h3 className="mt-2 line-clamp-2 min-h-9 text-[12px] font-medium leading-[18px] text-zinc-200 transition group-hover:text-white sm:text-[13px]">
        {
          item.title
        }
      </h3>

      <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] text-zinc-500 sm:text-[11px]">
        <span className="truncate">
          {item.year ??
            item.meta ??
            getKindLabel(
              item.kind
            )}
        </span>
      </div>
    </Link>
  );
}

function MediaBadge({
  kind,
}: {
  kind: DiscoverKind;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm sm:text-[11px]">
      <KindIcon
        kind={
          kind
        }
      />

      {getKindLabel(
        kind
      )}
    </span>
  );
}