import {
  ImageOff,
} from "lucide-react";

import Image from "next/image";

import {
  type ReactNode,
} from "react";

import GuestMediaActions from "@/components/media/GuestMediaActions";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  createClient,
} from "@/lib/supabase/server";

export type MediaInformationItem = {
  label:
    string;

  value:
    ReactNode;

  icon?:
    ReactNode;
};

export type MediaHeroMode =
  | "backdrop"
  | "compact";

export interface MediaDetailLayoutProps {
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

  heroMode?:
    MediaHeroMode;

  meta?:
    string[];

  tags?:
    string[];

  description:
    | string
    | null;

  information?:
    MediaInformationItem[];

  children?:
    ReactNode;

  mainContent?:
    ReactNode;

  bottomContent?:
    ReactNode;

  noDescriptionText?:
    string;
}

export default async function MediaDetailLayout({
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

  heroMode = "backdrop",

  meta = [],
  tags = [],
  description,
  information = [],
  children,
  mainContent,
  bottomContent,

  noDescriptionText =
    "No hay una descripción disponible.",
}: MediaDetailLayoutProps) {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  const cleanMeta =
    meta.filter(
      (
        value
      ) =>
        Boolean(
          value?.trim()
        )
    );

  const actions =
    user
      ? children
      : (
          <GuestMediaActions />
        );

  const heroContent = (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end lg:gap-9">
      <div className="frost-detail-cover-width shrink-0  ">
        {coverUrl ? (
          <div className="aspect-2/3 w-full overflow-hidden rounded-xl border border-frost-border/70 bg-frost-surface shadow-2xl shadow-black/60">
            <Image
              src={
                coverUrl
              }
              alt={
                title
              }
              width={
                500
              }
              height={
                750
              }
              priority
              unoptimized={
                shouldUseOriginalImage(
                  coverUrl
                )
              }
              className="h-full w-full object-cover"
              style={{
                objectPosition:
                  `${coverPositionX}% ${coverPositionY}%`,

                transform:
                  `scale(${coverZoom})`,
              }}
            />
          </div>
        ) : (
          <div className="flex aspect-2/3 w-full flex-col items-center justify-center gap-3 rounded-xl border border-frost-border bg-frost-surface px-4 text-center text-frost-muted shadow-2xl">
            <ImageOff
              size={
                24
              }
            />

            <span className="text-xs">
              Sin portada
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 pb-1 sm:pb-3 lg:pb-4">
        <p className="frost-detail-text-10 font-semibold uppercase frost-detail-track-020 text-frost-muted">
          {
            eyebrow
          }
        </p>

        <h1 className="mt-2 max-w-4xl text-3xl font-bold tracking-tight text-frost-text sm:text-4xl frost-detail-lg-text-44 frost-detail-lg-leading-108">
          {
            title
          }
        </h1>

        {cleanMeta.length >
          0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-frost-muted">
            {cleanMeta.map(
              (
                value,
                index
              ) => (
                <div
                  key={`${value}-${index}`}
                  className="flex items-center gap-x-2"
                >
                  {index >
                    0 && (
                    <span className="text-frost-muted">
                      ·
                    </span>
                  )}

                  <span>
                    {
                      value
                    }
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {tags.length >
          0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map(
              (
                tag
              ) => (
                <span
                  key={
                    tag
                  }
                  className="rounded-full border border-frost-border bg-frost-surface/70 px-3 py-1.5 text-xs text-frost-muted"
                >
                  {
                    tag
                  }
                </span>
              )
            )}
          </div>
        )}

        {actions && (
          <div className="frost-detail-actions">
            {
              actions
            }
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="mx-auto frost-detail-width pb-24">
      <style>{`
        /* frost-media-detail-palette-v1 */
        .frost-detail-width { max-width: 1280px; }
        .frost-detail-description-width { max-width: 720px; }
        .frost-detail-cover-width { width: 155px; }
        .frost-detail-backdrop-height { height: 280px; }
        .frost-detail-side-gradient { width: 22%; }
        .frost-detail-bottom-gradient { height: 46%; }
        .frost-detail-actions > section { margin-top: 24px; }
        .frost-detail-text-10 { font-size: 10px; }
        .frost-detail-text-11 { font-size: 11px; }
        .frost-detail-text-15 { font-size: 15px; }
        .frost-detail-track-020 { letter-spacing: .2em; }
        .frost-detail-track-018 { letter-spacing: .18em; }
        .frost-detail-track-014 { letter-spacing: .14em; }
        @media (min-width: 640px) {
          .frost-detail-cover-width { width: 190px; }
          .frost-detail-backdrop-height { height: 360px; }
        }
        @media (min-width: 1024px) {
          .frost-detail-cover-width { width: 205px; }
          .frost-detail-backdrop-height { height: 470px; }
          .frost-detail-info-grid { grid-template-columns: minmax(0,1fr) 290px; }
          .frost-detail-lg-text-44 { font-size: 44px; }
          .frost-detail-lg-leading-108 { line-height: 1.08; }
        }
      `}</style>
      {heroMode ===
      "backdrop" ? (
        <section className="relative">
          <div className="relative frost-detail-backdrop-height overflow-hidden bg-frost-bg  ">
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
                sizes="(max-width: 1280px) 100vw, 1280px"
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
                    36
                  }
                />
              </div>
            )}

            <div className="pointer-events-none absolute inset-y-0 left-0 frost-detail-side-gradient bg-gradient-to-r from-frost-bg via-frost-bg/55 to-transparent" />

            <div className="pointer-events-none absolute inset-y-0 right-0 frost-detail-side-gradient bg-gradient-to-l from-frost-bg via-frost-bg/55 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 frost-detail-bottom-gradient bg-gradient-to-t from-frost-bg via-frost-bg/45 to-transparent" />
          </div>

          <div className="relative z-10 -mt-24 px-4 sm:-mt-32 sm:px-6 lg:-mt-36 lg:px-8">
            {
              heroContent
            }
          </div>
        </section>
      ) : (
        <section className="px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
          {
            heroContent
          }
        </section>
      )}

      <div
        className={`grid items-start gap-12 px-4 sm:px-6 frost-detail-info-grid lg:px-8 ${
          heroMode ===
          "compact"
            ? "mt-10"
            : "mt-12"
        }`}
      >
        <section className="min-w-0">
          <div className="border-b border-frost-border pb-3">
            <h2 className="frost-detail-text-11 font-semibold uppercase frost-detail-track-018 text-frost-muted">
              Sinopsis
            </h2>
          </div>

          <div className="mt-5 frost-detail-description-width">
            <p className="whitespace-pre-line frost-detail-text-15 leading-7 text-frost-muted">
              {description ||
                noDescriptionText}
            </p>
          </div>

          {mainContent && (
            <div className="mt-10">
              {
                mainContent
              }
            </div>
          )}
        </section>

        {information.length >
          0 && (
          <aside className="lg:border-l lg:border-frost-border lg:pl-8">
            <div className="border-b border-frost-border pb-3">
              <h2 className="frost-detail-text-11 font-semibold uppercase frost-detail-track-018 text-frost-muted">
                Información
              </h2>
            </div>

            <div className="mt-5 space-y-6">
              {information.map(
                (
                  item,
                  index
                ) => (
                  <InformationRow
                    key={`${item.label}-${index}`}
                    icon={
                      item.icon
                    }
                    label={
                      item.label
                    }
                  >
                    {
                      item.value
                    }
                  </InformationRow>
                )
              )}
            </div>
          </aside>
        )}
      </div>

      {bottomContent && (
        <div className="mt-12 px-4 sm:px-6 lg:px-8">
          {
            bottomContent
          }
        </div>
      )}
    </main>
  );
}

function InformationRow({
  icon,
  label,
  children,
}: {
  icon?:
    ReactNode;

  label:
    string;

  children:
    ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-frost-muted">
        {
          icon
        }

        <span className="frost-detail-text-10 font-semibold uppercase frost-detail-track-014">
          {
            label
          }
        </span>
      </div>

      <div className="mt-2 text-sm leading-6 text-frost-text">
        {
          children
        }
      </div>
    </div>
  );
}