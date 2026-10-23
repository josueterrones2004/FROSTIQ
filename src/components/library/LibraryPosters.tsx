"use client";

import Image from "next/image";
import Link from "next/link";

import {
  CircleOff,
  Clock3,
  Library,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import LibraryReviewModalCard from "@/components/media/LibraryReviewModalCard";
import StarRating from "@/components/media/StarRating";
import { shouldUseOriginalImage } from "@/lib/image-optimization";

import {
  hrefOf,
  labelOf,
  resumeLabel,
  type Actions,
  type CompletedReview,
  type LibraryEntry,
  type View,
} from "./libraryShared";

/* =========================================
   PORTADA
========================================= */

function Poster({
  item,
  eager = false,
}: {
  item: LibraryEntry;
  eager?: boolean;
}) {
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-[13px] bg-zinc-900">
      {item.coverUrl ? (
        <div className="absolute inset-0 overflow-hidden">
          <div className="relative h-full w-full transition-transform duration-[400ms] group-hover:scale-[1.075] motion-reduce:transition-none">
            <Image
              src={item.coverUrl}
              alt={item.title}
              fill
              sizes="(max-width:640px) 46vw, (max-width:1024px) 25vw, 180px"
              loading={eager ? "eager" : "lazy"}
              unoptimized={
                shouldUseOriginalImage(item.coverUrl)
              }
              className="object-cover"
              style={{
                objectPosition:
                  `${item.posterPositionX ?? 50}% ` +
                  `${item.posterPositionY ?? 50}%`,
                transform:
                  `scale(${item.posterZoom ?? 1})`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex h-full items-center justify-center text-zinc-600">
          <Library size={28} />
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[13px] border-[5px] border-transparent transition-colors duration-200 group-hover:border-violet-300/85 group-focus-within:border-violet-300/85"
      />

      <Link
        href={hrefOf(item)}
        aria-label={`Abrir ${item.title}`}
        className="absolute inset-0 z-10"
      />
    </div>
  );
}

/* =========================================
   TÍTULO HOVER
========================================= */

function TitleTip({
  title,
}: {
  title: string;
}) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[min(340px,calc(100vw-32px))] -translate-x-1/2 translate-y-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
      <div className="relative rounded-lg border border-violet-300/40 bg-[#252d3e] px-3 py-2 text-center text-[13px] font-bold leading-snug text-zinc-100 shadow-xl">
        {title}

        <span className="absolute left-1/2 top-full h-[10px] w-[10px] -translate-x-1/2 -translate-y-[5px] rotate-45 border-b border-r border-violet-300/40 bg-[#252d3e]" />
      </div>
    </div>
  );
}

/* =========================================
   ETIQUETA COMPACTA
========================================= */

function Pill({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2">
      <div className="flex min-h-10 w-max items-center justify-center whitespace-nowrap rounded-xl border border-white/20 bg-[#2c3446] px-3 py-1.5 text-sm font-semibold text-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

/* =========================================
   ETIQUETA COMPLETADO
========================================= */

function RatingPill({
  rating,
}: {
  rating: number | null;
}) {
  if (rating === null || rating <= 0) {
    return <Pill>Completado</Pill>;
  }

  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2">
      <div className="relative flex h-10 w-max items-center justify-center rounded-xl border border-white/20 bg-[#2c3446] px-3 shadow-xl transition-[width] duration-200 group-hover:w-[132px] group-focus-within:w-[132px]">
        <span className="whitespace-nowrap text-sm font-semibold text-white transition-opacity duration-200 group-hover:opacity-0 group-focus-within:opacity-0">
          Completado
        </span>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <StarRating
            value={rating}
            readonly
            size={20}
            showLabel={false}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================
   ACCIONES DE LAS PORTADAS
========================================= */

type PosterAction = {
  key: string;
  label: string;
  icon: typeof Star;
  run: () => void;
  color: string;
};

function StatusPill({
  item,
  view,
  actions,
  busy,
}: {
  item: LibraryEntry;
  view: View;
  actions: Actions;
  busy: boolean;
}) {
  const dropped =
    item.status === "DROPPED";

  const label = labelOf(item);

  const canRegisterProgress =
    item.mediaType === "SERIES" ||
    item.mediaType === "BOOK";

  const buttons: PosterAction[] = [
    {
      key: "rate",
      label:
        item.completedCount > 0
          ? "Registrar otra review"
          : "Ratear",
      icon: Star,
      run: () => actions.rate(item),
      color: "hover:text-amber-300",
    },

    ...(canRegisterProgress
      ? [
          {
            key: "progress",
            label: "Registrar avance",
            icon: Clock3,
            run: () => actions.progress(item),
            color: "hover:text-sky-300",
          },
        ]
      : []),

    {
      key: "status",
      label: dropped
        ? resumeLabel(item.mediaType)
        : "Marcar como abandonado",
      icon: dropped
        ? RotateCcw
        : CircleOff,
      run: () =>
        actions.status(
          item,
          dropped
            ? "IN_PROGRESS"
            : "DROPPED",
        ),
      color: "hover:text-violet-300",
    },

    {
      key: "remove",
      label: "Eliminar de la biblioteca",
      icon: Trash2,
      run: () => actions.remove(item),
      color: "hover:text-red-400",
    },
  ];

  const hoverWidth =
    buttons.length * 39 + 12;

  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2">
      <div
        style={
          {
            "--hover-width":
              `${hoverWidth}px`,
          } as CSSProperties
        }
        className={`relative flex h-10 w-max items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-[#2c3446] shadow-xl transition-[width,opacity] duration-200 group-hover:w-[var(--hover-width)] group-focus-within:w-[var(--hover-width)] ${
          view === "ALL"
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        }`}
      >
        {/* ETIQUETA EN REPOSO */}

        <span className="whitespace-nowrap px-3 text-sm font-semibold text-white transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0">
          {label}
        </span>

        {/* ACCIONES HOVER */}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          {buttons.map(
            ({
              key,
              label: actionLabel,
              icon: Icon,
              run,
              color,
            }) => (
              <button
                key={key}
                type="button"
                title={actionLabel}
                aria-label={`${actionLabel}: ${item.title}`}
                disabled={busy}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  run();
                }}
                className={`flex h-9 w-[37px] shrink-0 items-center justify-center rounded-lg text-zinc-200 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-40 ${color}`}
              >
                <Icon size={19} />
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================
   PORTADA DE BIBLIOTECA
========================================= */

export function LibraryPoster({
  item,
  view,
  review,
  actions,
  busy,
  eager = false,
}: {
  item: LibraryEntry;
  view: View;
  review?: CompletedReview;
  actions: Actions;
  busy: boolean;
  eager?: boolean;
}) {
  const completed =
    item.status === null &&
    item.completedCount > 0;

  return (
    <article className="group relative z-0 min-w-0 pb-6 hover:z-40 focus-within:z-40">
      <TitleTip
        title={`${item.title}${
          item.releaseYear
            ? ` (${item.releaseYear})`
            : ""
        }`}
      />

      <div className="relative">
        <Poster
          item={item}
          eager={eager}
        />

        {item.status !== null ? (
          <StatusPill
            item={item}
            view={view}
            actions={actions}
            busy={busy}
          />
        ) : view === "ALL" && completed ? (
          <RatingPill
            rating={
              review?.review.rating ?? null
            }
          />
        ) : view === "ALL" ? (
          <Pill>{labelOf(item)}</Pill>
        ) : null}
      </div>
    </article>
  );
}

/* =========================================
   PORTADAS DE REVIEWS
========================================= */

export function ReviewPoster({
  item,
}: {
  item: CompletedReview;
}) {
  return (
    <article className="group relative z-0 min-w-0 pb-6 hover:z-40 focus-within:z-40">
      <TitleTip
        title={`${item.review.title}${
          item.review.release_year
            ? ` (${item.review.release_year})`
            : ""
        }`}
      />

      <div className="relative">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[13px] bg-zinc-900">
          <div className="relative h-full w-full transition-transform duration-[400ms] group-hover:scale-[1.075]">
            <LibraryReviewModalCard
              mode="saved"
              mediaType={item.mediaType}
              review={item.review}
              coverOnly
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[13px] border-[5px] border-transparent transition-colors duration-200 group-hover:border-violet-300/85"
          />
        </div>

        {item.review.rating !== null &&
          item.review.rating > 0 && (
            <Pill>
              <StarRating
                value={item.review.rating}
                readonly
                size={18}
                showLabel={false}
              />
            </Pill>
          )}
      </div>
    </article>
  );
}