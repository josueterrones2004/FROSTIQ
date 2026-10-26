import {
  BarChart3,
  ChevronRight,
  ImageOff,
  Images,
  Monitor,
  Sparkles,
  Star,
} from "lucide-react";

import Image from "next/image";

import {
  type ReactNode,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

export type GameInformationItem = {
  label:
    string;

  value:
    ReactNode;

  icon?:
    ReactNode;
};

interface GameDetailLayoutProps {
  title:
    string;

  eyebrow:
    string;

  coverUrl:
    | string
    | null;

  backdropUrl:
    | string
    | null;

  coverPositionX?:
    number;

  coverPositionY?:
    number;

  coverZoom?:
    number;

  backdropPositionX?:
    number;

  backdropPositionY?:
    number;

  backdropZoom?:
    number;

  meta?:
    string[];

  tags?:
    string[];

  description:
    | string
    | null;

  screenshots?:
    string[];

  rating?:
    number
    | null;

  ratingCount?:
    number
    | null;

  information?:
    GameInformationItem[];

  actions?:
    ReactNode;

  developerAction?:
    ReactNode;
}

export default function GameDetailLayout({
  title,
  eyebrow,
  coverUrl,
  backdropUrl,

  coverPositionX = 50,
  coverPositionY = 50,
  coverZoom = 1,

  backdropPositionX = 50,
  backdropPositionY = 50,
  backdropZoom = 1,

  meta = [],
  tags = [],
  description,
  screenshots = [],
  rating = null,
  ratingCount = null,
  information = [],
  actions,
  developerAction,
}: GameDetailLayoutProps) {
  const cleanMeta =
    meta.filter(
      (
        value
      ) =>
        Boolean(
          value.trim()
        )
    );

  const roundedRating =
    rating !==
    null
      ? Math.round(
          rating
        )
      : null;

  return (
    <main className="min-h-screen bg-frost-bg pb-24 text-frost-text">
      <style>{`
        /* frost-game-detail-palette-v1 */
        .frost-game-width-1600 { max-width: 1600px; }
        .frost-game-width-1500 { max-width: 1500px; }
        .frost-game-width-850 { max-width: 850px; }
        .frost-game-backdrop-height { height: 330px; }
        .frost-game-mobile-spacer { height: 260px; }
        .frost-game-gradient-side { width: 15%; }
        .frost-game-cover-width { width: 110px; }
        .frost-game-screenshot-hover:hover { transform: scale(1.02); }
        .frost-game-text-10 { font-size: 10px; }
        .frost-game-text-11 { font-size: 11px; }
        .frost-game-text-15 { font-size: 15px; }
        .frost-game-leading-105 { line-height: 1.05; }
        .frost-game-track-014 { letter-spacing: .14em; }
        .frost-game-track-018 { letter-spacing: .18em; }
        .frost-game-track-019 { letter-spacing: .19em; }
        .frost-game-track-022 { letter-spacing: .22em; }
        .frost-game-track-neg035 { letter-spacing: -.035em; }
        @media (min-width: 640px) {
          .frost-game-backdrop-height { height: 430px; }
          .frost-game-mobile-spacer { height: 350px; }
          .frost-game-cover-width { width: 130px; }
          .frost-game-text-15 { font-size: 16px; }
        }
        @media (min-width: 1024px) {
          .frost-game-backdrop-height { height: 710px; }
          .frost-game-cover-width { width: 100%; }
          .frost-game-hero-min-height { min-height: 710px; }
          .frost-game-hero-grid { grid-template-columns: 350px minmax(0,1fr); }
          .frost-game-info-grid { grid-template-columns: minmax(0,1fr) 320px; }
        }
        @media (min-width: 1280px) {
          .frost-game-hero-grid { grid-template-columns: 390px minmax(0,1fr); }
          .frost-game-xl-text-36 { font-size: 36px; }
        }
      `}</style>
      {/* HERO */}

      <section className="relative mx-auto frost-game-width-1600 overflow-hidden frost-game-hero-min-height">
        {/* BACKDROP */}

        <div className="absolute inset-x-0 top-0 frost-game-backdrop-height overflow-hidden bg-frost-surface  ">
          {backdropUrl ? (
            <Image
              src={
                backdropUrl
              }
              alt=""
              fill
              priority
              unoptimized={
                shouldUseOriginalImage(
                  backdropUrl
                )
              }
              sizes="100vw"
              className="object-cover"
              style={{
                objectPosition:
                  `${backdropPositionX}% ${backdropPositionY}%`,

                transform:
                  `scale(${backdropZoom})`,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-frost-surface text-frost-muted">
              <ImageOff
                size={
                  42
                }
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-frost-bg via-frost-bg/45 to-frost-bg/15 lg:via-frost-bg/25" />

          <div className="absolute inset-0 bg-gradient-to-t from-frost-bg via-frost-bg/35 to-transparent" />

          <div className="absolute inset-y-0 right-0 frost-game-gradient-side bg-gradient-to-l from-frost-bg/80 to-transparent" />
        </div>

        {/* MOBILE BACKDROP SPACE */}

        <div className="frost-game-mobile-spacer  lg:hidden" />

        {/* DESKTOP / MAIN GRID */}

        <div className="relative z-10 px-4 sm:px-6 lg:grid frost-game-hero-min-height frost-game-hero-grid lg:items-end lg:gap-10 lg:px-10 lg:pb-10  xl:gap-14 xl:px-14">
          {/* LEFT CONTROL PANEL */}

          <div className="-mt-16 lg:mt-0">
            <div className="rounded-3xl border border-frost-border bg-frost-bg/88 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-5">
              <div className="flex gap-4 lg:block">
                {/* COVER */}

                <div className="frost-game-cover-width shrink-0  lg:w-full">
                  {coverUrl ? (
                    <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-frost-border bg-frost-surface shadow-xl">
                      <Image
                        src={
                          coverUrl
                        }
                        alt={
                          title
                        }
                        fill
                        priority
                        sizes="(max-width: 1024px) 130px, 350px"
                        unoptimized={
                          shouldUseOriginalImage(
                            coverUrl
                          )
                        }
                        className="object-cover"
                        style={{
                          objectPosition:
                            `${coverPositionX}% ${coverPositionY}%`,

                          transform:
                            `scale(${coverZoom})`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-2/3 items-center justify-center rounded-2xl border border-frost-border bg-frost-surface text-frost-muted">
                      <ImageOff
                        size={
                          28
                        }
                      />
                    </div>
                  )}
                </div>

                {/* MOBILE TITLE */}

                <div className="min-w-0 flex-1 lg:hidden">
                  <p className="frost-game-text-10 font-semibold uppercase frost-game-track-018 text-frost-accent">
                    {
                      eyebrow
                    }
                  </p>

                  <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-frost-text sm:text-3xl">
                    {
                      title
                    }
                  </h1>

                  {cleanMeta.length >
                    0 && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-frost-muted">
                      {cleanMeta.join(
                        " · "
                      )}
                    </p>
                  )}

                  {roundedRating !==
                    null && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300">
                      <Star
                        size={
                          13
                        }
                        fill="currentColor"
                      />

                      {
                        roundedRating
                      }
                      /100
                    </div>
                  )}
                </div>
              </div>

              {/* DESKTOP TITLE INSIDE LEFT PANEL */}

              <div className="mt-5 hidden lg:block">
                <p className="frost-game-text-10 font-semibold uppercase frost-game-track-019 text-frost-accent">
                  {
                    eyebrow
                  }
                </p>

                <h1 className="mt-2 text-3xl font-bold frost-game-leading-105 tracking-tight text-frost-text frost-game-xl-text-36">
                  {
                    title
                  }
                </h1>

                {cleanMeta.length >
                  0 && (
                  <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-frost-muted">
                    {cleanMeta.map(
                      (
                        item,
                        index
                      ) => (
                        <span
                          key={`${item}-${index}`}
                        >
                          {index >
                            0 && (
                            <span className="mr-2 text-frost-muted">
                              ·
                            </span>
                          )}

                          {
                            item
                          }
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* SCORE */}

              {roundedRating !==
                null && (
                <div className="mt-5 hidden items-center justify-between rounded-xl border border-frost-border/80 bg-frost-surface/70 px-4 py-3 lg:flex">
                  <div>
                    <p className="frost-game-text-10 font-medium uppercase frost-game-track-014 text-frost-muted">
                      Valoración
                    </p>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-emerald-300">
                        {
                          roundedRating
                        }
                      </span>

                      <span className="text-xs text-frost-muted">
                        /100
                      </span>
                    </div>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <BarChart3
                      size={
                        19
                      }
                    />
                  </div>
                </div>
              )}

              {/* ACTIONS */}

              {actions && (
                <div className="mt-5">
                  {
                    actions
                  }
                </div>
              )}

              {/* DEV */}

              {developerAction && (
                <div className="mt-3 border-t border-frost-border pt-3">
                  {
                    developerAction
                  }
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="mt-8 min-w-0 lg:mt-0">
            {/* LARGE DESKTOP TITLE */}

            <div className="hidden max-w-4xl lg:block">
              <p className="frost-game-text-11 font-semibold uppercase frost-game-track-022 text-frost-accent/80">
                {
                  eyebrow
                }
              </p>

              <h2 className="mt-2 text-5xl font-black frost-game-track-neg035 text-frost-text drop-shadow-2xl xl:text-6xl">
                {
                  title
                }
              </h2>

              {tags.length >
                0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (
                        tag
                      ) => (
                        <span
                          key={
                            tag
                          }
                          className="rounded-full border border-frost-border bg-black/35 px-3 py-1.5 text-xs text-frost-text backdrop-blur-md"
                        >
                          {
                            tag
                          }
                        </span>
                      )
                    )}
                </div>
              )}
            </div>

            {/* SCREENSHOT STRIP */}

            {screenshots.length >
              0 && (
              <div className="mt-7 lg:mt-8">
                <div className="mb-3 flex items-center gap-2 text-xs text-frost-muted">
                  <Images
                    size={
                      15
                    }
                  />

                  Galería
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {screenshots
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (
                        screenshot,
                        index
                      ) => (
                        <div
                          key={`${screenshot}-${index}`}
                          className={`relative overflow-hidden rounded-xl border border-frost-border bg-frost-surface ${
                            index ===
                              0
                              ? "col-span-2 aspect-video sm:col-span-2 xl:col-span-2"
                              : "aspect-video"
                          }`}
                        >
                          <Image
                            src={
                              screenshot
                            }
                            alt={`${title} captura ${index + 1}`}
                            fill
                            sizes="(max-width: 1024px) 50vw, 30vw"
                            unoptimized={
                              shouldUseOriginalImage(
                                screenshot
                              )
                            }
                            className="object-cover transition duration-300 frost-game-screenshot-hover"
                          />
                        </div>
                      )
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <section className="mx-auto mt-10 frost-game-width-1500 px-4 sm:px-6 lg:mt-14 lg:px-10 xl:px-14">
        <div className="grid gap-8 frost-game-info-grid xl:gap-14">
          {/* DESCRIPTION */}

          <div className="min-w-0">
            <div className="flex items-center gap-3 border-b border-frost-border pb-3">
              <Sparkles
                size={
                  16
                }
                className="text-frost-accent"
              />

              <h2 className="frost-game-text-11 font-semibold uppercase frost-game-track-019 text-frost-muted">
                Acerca de este juego
              </h2>
            </div>

            <div className="mt-6 frost-game-width-850">
              <p className="whitespace-pre-line frost-game-text-15 leading-7 text-frost-muted sm:text-base sm:leading-8">
                {description ||
                  "No hay una descripción disponible para este juego."}
              </p>
            </div>

            {/* MOBILE TAGS */}

            {tags.length >
              0 && (
              <div className="mt-7 flex flex-wrap gap-2 lg:hidden">
                {tags.map(
                  (
                    tag
                  ) => (
                    <span
                      key={
                        tag
                      }
                      className="rounded-full border border-frost-border bg-frost-surface px-3 py-1.5 text-xs text-frost-muted"
                    >
                      {
                        tag
                      }
                    </span>
                  )
                )}
              </div>
            )}
          </div>

          {/* INFORMATION */}

          <aside>
            <div className="flex items-center gap-3 border-b border-frost-border pb-3">
              <Monitor
                size={
                  16
                }
                className="text-frost-muted"
              />

              <h2 className="frost-game-text-11 font-semibold uppercase frost-game-track-019 text-frost-muted">
                Información
              </h2>
            </div>

            <div className="divide-y divide-frost-border">
              {information.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="flex gap-3 py-4"
                  >
                    {item.icon && (
                      <div className="mt-0.5 text-frost-muted">
                        {
                          item.icon
                        }
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="frost-game-text-10 font-medium uppercase frost-game-track-014 text-frost-muted">
                        {
                          item.label
                        }
                      </p>

                      <div className="mt-1 text-sm leading-6 text-frost-text">
                        {
                          item.value
                        }
                      </div>
                    </div>

                    <ChevronRight
                      size={
                        14
                      }
                      className="mt-1 text-frost-muted"
                    />
                  </div>
                )
              )}

              {ratingCount !==
                null &&
                ratingCount >
                  0 && (
                  <div className="flex gap-3 py-4">
                    <div className="mt-0.5 text-frost-muted">
                      <Star
                        size={
                          15
                        }
                      />
                    </div>

                    <div>
                      <p className="frost-game-text-10 font-medium uppercase frost-game-track-014 text-frost-muted">
                        Valoraciones
                      </p>

                      <p className="mt-1 text-sm text-frost-text">
                        {new Intl.NumberFormat(
                          "es-MX"
                        ).format(
                          ratingCount
                        )}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}