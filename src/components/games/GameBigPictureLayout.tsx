import {
  CalendarDays,
  LogIn,
  Monitor,
  PencilLine,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import MediaBigPictureShell, {
  type BigPictureMediaItem,
  SectionTitle,
} from "@/components/media/MediaBigPictureShell";

import MediaRatings from "@/components/media/MediaRatings";

import type {
  MediaRatingStats,
} from "@/lib/media-ratings";

interface GameBigPictureLayoutProps {
  title: string;

  description:
    | string
    | null;

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

  galleryItems:
    BigPictureMediaItem[];

  year:
    | number
    | null;

  releaseDate:
    | string
    | null;

  platforms: string[];
  genres: string[];

  ratingStats:
    MediaRatingStats;

  actions?: ReactNode;

  /*
   * Reviews y cualquier contenido
   * que queramos mostrar al final
   * de toda la ficha.
   */
  mainContent?: ReactNode;

  developerActionHref?:
    | string
    | null;
}

/* =========================================================
   GUEST ACTIONS
========================================================= */

function GuestActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/auth?mode=login"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-fuchsia-500 px-4 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
      >
        <LogIn size={15} />

        Añadir a mi biblioteca
      </Link>

      <Link
        href="/auth?mode=register"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
      >
        <UserPlus size={15} />

        Crear cuenta
      </Link>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b border-white/8 py-3.5 last:border-b-0">
      <div className="mt-0.5 shrink-0 text-zinc-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </p>

        <div className="mt-1.5 text-sm leading-6 text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function GameBigPictureLayout({
  title,
  description,

  posterUrl,
  backdropUrl,

  posterPositionX = 50,
  posterPositionY = 50,
  posterZoom = 1,

  backdropPositionX = 50,
  backdropPositionY = 50,
  backdropZoom = 1,

  galleryItems,

  year,
  releaseDate,

  platforms,
  genres,

  ratingStats,

  actions,
  mainContent,

  developerActionHref = null,
}: GameBigPictureLayoutProps) {
  /* =======================================================
     DEV ACTION
  ======================================================= */

  const developerAction =
    developerActionHref ? (
      <Link
        href={developerActionHref}
        title="Editar arte"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-black/55 px-3 text-xs font-medium text-amber-300 backdrop-blur-md transition hover:bg-black/80"
      >
        <PencilLine
          size={14}
        />

        <span className="hidden sm:inline">
          Editar arte
        </span>
      </Link>
    ) : null;

  /* =======================================================
     PLATFORMS
  ======================================================= */

  const mobilePlatforms =
    platforms.slice(
      0,
      2,
    );

  const remainingMobilePlatforms =
    Math.max(
      0,
      platforms.length -
        mobilePlatforms.length,
    );

  const desktopPlatforms =
    platforms.slice(
      0,
      4,
    );

  const remainingDesktopPlatforms =
    Math.max(
      0,
      platforms.length -
        desktopPlatforms.length,
    );

  /* =======================================================
     META
  ======================================================= */

  const meta = (
    <>
      {/* MOBILE / TABLET */}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-zinc-400 lg:hidden">
        {year ? (
          <span className="text-zinc-300">
            {year}
          </span>
        ) : null}

        {year &&
        mobilePlatforms.length >
          0 ? (
          <span className="text-zinc-600">
            ·
          </span>
        ) : null}

        {mobilePlatforms.map(
          (
            platform,
            index,
          ) => (
            <span
              key={platform}
              className="text-zinc-300"
            >
              {platform}

              {index <
              mobilePlatforms.length -
                1 ? (
                <span className="ml-2 text-zinc-600">
                  ·
                </span>
              ) : null}
            </span>
          ),
        )}

        {remainingMobilePlatforms >
        0 ? (
          <>
            <span className="text-zinc-600">
              ·
            </span>

            <span className="font-medium text-zinc-500">
              +
              {
                remainingMobilePlatforms
              }
            </span>
          </>
        ) : null}
      </div>

      {/* DESKTOP */}

      <div className="hidden flex-wrap items-center gap-x-3 gap-y-2 text-sm lg:flex">
        {year ? (
          <span className="text-zinc-300">
            {year}
          </span>
        ) : null}

        {year &&
        desktopPlatforms.length >
          0 ? (
          <span className="text-zinc-600">
            ·
          </span>
        ) : null}

        {desktopPlatforms.map(
          (
            platform,
            index,
          ) => (
            <span
              key={platform}
              className="text-zinc-300"
            >
              {platform}

              {index <
              desktopPlatforms.length -
                1 ? (
                <span className="ml-3 text-zinc-600">
                  ·
                </span>
              ) : null}
            </span>
          ),
        )}

        {remainingDesktopPlatforms >
        0 ? (
          <>
            <span className="text-zinc-600">
              ·
            </span>

            <span className="text-zinc-500">
              +
              {
                remainingDesktopPlatforms
              }
            </span>
          </>
        ) : null}
      </div>
    </>
  );

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const sidebar = (
    <div className="space-y-5">
      <section>
        <SectionTitle>
          Información
        </SectionTitle>

        <div className="mt-1">
          {releaseDate ? (
            <InfoRow
              icon={
                <CalendarDays
                  size={15}
                />
              }
              label="Lanzamiento"
            >
              {releaseDate}
            </InfoRow>
          ) : null}

          {platforms.length >
          0 ? (
            <InfoRow
              icon={
                <Monitor
                  size={15}
                />
              }
              label="Plataformas"
            >
              <div className="flex flex-wrap gap-1.5">
                {platforms.map(
                  (
                    platform,
                  ) => (
                    <span
                      key={
                        platform
                      }
                      className="rounded-md bg-white/[0.045] px-2 py-1 text-xs text-zinc-300"
                    >
                      {
                        platform
                      }
                    </span>
                  ),
                )}
              </div>
            </InfoRow>
          ) : null}
        </div>
      </section>

      {genres.length >
      0 ? (
        <section>
          <SectionTitle>
            Géneros
          </SectionTitle>

          <div className="mt-4 flex flex-wrap gap-2">
            {genres.map(
              (
                genre,
              ) => (
                <span
                  key={genre}
                  className="rounded-full bg-white/[0.045] px-3 py-1.5 text-xs text-zinc-300"
                >
                  {genre}
                </span>
              ),
            )}
          </div>
        </section>
      ) : null}
    </div>
  );

  /* =======================================================
     ACTIONS + RATINGS
  ======================================================= */

  const actionContent = (
    <>
      {actions ?? (
        <GuestActions />
      )}

      <MediaRatings
        stats={
          ratingStats
        }
      />
    </>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-black">
      <MediaBigPictureShell
        eyebrow="Juego"
        title={title}
        posterUrl={
          posterUrl
        }
        backdropUrl={
          backdropUrl
        }
        posterPositionX={
          posterPositionX
        }
        posterPositionY={
          posterPositionY
        }
        posterZoom={
          posterZoom
        }
        backdropPositionX={
          backdropPositionX
        }
        backdropPositionY={
          backdropPositionY
        }
        backdropZoom={
          backdropZoom
        }
        posterSize="large"
        meta={meta}
        developerAction={
          developerAction
        }
        actions={
          actionContent
        }
        descriptionTitle="Acerca del juego"
        description={
          description
        }
        galleryItems={
          galleryItems
        }
        sidebar={
          sidebar
        }
      />

      {/* ==================================================
          REVIEWS
          
          Van al final de toda la ficha.
          El margen negativo compensa el padding inferior
          que ya deja MediaBigPictureShell.
      ================================================== */}

      {mainContent ? (
        <section className="-mt-10 bg-black pb-12 sm:-mt-12 lg:-mt-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {mainContent}
          </div>
        </section>
      ) : null}
    </div>
  );
}