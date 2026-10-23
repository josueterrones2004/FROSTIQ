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

  /* =========================================
     INFORMACIÓN CONTEXTUAL
  ========================================= */

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
    <div className="relative isolate overflow-hidden rounded-t-[24px] bg-[#202a37]">
      {/* FONDO: HERO VISIBLE, LIGERAMENTE DIFUMINADO */}

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
            className={`object-cover opacity-90 ${
              hasBackdrop
                ? "blur-[5px]"
                : "blur-[8px]"
            }`}
            style={{
              objectPosition: backgroundPosition,
              transform: `scale(${backgroundZoom})`,
            }}
          />
        </div>
      )}

      {/* DEGRADADO PARA CONSERVAR LEGIBILIDAD */}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#101720]/40 via-[#101720]/45 to-[#101720]/75" />

      {/* CABECERA: PORTADA + CONTENIDO */}

      <div className="relative z-10 grid grid-cols-[minmax(100px,35%)_minmax(0,1fr)] items-center gap-3 p-3">
        {/* PORTADA ORIGINAL SIN MARCO */}

        <Link
          href={hrefOf(item)}
          aria-label={`Abrir ficha de ${item.title}`}
          className="relative block aspect-[2/3] w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-violet-300"
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
            <span className="flex h-full items-center justify-center bg-zinc-900/65 text-zinc-400">
              <ImageOff
                size={26}
                aria-hidden="true"
              />
            </span>
          )}
        </Link>

        {/* DATOS DEL MEDIO */}

        <div className="flex min-w-0 flex-col justify-center gap-4 py-1">
          <h2
            className="line-clamp-3 break-words text-[19px] font-bold leading-[1.2] tracking-tight text-white drop-shadow-md"
            title={item.title}
          >
            {item.title}
          </h2>

          {/* MÉTRICAS COMPACTAS:
              LA PRIMERA CRECE Y LA SEGUNDA
              OCUPA SOLO SU ESPACIO */}

          <div className="flex min-w-0 items-start gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[11px] font-medium leading-4 text-zinc-300">
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
                  <p className="text-[13px] font-semibold leading-5 text-white">
                    Sin puntuación
                  </p>
                )
              ) : watchingSeries ? (
                <MobileMarqueeText
                  text={firstValue}
                />
              ) : (
                <p
                  className="line-clamp-2 text-[13px] font-semibold leading-5 text-white"
                  title={firstValue}
                >
                  {firstValue}
                </p>
              )}
            </div>

            <div className="w-[72px] shrink-0">
              <p className="mb-1 whitespace-nowrap text-[11px] font-medium leading-4 text-zinc-300">
                {secondLabel}
              </p>

              <p className="whitespace-nowrap text-[13px] font-semibold leading-5 text-white">
                {secondValue}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}