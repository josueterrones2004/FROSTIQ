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
      ? "w-26 sm:w-29"
      : "w-22 sm:w-24";

  const mobileInfoPadding =
    posterSize === "large"
      ? "pt-21"
      : "pt-16";

  const desktopPosterClass =
    posterSize === "large"
      ? "frost-picture-poster-large"
      : "w-34";

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
    <main className="min-h-screen bg-frost-bg pb-18 text-frost-text lg:pb-24">
      <style>{`
        /* frost-picture-css-v1 */
        .frost-picture-width-1420 { max-width: 1420px; }
        .frost-picture-width-1320 { max-width: 1320px; }
        .frost-picture-width-950 { max-width: 950px; }
        .frost-picture-width-820 { max-width: 820px; }
        .frost-picture-poster-large { width: 154px; }
        .frost-picture-aspect-desktop { aspect-ratio: 16 / 5.8; }
        .frost-picture-side-width { width: 14%; }
        .frost-picture-bottom-height { height: 34%; }
        .frost-picture-saturate-mobile { filter: saturate(1.08); }
        .frost-picture-saturate-desktop { filter: saturate(1.1) contrast(1.02); }
        .frost-picture-shadow-mobile { box-shadow: 0 18px 48px rgba(0,0,0,.6); }
        .frost-picture-shadow-desktop { box-shadow: 0 18px 50px rgba(0,0,0,.5); }
        .frost-picture-text-9 { font-size: 9px; }
        .frost-picture-text-11 { font-size: 11px; }
        .frost-picture-text-15 { font-size: 15px; }
        .frost-picture-text-27 { font-size: 27px; }
        .frost-picture-track-023 { letter-spacing: .23em; }
        .frost-picture-track-neg025 { letter-spacing: -.025em; }
        .frost-picture-leading-105 { line-height: 1.05; }
        .frost-picture-leading-102 { line-height: 1.02; }
        .frost-picture-balanced { text-wrap: balance; }
        @media (min-width: 640px) {
          .frost-picture-sm-text-34 { font-size: 34px; }
          .frost-picture-text-15 { font-size: 16px; }
        }
        @media (min-width: 1024px) {
          .frost-picture-grid { grid-template-columns: minmax(0,1fr) 300px; }
        }
      `}</style>
      {/* ==================================================
          MOBILE HERO
      ================================================== */}

      <section className="lg:hidden">
        <div className="relative">
          <div className="relative aspect-8/5 w-full overflow-hidden bg-frost-surface">
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
                className="object-cover frost-picture-saturate-mobile"
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
              <div className="absolute inset-0 flex items-center justify-center bg-frost-surface text-frost-muted">
                <ImageOff
                  size={32}
                />
              </div>
            )}

            {/* SIDE GRADIENTS */}

            <div className="pointer-events-none absolute inset-y-0 left-0 frost-picture-side-width bg-gradient-to-r from-frost-bg/42 to-transparent" />

            <div className="pointer-events-none absolute inset-y-0 right-0 frost-picture-side-width bg-gradient-to-l from-frost-bg/42 to-transparent" />

            {/* BOTTOM GRADIENT */}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 frost-picture-bottom-height bg-gradient-to-t from-frost-bg via-frost-bg/72 to-transparent" />

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
              className={`pointer-events-auto relative aspect-2/3 ${mobilePosterClass} overflow-hidden rounded-xl bg-frost-surface frost-picture-shadow-mobile`}
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
                <div className="flex h-full items-center justify-center text-frost-muted">
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
          <p className="frost-picture-text-9 font-semibold uppercase frost-picture-track-023 text-frost-accent">
            {eyebrow}
          </p>

          <h1 className="mt-1.5 break-words frost-picture-text-27 font-bold frost-picture-leading-105 frost-picture-track-neg025 text-frost-text frost-picture-balanced frost-picture-sm-text-34">
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
        <div className="mx-auto w-full frost-picture-width-1420">
          <div className="relative frost-picture-aspect-desktop overflow-hidden bg-frost-surface">
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
                className="object-cover frost-picture-saturate-desktop "
                style={{
                  objectPosition:
                    `${backdropPositionX}% ${backdropPositionY}%`,

                  transform:
                    `scale(${backdropZoom})`,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-frost-surface text-frost-muted">
                <ImageOff
                  size={38}
                />
              </div>
            )}

            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-frost-bg/78 via-frost-bg/24 to-transparent" />

            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-frost-bg/72 via-frost-bg/20 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 frost-picture-bottom-height bg-gradient-to-t from-frost-bg via-frost-bg/72 to-transparent" />

            {developerAction ? (
              <div className="absolute right-6 top-6 z-20">
                {
                  developerAction
                }
              </div>
            ) : null}

            {/* DESKTOP TITLE */}

            <div className="absolute inset-x-0 bottom-0 z-10">
              <div className="mx-auto frost-picture-width-1320 px-8 pb-8">
                <div className="flex items-end gap-7">
                  <div
                    className={`${desktopPosterClass} shrink-0`}
                  >
                    <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-frost-surface frost-picture-shadow-desktop">
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
                        <div className="flex h-full items-center justify-center text-frost-muted">
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
                    <p className="frost-picture-text-11 font-semibold uppercase frost-picture-track-023 text-frost-accent">
                      {
                        eyebrow
                      }
                    </p>

                    <h1 className="mt-1.5 frost-picture-width-950 break-words text-5xl font-bold frost-picture-leading-102 frost-picture-track-neg025 text-frost-text frost-picture-balanced">
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
        <section className="mx-auto mt-5 frost-picture-width-1320 px-4 sm:px-6 lg:mt-4 lg:px-8">
          {actions}
        </section>
      ) : null}

      {/* ==================================================
          MAIN GRID

          mainContent va DENTRO de la columna izquierda,
          así no espera a que termine el sidebar.
      ================================================== */}

      <div className="mx-auto mt-9 grid frost-picture-width-1320 gap-10 px-4 sm:px-6 frost-picture-grid lg:gap-12 lg:px-8">
        {/* MAIN COLUMN */}

        <div className="min-w-0">
          {/* DESCRIPTION */}

          <section>
            <SectionTitle>
              {
                descriptionTitle
              }
            </SectionTitle>

            <p className="mt-5 frost-picture-width-820 whitespace-pre-line frost-picture-text-15 leading-8 text-frost-muted sm:text-base">
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
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-frost-surface">
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
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-black/55 text-frost-text backdrop-blur-sm transition hover:bg-black/80 hover:text-frost-text sm:left-4 sm:h-11 sm:w-11"
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
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-black/55 text-frost-text backdrop-blur-sm transition hover:bg-black/80 hover:text-frost-text sm:right-4 sm:h-11 sm:w-11"
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
                                ? "w-6 bg-frost-accent"
                                : "w-1.5 bg-frost-raised hover:bg-frost-muted"
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
        <div className="mx-auto mt-7 frost-picture-width-1320 px-4 sm:px-6 lg:mt-10 lg:px-8">
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
    <div className="border-b border-frost-border/60 pb-3">
      <h2 className="font-semibold uppercase text-frost-muted" style={{ fontSize: 11, letterSpacing: "0.21em" }}>
        {children}
      </h2>
    </div>
  );
}