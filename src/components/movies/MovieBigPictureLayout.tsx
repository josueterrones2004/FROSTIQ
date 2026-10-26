import {
  CalendarDays,
  Clock3,
  Languages,
  LogIn,
  PencilLine,
  UserPlus,
} from "lucide-react";

import Link from "next/link";
import type {
  ReactNode,
} from "react";

import MediaBigPictureShell, {
  SectionTitle,
} from "@/components/media/MediaBigPictureShell";

import MediaRatings from "@/components/media/MediaRatings";

import MediaReviews, {
  type MediaReviewItem,
} from "@/components/media/MediaReviews";

import MovieInfoTabs, {
  type MovieCastMember,
  type MovieCrewMember,
  type MovieDetailsInfo,
} from "@/components/movies/MovieInfoTabs";

import type {
  MediaRatingStats,
} from "@/lib/media-ratings";

interface MovieBigPictureLayoutProps {
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

  year:
    | number
    | null;

  releaseDate:
    | string
    | null;

  runtime:
    | number
    | null;

  originalTitle:
    | string
    | null;

  genres: string[];

  ratingStats:
    MediaRatingStats;

  cast:
    MovieCastMember[];

  crew:
    MovieCrewMember[];

  details:
    MovieDetailsInfo;

  friendReviews:
    MediaReviewItem[];

  reviews:
    MediaReviewItem[];

  actions?: ReactNode;

  developerActionHref?:
    | string
    | null;
}

function GuestActions() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Link
        href="/auth?mode=login"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-frost-accent/15 px-4 text-sm font-medium text-frost-accent transition hover:bg-frost-accent/25 sm:w-auto"
      >
        <LogIn
          size={15}
        />

        Marcar como vista
      </Link>

      <Link
        href="/auth?mode=register"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-frost-raised/20 px-4 text-sm font-medium text-frost-muted transition hover:bg-frost-raised/40 hover:text-frost-text sm:w-auto"
      >
        <UserPlus
          size={15}
        />

        Ver después
      </Link>
    </div>
  );
}

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
    <div className="flex gap-3 border-b border-frost-border/80 py-3.5 last:border-b-0">
      <div className="mt-0.5 shrink-0 text-frost-muted">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold uppercase text-frost-muted" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
          {label}
        </p>

        <div className="mt-1.5 text-sm leading-6 text-frost-text">
          {children}
        </div>
      </div>
    </div>
  );
}

function formatRuntime(
  runtime: number,
) {
  const hours =
    Math.floor(
      runtime / 60,
    );

  const minutes =
    runtime % 60;

  if (
    hours <= 0
  ) {
    return `${minutes} min`;
  }

  if (
    minutes === 0
  ) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

export default function MovieBigPictureLayout({
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

  year,
  releaseDate,
  runtime,
  originalTitle,

  genres,

  ratingStats,

  cast,
  crew,
  details,

  friendReviews,
  reviews,

  actions,

  developerActionHref = null,
}: MovieBigPictureLayoutProps) {
  const developerAction =
    developerActionHref ? (
      <Link
        href={
          developerActionHref
        }
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

  const meta = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-frost-muted sm:text-sm">
      {year ? (
        <span className="text-frost-text">
          {year}
        </span>
      ) : null}

      {year &&
      runtime ? (
        <span className="text-frost-muted">
          ·
        </span>
      ) : null}

      {runtime ? (
        <span className="text-frost-text">
          {formatRuntime(
            runtime,
          )}
        </span>
      ) : null}
    </div>
  );

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
              label="Estreno"
            >
              {releaseDate}
            </InfoRow>
          ) : null}

          {runtime ? (
            <InfoRow
              icon={
                <Clock3
                  size={15}
                />
              }
              label="Duración"
            >
              {formatRuntime(
                runtime,
              )}
            </InfoRow>
          ) : null}

          {originalTitle ? (
            <InfoRow
              icon={
                <Languages
                  size={15}
                />
              }
              label="Título original"
            >
              <span className="break-words">
                {
                  originalTitle
                }
              </span>
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
              (genre) => (
                <span
                  key={
                    genre
                  }
                  className="rounded-full bg-frost-raised/25 px-3 py-1.5 text-xs text-frost-text"
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

  const actionContent = (
    <>
      {actions ??
        <GuestActions />}

      {/* MOBILE */}

      <div className="lg:hidden">
        <MediaRatings
          stats={
            ratingStats
          }
        />
      </div>

      {/* DESKTOP */}

      <div className="mt-7 hidden gap-12 lg:grid" style={{ gridTemplateColumns: "minmax(0,1fr) 310px" }}>
        <MovieInfoTabs
          cast={
            cast
          }
          crew={
            crew
          }
          details={
            details
          }
          compact
        />

        <MediaRatings
          stats={
            ratingStats
          }
        />
      </div>
    </>
  );

  const desktopReviews = (
    <div className="hidden lg:block">
      <MediaReviews
        friendReviews={
          friendReviews
        }
        reviews={
          reviews
        }
        mediaTitle={
          title
        }
        mediaYear={
          year
        }
        mediaPosterUrl={
          posterUrl
        }
        mediaTypeLabel="Película"
      />
    </div>
  );

  const mobileBottomContent = (
    <div className="space-y-5 lg:hidden">
      <MovieInfoTabs
        cast={
          cast
        }
        crew={
          crew
        }
        details={
          details
        }
      />

      <MediaReviews
        friendReviews={
          friendReviews
        }
        reviews={
          reviews
        }
        mediaTitle={
          title
        }
        mediaYear={
          year
        }
        mediaPosterUrl={
          posterUrl
        }
        mediaTypeLabel="Película"
      />
    </div>
  );

  return (
    <MediaBigPictureShell
      eyebrow="Película"
      title={
        title
      }
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
      meta={
        meta
      }
      developerAction={
        developerAction
      }
      actions={
        actionContent
      }
      descriptionTitle="Sinopsis"
      description={
        description
      }
      galleryItems={[]}
      sidebar={
        sidebar
      }
      mainContent={
        desktopReviews
      }
      bottomContent={
        mobileBottomContent
      }
    />
  );
}