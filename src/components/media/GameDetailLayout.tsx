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
    <main className="min-h-screen bg-zinc-950 pb-24 text-zinc-100">
      {/* HERO */}

      <section className="relative mx-auto max-w-[1600px] overflow-hidden lg:min-h-[710px]">
        {/* BACKDROP */}

        <div className="absolute inset-x-0 top-0 h-[330px] overflow-hidden bg-zinc-900 sm:h-[430px] lg:h-[710px]">
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
            <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-700">
              <ImageOff
                size={
                  42
                }
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/45 to-zinc-950/15 lg:via-zinc-950/25" />

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />

          <div className="absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-zinc-950/80 to-transparent" />
        </div>

        {/* MOBILE BACKDROP SPACE */}

        <div className="h-[260px] sm:h-[350px] lg:hidden" />

        {/* DESKTOP / MAIN GRID */}

        <div className="relative z-10 px-4 sm:px-6 lg:grid lg:min-h-[710px] lg:grid-cols-[350px_minmax(0,1fr)] lg:items-end lg:gap-10 lg:px-10 lg:pb-10 xl:grid-cols-[390px_minmax(0,1fr)] xl:gap-14 xl:px-14">
          {/* LEFT CONTROL PANEL */}

          <div className="-mt-16 lg:mt-0">
            <div className="rounded-[24px] border border-white/10 bg-zinc-950/88 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-5">
              <div className="flex gap-4 lg:block">
                {/* COVER */}

                <div className="w-[110px] shrink-0 sm:w-[130px] lg:w-full">
                  {coverUrl ? (
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-xl">
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
                    <div className="flex aspect-[2/3] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-600">
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-400">
                    {
                      eyebrow
                    }
                  </p>

                  <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                    {
                      title
                    }
                  </h1>

                  {cleanMeta.length >
                    0 && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-fuchsia-400">
                  {
                    eyebrow
                  }
                </p>

                <h1 className="mt-2 text-3xl font-bold leading-[1.05] tracking-tight text-white xl:text-[36px]">
                  {
                    title
                  }
                </h1>

                {cleanMeta.length >
                  0 && (
                  <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-zinc-500">
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
                            <span className="mr-2 text-zinc-700">
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
                <div className="mt-5 hidden items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/70 px-4 py-3 lg:flex">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                      Valoración
                    </p>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-emerald-300">
                        {
                          roundedRating
                        }
                      </span>

                      <span className="text-xs text-zinc-600">
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
                <div className="mt-3 border-t border-zinc-800 pt-3">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/80">
                {
                  eyebrow
                }
              </p>

              <h2 className="mt-2 text-5xl font-black tracking-[-0.035em] text-white drop-shadow-2xl xl:text-6xl">
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
                          className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-md"
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
                <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
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
                          className={`relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900 ${
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
                            className="object-cover transition duration-300 hover:scale-[1.02]"
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

      <section className="mx-auto mt-10 max-w-[1500px] px-4 sm:px-6 lg:mt-14 lg:px-10 xl:px-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
          {/* DESCRIPTION */}

          <div className="min-w-0">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <Sparkles
                size={
                  16
                }
                className="text-fuchsia-400"
              />

              <h2 className="text-[11px] font-semibold uppercase tracking-[0.19em] text-zinc-500">
                Acerca de este juego
              </h2>
            </div>

            <div className="mt-6 max-w-[850px]">
              <p className="whitespace-pre-line text-[15px] leading-7 text-zinc-400 sm:text-base sm:leading-8">
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
                      className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400"
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
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <Monitor
                size={
                  16
                }
                className="text-zinc-500"
              />

              <h2 className="text-[11px] font-semibold uppercase tracking-[0.19em] text-zinc-500">
                Información
              </h2>
            </div>

            <div className="divide-y divide-zinc-900">
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
                      <div className="mt-0.5 text-zinc-600">
                        {
                          item.icon
                        }
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                        {
                          item.label
                        }
                      </p>

                      <div className="mt-1 text-sm leading-6 text-zinc-300">
                        {
                          item.value
                        }
                      </div>
                    </div>

                    <ChevronRight
                      size={
                        14
                      }
                      className="mt-1 text-zinc-800"
                    />
                  </div>
                )
              )}

              {ratingCount !==
                null &&
                ratingCount >
                  0 && (
                  <div className="flex gap-3 py-4">
                    <div className="mt-0.5 text-zinc-600">
                      <Star
                        size={
                          15
                        }
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                        Valoraciones
                      </p>

                      <p className="mt-1 text-sm text-zinc-300">
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