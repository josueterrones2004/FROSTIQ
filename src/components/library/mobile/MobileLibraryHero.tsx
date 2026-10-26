"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import StarRating from "@/components/media/StarRating";
import { shouldUseOriginalImage } from "@/lib/image-optimization";

import {
  dateLabel,
  hrefOf,
  labelOf,
  type CompletedReview,
  type LibraryEntry,
} from "../libraryShared";

import MobileMarqueeText from "./MobileMarqueeText";

type Props = {
  item: LibraryEntry;
  review?: CompletedReview;
};

function formatDate(
  value?: string | null,
): string {
  return dateLabel(value) || "—";
}

export default function MobileLibraryHero({
  item,
  review,
}: Props) {
  const hasBackdrop = Boolean(item.backdropUrl);

  const background =
    item.backdropUrl || item.coverUrl;

  const completed =
    item.status === null &&
    item.completedCount > 0;

  const inProgress =
    item.status === "IN_PROGRESS";

  const watchingSeries =
    item.mediaType === "SERIES" &&
    inProgress;

  const readingPages =
    item.mediaType === "BOOK" &&
    inProgress &&
    Boolean(item.bookProgress?.totalPages);

  /* INFORMACIÓN CONTEXTUAL */

  const firstLabel = completed
    ? "Tu calificación"
    : watchingSeries
      ? "Siguiente"
      : readingPages
        ? "Página"
        : "Estado";

  const firstValue = watchingSeries
    ? item.nextEpisode || "Al día"
    : readingPages
      ? `${item.bookProgress?.pagesRead ?? 0} de ${item.bookProgress?.totalPages ?? 0}`
      : labelOf(item);

  const secondLabel = completed
    ? "Registrada"
    : inProgress || item.status === "DROPPED"
      ? "Actualizado"
      : "Agregado";

  const secondValue = completed
    ? formatDate(
        review?.createdAt ?? item.updatedAt,
      )
    : inProgress || item.status === "DROPPED"
      ? formatDate(item.updatedAt)
      : formatDate(item.addedAt);

  const backgroundPosition = hasBackdrop
    ? `${item.backdropPositionX ?? 50}% ${item.backdropPositionY ?? 50}%`
    : `${item.posterPositionX ?? 50}% ${item.posterPositionY ?? 50}%`;

  const backgroundZoom = Math.max(
    hasBackdrop ? 1.09 : 1.15,
    hasBackdrop
      ? item.backdropZoom ?? 1
      : item.posterZoom ?? 1,
  );

  return (
    <div
      className="relative isolate overflow-hidden rounded-t-3xl bg-frost-raised"
      style={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      {/* FONDO DIFUMINADO */}

      {background && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src={background}
            alt=""
            fill
            sizes="100vw"
            loading="lazy"
            unoptimized={shouldUseOriginalImage(
              background,
            )}
            className="object-cover opacity-90"
            style={{
              filter: hasBackdrop
                ? "blur(5px)"
                : "blur(8px)",
              objectPosition: backgroundPosition,
              transform: `scale(${backgroundZoom})`,
            }}
          />
        </div>
      )}

      {/* DEGRADADO COBALT INK */}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(5,7,11,0.4), rgba(5,7,11,0.45), rgba(5,7,11,0.75))",
        }}
      />

      {/* PORTADA E INFORMACIÓN */}

      <div
        className="relative z-10 grid items-center gap-3 px-5 py-4"
        style={{
          gridTemplateColumns:
            "minmax(90px, 32%) minmax(0, 1fr)",
        }}
      >
        <Link
          href={hrefOf(item)}
          aria-label={`Abrir ficha de ${item.title}`}
          className="relative block aspect-2/3 w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-frost-accent"
        >
          {item.coverUrl ? (
            <Image
              src={item.coverUrl}
              alt={item.title}
              fill
              sizes="(max-width: 400px) 36vw, 145px"
              loading="lazy"
              unoptimized={shouldUseOriginalImage(
                item.coverUrl,
              )}
              className="object-cover"
              style={{
                objectPosition:
                  `${item.posterPositionX ?? 50}% ` +
                  `${item.posterPositionY ?? 50}%`,
                transform: `scale(${item.posterZoom ?? 1})`,
              }}
            />
          ) : (
            <span className="flex h-full items-center justify-center bg-frost-surface/65 text-frost-muted">
              <ImageOff
                size={26}
                aria-hidden="true"
              />
            </span>
          )}
        </Link>

        {/* DATOS DEL MEDIO */}

        <div className="flex min-w-0 flex-col justify-center gap-3 py-1">
          <h2
            className="line-clamp-3 wrap-break-words font-bold tracking-tight text-frost-text drop-shadow-md"
            style={{
              fontSize: 19,
              lineHeight: 1.2,
            }}
            title={item.title}
          >
            {item.title}
          </h2>

          {/* MÉTRICAS CON SU DISTRIBUCIÓN ORIGINAL */}

          <div
            className="grid max-w-full items-start gap-x-5"
            style={{
              width: 214,
              gridTemplateColumns: "126px 68px",
            }}
          >
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium leading-4 text-frost-muted" style={{ fontSize: 11 }}>
                {firstLabel}
              </p>

              {completed ? (
                review?.review.rating != null &&
                review.review.rating > 0 ? (
                  <StarRating
                    value={review.review.rating}
                    readonly
                    showLabel={false}
                    size={14}
                  />
                ) : (
                  <p
                    className="font-semibold leading-5 text-frost-text"
                    style={{ fontSize: 13 }}
                  >
                    Sin puntuación
                  </p>
                )
              ) : watchingSeries ? (
                <MobileMarqueeText
                  text={firstValue}
                />
              ) : (
                <p
                  className="line-clamp-2 font-semibold leading-5 text-frost-text"
                  style={{ fontSize: 13 }}
                  title={firstValue}
                >
                  {firstValue}
                </p>
              )}
            </div>

            <div className="min-w-0">
              <p
                className="mb-1 whitespace-nowrap font-medium leading-4 text-frost-muted"
                style={{ fontSize: 11 }}
              >
                {secondLabel}
              </p>

              <p
                className="whitespace-nowrap font-semibold leading-5 text-frost-text"
                style={{ fontSize: 13 }}
              >
                {secondValue}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}