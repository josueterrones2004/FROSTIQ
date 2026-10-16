"use client";

import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from "lucide-react";
import Image from "next/image";
import {
  type ReactNode,
  useState,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

export type BigPictureMediaItem = {
  id: string;
  src: string;
  alt: string;
  label?: string;
};

interface MediaBigPictureShellProps {
  eyebrow: string;
  title: string;

  posterUrl:
    | string
    | null;

  backdropUrl:
    | string
    | null;

  posterPositionX?: number;
  posterPositionY?: number;
  posterZoom?: number;

  backdropPositionX?: number;
  backdropPositionY?: number;
  backdropZoom?: number;

  posterSize?:
    | "default"
    | "large";

  meta?: ReactNode;
  actions?: ReactNode;
  developerAction?: ReactNode;

  descriptionTitle?: string;

  description:
    | string
    | null;

  galleryItems?: BigPictureMediaItem[];

  sidebar?: ReactNode;

  /*
   * Se renderiza dentro de la columna principal,
   * justo después de la descripción.
   */
  mainContent?: ReactNode;

  /*
   * Se renderiza después de toda la cuadrícula.
   */
  bottomContent?: ReactNode;
}

export default function MediaBigPictureShell({
  eyebrow,
  title,

  posterUrl,
  backdropUrl,

  posterPositionX = 50,
  posterPositionY = 50,
  posterZoom = 1,

  backdropPositionX = 50,
  backdropPositionY = 50,
  backdropZoom = 1,

  posterSize = "default",

  meta,
  actions,
  developerAction,

  descriptionTitle = "Acerca de este título",
  description,

  galleryItems = [],

  sidebar,
  mainContent,
  bottomContent,
}: MediaBigPictureShellProps) {
  const [
    activeGalleryIndex,
    setActiveGalleryIndex,
  ] =
    useState(0);

  const galleryCount =
    galleryItems.length;

  const safeGalleryIndex =
    galleryCount > 0
      ? Math.min(
          activeGalleryIndex,
          galleryCount - 1,
        )
      : 0;

  const activeGalleryItem =
    galleryItems[
      safeGalleryIndex
    ] ?? null;

  const mobilePosterClass =
    posterSize === "large"
      ? "w-[104px] sm:w-[116px]"
      : "w-[88px] sm:w-[96px]";

  const mobileInfoPadding =
    posterSize === "large"
      ? "pt-[84px]"
      : "pt-16";

  const desktopPosterClass =
    posterSize === "large"
      ? "w-[154px]"
      : "w-[136px]";

  function goPrevious() {
    if (
      galleryCount <= 1
    ) {
      return;
    }

    setActiveGalleryIndex(
      (current) =>
        current <= 0
          ? galleryCount -
            1
          : current - 1,
    );
  }

  function goNext() {
    if (
      galleryCount <= 1
    ) {
      return;
    }

    setActiveGalleryIndex(
      (current) =>
        current >=
        galleryCount - 1
          ? 0
          : current + 1,
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] pb-[72px] text-zinc-100 lg:pb-24">
      {/* ==================================================
          MOBILE HERO
      ================================================== */}

      <section className="lg:hidden">
        <div className="relative">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
            {backdropUrl ? (
              <Image
                src={
                  backdropUrl
                }
                alt=""
                fill
                priority
                sizes="100vw"
                unoptimized={
                  shouldUseOriginalImage(
                    backdropUrl,
                  )
                }
                className="object-cover saturate-[1.08]"
                style={{
                  objectPosition:
                    `${backdropPositionX}% ${backdropPositionY}%`,

                  transform:
                    `scale(${Math.max(
                      1,
                      backdropZoom,
                    )})`,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-700">
                <ImageOff
                  size={32}
                />
              </div>
            )}

            {/* SIDE GRADIENTS */}

            <div className="pointer-events-none absolute inset-y-0 left-0 w-[14%] bg-gradient-to-r from-[#050507]/42 to-transparent" />

            <div className="pointer-events-none absolute inset-y-0 right-0 w-[14%] bg-gradient-to-l from-[#050507]/42 to-transparent" />

            {/* BOTTOM GRADIENT */}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#050507] via-[#050507]/72 to-transparent" />

            {developerAction ? (
              <div className="absolute right-3 top-3 z-30">
                {
                  developerAction
                }
              </div>
            ) : null}
          </div>

          {/* POSTER */}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex translate-y-1/2 justify-center">
            <div
              className={`pointer-events-auto relative aspect-[2/3] ${mobilePosterClass} overflow-hidden rounded-xl bg-zinc-900 shadow-[0_18px_48px_rgba(0,0,0,0.6)]`}
            >
              {posterUrl ? (
                <Image
                  src={
                    posterUrl
                  }
                  alt={
                    title
                  }
                  fill
                  priority
                  sizes="116px"
                  unoptimized={
                    shouldUseOriginalImage(
                      posterUrl,
                    )
                  }
                  className="object-cover"
                  style={{
                    objectPosition:
                      `${posterPositionX}% ${posterPositionY}%`,

                    transform:
                      `scale(${posterZoom})`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-700">
                  <ImageOff
                    size={20}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE TITLE */}

        <div
          className={`px-4 pb-1 sm:px-6 ${mobileInfoPadding}`}
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.23em] text-fuchsia-300">
            {eyebrow}
          </p>

          <h1 className="mt-1.5 break-words text-[27px] font-bold leading-[1.05] tracking-[-0.025em] text-white [text-wrap:balance] sm:text-[34px]">
            {title}
          </h1>

          {meta ? (
            <div className="mt-3">
              {meta}
            </div>
          ) : null}
        </div>
      </section>

      {/* ==================================================
          DESKTOP HERO
      ================================================== */}

      <section className="hidden lg:block">
        <div className="mx-auto w-full max-w-[1420px]">
          <div className="relative aspect-[16/5.8] overflow-hidden bg-zinc-900">
            {backdropUrl ? (
              <Image
                src={
                  backdropUrl
                }
                alt=""
                fill
                priority
                sizes="(max-width: 1420px) 100vw, 1420px"
                unoptimized={
                  shouldUseOriginalImage(
                    backdropUrl,
                  )
                }
                className="object-cover saturate-[1.1] contrast-[1.02]"
                style={{
                  objectPosition:
                    `${backdropPositionX}% ${backdropPositionY}%`,

                  transform:
                    `scale(${backdropZoom})`,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-700">
                <ImageOff
                  size={38}
                />
              </div>
            )}

            <div className="pointer-events-none absolute inset-y-0 left-0 w-[25%] bg-gradient-to-r from-[#050507]/78 via-[#050507]/24 to-transparent" />

            <div className="pointer-events-none absolute inset-y-0 right-0 w-[25%] bg-gradient-to-l from-[#050507]/72 via-[#050507]/20 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#050507] via-[#050507]/72 to-transparent" />

            {developerAction ? (
              <div className="absolute right-6 top-6 z-20">
                {
                  developerAction
                }
              </div>
            ) : null}

            {/* DESKTOP TITLE */}

            <div className="absolute inset-x-0 bottom-0 z-10">
              <div className="mx-auto max-w-[1320px] px-8 pb-8">
                <div className="flex items-end gap-7">
                  <div
                    className={`${desktopPosterClass} shrink-0`}
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
                      {posterUrl ? (
                        <Image
                          src={
                            posterUrl
                          }
                          alt={
                            title
                          }
                          fill
                          priority
                          sizes="154px"
                          unoptimized={
                            shouldUseOriginalImage(
                              posterUrl,
                            )
                          }
                          className="object-cover"
                          style={{
                            objectPosition:
                              `${posterPositionX}% ${posterPositionY}%`,

                            transform:
                              `scale(${posterZoom})`,
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-700">
                          <ImageOff
                            size={
                              20
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-fuchsia-300">
                      {
                        eyebrow
                      }
                    </p>

                    <h1 className="mt-1.5 max-w-[950px] break-words text-5xl font-bold leading-[1.02] tracking-[-0.025em] text-white [text-wrap:balance]">
                      {title}
                    </h1>

                    {meta ? (
                      <div className="mt-3">
                        {meta}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      {actions ? (
        <section className="mx-auto mt-5 max-w-[1320px] px-4 sm:px-6 lg:mt-4 lg:px-8">
          {actions}
        </section>
      ) : null}

      {/* ==================================================
          MAIN GRID

          mainContent va DENTRO de la columna izquierda,
          así no espera a que termine el sidebar.
      ================================================== */}

      <div className="mx-auto mt-9 grid max-w-[1320px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 lg:px-8">
        {/* MAIN COLUMN */}

        <div className="min-w-0">
          {/* DESCRIPTION */}

          <section>
            <SectionTitle>
              {
                descriptionTitle
              }
            </SectionTitle>

            <p className="mt-5 max-w-[820px] whitespace-pre-line text-[15px] leading-8 text-zinc-400 sm:text-base">
              {description ??
                "No hay una descripción disponible."}
            </p>
          </section>

          {/* CONTENT DIRECTLY BELOW DESCRIPTION */}

          {mainContent ? (
            <div className="mt-10">
              {mainContent}
            </div>
          ) : null}

          {/* OPTIONAL GALLERY */}

          {activeGalleryItem ? (
            <section className="mt-10">
              <SectionTitle>
                Capturas
              </SectionTitle>

              <div className="mt-5">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-900">
                  <Image
                    key={
                      activeGalleryItem.id
                    }
                    src={
                      activeGalleryItem.src
                    }
                    alt={
                      activeGalleryItem.alt
                    }
                    fill
                    sizes="(max-width: 1024px) 100vw, 900px"
                    unoptimized={
                      shouldUseOriginalImage(
                        activeGalleryItem.src,
                      )
                    }
                    className="object-cover"
                  />

                  {galleryCount >
                  1 ? (
                    <>
                      <button
                        type="button"
                        onClick={
                          goPrevious
                        }
                        aria-label="Captura anterior"
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-black/55 text-zinc-200 backdrop-blur-sm transition hover:bg-black/80 hover:text-white sm:left-4 sm:h-11 sm:w-11"
                      >
                        <ChevronLeft
                          size={
                            21
                          }
                        />
                      </button>

                      <button
                        type="button"
                        onClick={
                          goNext
                        }
                        aria-label="Captura siguiente"
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-black/55 text-zinc-200 backdrop-blur-sm transition hover:bg-black/80 hover:text-white sm:right-4 sm:h-11 sm:w-11"
                      >
                        <ChevronRight
                          size={
                            21
                          }
                        />
                      </button>
                    </>
                  ) : null}
                </div>

                {galleryCount >
                1 ? (
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    {galleryItems.map(
                      (
                        item,
                        index,
                      ) => {
                        const active =
                          index ===
                          safeGalleryIndex;

                        return (
                          <button
                            key={
                              item.id
                            }
                            type="button"
                            onClick={() =>
                              setActiveGalleryIndex(
                                index,
                              )
                            }
                            aria-label={`Ir a captura ${
                              index +
                              1
                            }`}
                            className={`h-1.5 rounded-full transition-all ${
                              active
                                ? "w-6 bg-fuchsia-400"
                                : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
                            }`}
                          />
                        );
                      },
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        {/* SIDEBAR */}

        {sidebar ? (
          <aside className="min-w-0">
            {sidebar}
          </aside>
        ) : null}
      </div>

      {/* ==================================================
          FULL WIDTH CONTENT
      ================================================== */}

      {bottomContent ? (
        <div className="mx-auto mt-7 max-w-[1320px] px-4 sm:px-6 lg:mt-10 lg:px-8">
          {bottomContent}
        </div>
      ) : null}
    </main>
  );
}

export function SectionTitle({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="border-b border-white/10 pb-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.21em] text-zinc-500">
        {children}
      </h2>
    </div>
  );
}