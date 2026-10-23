"use client";

import {
  ArrowLeft,
  BookOpen,
  Eye,
  Gamepad2,
  Heart,
  HeartCrack,
  Loader2,
  Pencil,
  Repeat2,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

import StarRating from "@/components/media/StarRating";
import { shouldUseOriginalImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";

export type MediaType = "MOVIE" | "SERIES" | "GAME" | "BOOK";

export type LibraryReview = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  cover_position_x?: number;
  cover_position_y?: number;
  cover_zoom?: number;
  release_year: number | null;
  rating: number | null;
  liked: boolean;
  is_rewatch: boolean;
  contains_spoilers: boolean;
  show_consumed_date?: boolean | null;
  consumed_at: string;
  review_text: string | null;
};

export type ReviewDraft = {
  reviewText: string;
  rating: number | null;
  liked: boolean;
  isRepeat: boolean;
  containsSpoilers: boolean;
  showConsumedDate: boolean;
};

type SavedProps = {
  mode?: "saved";
  review: LibraryReview;
  mediaType: MediaType;

  // Permite mostrar solo la portada en Biblioteca.
  coverOnly?: boolean;
};

type CreateProps = {
  mode: "create";
  open: boolean;
  mediaType: MediaType;
  title: string;
  releaseYear?: number | string | null;
  coverUrl?: string | null;
  initialRepeat?: boolean;
  loading?: boolean;
  message?: string | null;
  onClose: () => void;
  onSave: (draft: ReviewDraft) => void | Promise<void>;
};

function getToday() {
  const now = new Date();

  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(
    new Date(`${date.slice(0, 10)}T12:00:00`),
  );
}

function getDateLabel(type: MediaType) {
  if (type === "GAME") return "Completado el";
  if (type === "BOOK") return "Leído el";
  return "Vista el";
}

function getMediaLabel(type: MediaType) {
  if (type === "MOVIE") return "Película vista";
  if (type === "SERIES") return "Serie vista";
  if (type === "GAME") return "Juego completado";
  return "Libro leído";
}

function getRepeatLabel(type: MediaType, active: boolean) {
  if (type === "GAME") {
    return active ? "Replay" : "Primera partida";
  }

  if (type === "BOOK") {
    return active ? "Relectura" : "Primera lectura";
  }

  return active ? "Rewatch" : "Primera vez";
}

function getExperience(type: MediaType, repeat: boolean) {
  if (!repeat) return "FIRST_TIME";
  if (type === "GAME") return "REPLAY";
  if (type === "BOOK") return "REREAD";
  return "REWATCH";
}

function getMediaRoute(type: MediaType, id: string) {
  if (type === "MOVIE") return `/movies/${id}`;
  if (type === "SERIES") return `/series/${id}`;
  if (type === "GAME") return `/games/${id}`;
  return `/books/${id}`;
}

function ReviewCover({
  title,
  coverUrl,
  positionX = 50,
  positionY = 50,
  zoom = 1,
}: {
  title: string;
  coverUrl: string | null;
  positionX?: number;
  positionY?: number;
  zoom?: number;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900">
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          sizes="(max-width: 1023px) 96px, 168px"
          unoptimized={shouldUseOriginalImage(coverUrl)}
          className="object-cover"
          style={{
            objectPosition: `${positionX}% ${positionY}%`,
            transform: `scale(${zoom})`,
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
          Sin imagen
        </div>
      )}
    </div>
  );
}

function AnimatedEye({ active }: { active: boolean }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      <path
        d="M4 4 20 20"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: active ? 1 : 0,
          transition:
            "stroke-dashoffset 350ms cubic-bezier(.4,0,.2,1)",
        }}
      />
    </svg>
  );
}

function AnimatedShield({ active }: { active: boolean }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" />
      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        pathLength="1"
        style={{
          opacity: active ? 0 : 1,
          strokeDasharray: 1,
          strokeDashoffset: active ? 1 : 0,
          transform: active ? "scale(.75)" : "scale(1)",
          transformOrigin: "center",
          transition:
            "opacity 180ms ease, stroke-dashoffset 300ms ease, transform 250ms ease",
        }}
      />
      <g
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(.75)",
          transformOrigin: "center",
          transition:
            "opacity 220ms ease, transform 300ms ease",
        }}
      >
        <path d="M12 8v5" />
        <path d="M12 16.4h.01" />
      </g>
    </svg>
  );
}

function AnimatedHeart({
  active,
  burst,
}: {
  active: boolean;
  burst: number;
}) {
  const heart =
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z";

  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="overflow-visible"
    >
      {active && burst > 0 && (
        <g key={burst}>
          <circle
            cx="20"
            cy="20"
            r="11"
            fill="none"
            stroke="#f472b6"
            strokeWidth="3"
            className="mt-heart-ring"
          />
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * Math.PI) / 4;

            return (
              <circle
                key={i}
                cx={20 + Math.cos(angle) * 14}
                cy={20 + Math.sin(angle) * 14}
                r={i % 2 ? 1.4 : 1.9}
                fill={i % 2 ? "#f472b6" : "#fb7185"}
                className="mt-heart-spark"
                style={{
                  animationDelay: `${i * 16}ms`,
                }}
              />
            );
          })}
        </g>
      )}
      <g transform="translate(8 8)">
        <path
          d={heart}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d={heart}
          fill="currentColor"
          style={{
            clipPath: active
              ? "inset(0 0 0 0)"
              : "inset(100% 0 0 0)",
            transition: "clip-path 280ms ease-out",
          }}
        />
      </g>
    </svg>
  );
}

function CreateOptions({
  mediaType,
  liked,
  isRepeat,
  containsSpoilers,
  disabled,
  onLikedChange,
  onRepeatChange,
  onSpoilersChange,
}: {
  mediaType: MediaType;
  liked: boolean;
  isRepeat: boolean;
  containsSpoilers: boolean;
  disabled: boolean;
  onLikedChange: () => void;
  onRepeatChange: () => void;
  onSpoilersChange: () => void;
}) {
  const [heartBurst, setHeartBurst] = useState(0);

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={isRepeat}
        onClick={onRepeatChange}
        className={`flex min-w-0 flex-col items-center justify-center gap-1 py-1.5 text-center transition-colors disabled:opacity-50 ${
          isRepeat ? "text-fuchsia-400" : "text-zinc-400"
        }`}
      >
        {mediaType === "MOVIE" ||
        mediaType === "SERIES" ? (
          <AnimatedEye active={isRepeat} />
        ) : mediaType === "GAME" ? (
          <Gamepad2 size={34} />
        ) : (
          <BookOpen size={34} />
        )}

        <span className="text-[11px] leading-4 sm:text-xs">
          {getRepeatLabel(mediaType, isRepeat)}
        </span>
      </button>

      <button
        type="button"
        disabled={disabled}
        aria-pressed={containsSpoilers}
        onClick={onSpoilersChange}
        className={`flex min-w-0 flex-col items-center justify-center gap-1 py-1.5 text-center transition-colors disabled:opacity-50 ${
          containsSpoilers
            ? "text-fuchsia-400"
            : "text-zinc-400"
        }`}
      >
        <AnimatedShield active={containsSpoilers} />

        <span className="text-[11px] leading-4 sm:text-xs">
          {containsSpoilers
            ? "Contiene spoilers"
            : "Sin spoilers"}
        </span>
      </button>

      <button
        type="button"
        disabled={disabled}
        aria-pressed={liked}
        onClick={() => {
          if (!liked) {
            setHeartBurst((n) => n + 1);
          }

          onLikedChange();
        }}
        className={`flex min-w-0 flex-col items-center justify-center gap-1 py-1.5 text-center transition-colors disabled:opacity-50 ${
          liked ? "text-red-500" : "text-zinc-400"
        }`}
      >
        <AnimatedHeart
          active={liked}
          burst={heartBurst}
        />

        <span className="text-[11px] leading-4 sm:text-xs">
          {liked ? "Me gustó" : "No me gustó"}
        </span>
      </button>
    </div>
  );
}

function OptionButton({
  active,
  disabled = false,
  onClick,
  icon,
  label,
  tone = "fuchsia",
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  tone?: "fuchsia" | "amber" | "red";
}) {
  const styles = {
    fuchsia:
      "border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-300",
    amber:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
    red:
      "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-1 py-3 text-center transition ${
        active
          ? styles[tone]
          : "border-white/10 bg-white/[0.025] text-zinc-500 enabled:hover:bg-white/[0.05] enabled:hover:text-zinc-300"
      } disabled:cursor-default`}
    >
      {icon}
      <span className="text-[10px] font-medium sm:text-xs">
        {label}
      </span>
    </button>
  );
}

function ReviewOptions({
  mediaType,
  liked,
  isRepeat,
  containsSpoilers,
  disabled = false,
  onLikedChange,
  onRepeatChange,
  onSpoilersChange,
}: {
  mediaType: MediaType;
  liked: boolean;
  isRepeat: boolean;
  containsSpoilers: boolean;
  disabled?: boolean;
  onLikedChange?: () => void;
  onRepeatChange?: () => void;
  onSpoilersChange?: () => void;
}) {
  const RepeatIcon = isRepeat
    ? Repeat2
    : mediaType === "BOOK"
      ? BookOpen
      : mediaType === "GAME"
        ? Gamepad2
        : Eye;

  return (
    <div className="grid grid-cols-3 gap-2">
      <OptionButton
        active={isRepeat}
        disabled={disabled}
        onClick={onRepeatChange}
        icon={<RepeatIcon size={19} />}
        label={getRepeatLabel(mediaType, isRepeat)}
      />

      <OptionButton
        active={containsSpoilers}
        disabled={disabled}
        onClick={onSpoilersChange}
        tone="amber"
        icon={
          containsSpoilers ? (
            <ShieldAlert size={19} />
          ) : (
            <ShieldCheck size={19} />
          )
        }
        label={
          containsSpoilers
            ? "Con spoilers"
            : "Sin spoilers"
        }
      />

      <OptionButton
        active={liked}
        disabled={disabled}
        onClick={onLikedChange}
        tone="red"
        icon={
          <Heart
            size={19}
            fill={liked ? "currentColor" : "none"}
          />
        }
        label={liked ? "Me gustó" : "No me gustó"}
      />
    </div>
  );
}

export default function LibraryReviewModalCard(
  props: SavedProps | CreateProps,
) {
  if (props.mode === "create") {
    if (!props.open) return null;
    return <CreateReviewForm {...props} />;
  }

  return <SavedReviewCard {...props} />;
}

/* =========================================================
   CREATE REVIEW FORM
========================================================= */

function CreateReviewForm({
  mediaType,
  title,
  releaseYear,
  coverUrl = null,
  initialRepeat = false,
  loading = false,
  message,
  onClose,
  onSave,
}: CreateProps) {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] =
    useState<number | null>(null);
  const [liked, setLiked] = useState(true);
  const [isRepeat, setIsRepeat] =
    useState(initialRepeat);
  const [containsSpoilers, setContainsSpoilers] =
    useState(false);
  const [showConsumedDate, setShowConsumedDate] =
    useState(true);
  const [registrationDate] = useState(getToday);
  const [confirmDiscard, setConfirmDiscard] =
    useState(false);

  const hasUnsavedChanges =
    reviewText.trim().length > 0 ||
    rating !== null ||
    liked !== true ||
    isRepeat !== initialRepeat ||
    containsSpoilers ||
    !showConsumedDate;

  const requestClose = useCallback(() => {
    if (loading) return;

    if (hasUnsavedChanges) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, loading, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      event.preventDefault();

      if (confirmDiscard) {
        setConfirmDiscard(false);
      } else {
        requestClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [confirmDiscard, requestClose]);

  function save() {
    if (!loading) {
      void onSave({
        reviewText,
        rating,
        liked,
        isRepeat,
        containsSpoilers,
        showConsumedDate,
      });
    }
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 lg:flex lg:items-center lg:justify-center lg:p-5"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          requestClose();
        }
      }}
    >
      <style>{`
        @keyframes mt-heart-ring {
          from { opacity:.9; transform:scale(.2); transform-origin:center; }
          to { opacity:0; transform:scale(1.8); transform-origin:center; }
        }
        @keyframes mt-heart-spark {
          from { opacity:1; transform:scale(.5); transform-origin:center; }
          to { opacity:0; transform:scale(2); transform-origin:center; }
        }
        .mt-heart-ring { animation:mt-heart-ring 450ms ease-out both; }
        .mt-heart-spark { animation:mt-heart-spark 520ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .mt-heart-ring, .mt-heart-spark { animation:none; }
        }
        @media (orientation:landscape) and (max-height:560px) and (max-width:950px) {
          .mt-review-mobile {
            display:grid!important;
            grid-template-columns:minmax(0,35%) minmax(0,65%);
            grid-template-rows:auto minmax(0,1fr) auto;
            grid-template-areas:
              "summary rating"
              "date editor"
              "options options";
            column-gap:12px;
            row-gap:6px;
          }
          .mt-review-summary { grid-area:summary; gap:8px; align-items:flex-start; }
          .mt-review-cover { width:62px!important; height:93px!important; }
          .mt-review-summary h2 { font-size:15px!important; }
          .mt-review-summary .mt-review-year { font-size:12px!important; }
          .mt-review-date { grid-area:date; align-self:start; margin-top:0!important; }
          .mt-review-date span { font-size:11px!important; }
          .mt-review-rating { grid-area:rating; margin-top:0!important; }
          .mt-review-editor {
            grid-area:editor;
            min-height:0;
            margin-top:0!important;
            margin-left:0!important;
            margin-right:0!important;
          }
          .mt-review-editor textarea { min-height:60px!important; }
          .mt-review-options { grid-area:options; margin-top:0!important; padding:0!important; }
          .mt-review-options svg { height:24px; width:24px; }
          .mt-review-options button { padding-top:2px; padding-bottom:2px; }
          .mt-review-content { overflow-y:auto!important; }
        }
      `}</style>

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Registrar review de ${title}`}
        className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#0a0a0d] text-zinc-100 lg:h-auto lg:max-h-[92dvh] lg:max-w-4xl lg:rounded-2xl lg:border lg:border-white/10 lg:shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* MOBILE HEADER */}
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(10px,env(safe-area-inset-top))] lg:hidden">
          <button
            type="button"
            onClick={requestClose}
            disabled={loading}
            className="inline-flex min-w-0 items-center gap-2 text-fuchsia-400 disabled:opacity-50"
          >
            <ArrowLeft
              size={18}
              className="shrink-0"
            />
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em]">
              {getMediaLabel(mediaType)}
            </span>
          </button>

          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-5 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
          >
            {loading && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </header>

        {/* DESKTOP HEADER */}
        <header className="hidden shrink-0 px-6 pt-4 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            {getMediaLabel(mediaType)}
          </p>
        </header>

        <main className="mt-review-content flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 sm:px-6 lg:block lg:pb-3 lg:pt-2">
          {/* MOBILE LAYOUT */}
          <div className="mt-review-mobile flex min-h-0 flex-1 flex-col lg:hidden">
            <div className="mt-review-summary flex shrink-0 items-center gap-4">
              <div className="mt-review-cover h-[clamp(94px,17dvh,142px)] w-[clamp(68px,12dvh,100px)] shrink-0">
                <ReviewCover
                  title={title}
                  coverUrl={coverUrl}
                />
              </div>

              <div className="min-w-0">
                <h2 className="break-words text-[clamp(18px,4.6vw,22px)] font-semibold leading-tight tracking-tight text-white">
                  {title}
                </h2>

                {releaseYear ? (
                  <p className="mt-1.5 text-sm font-medium text-zinc-400 mt-review-year">
                    {releaseYear}
                  </p>
                ) : null}
              </div>
            </div>

            {/* DATE */}
            <label className="mt-review-date mt-3 flex shrink-0 cursor-pointer flex-wrap items-center gap-x-2.5 gap-y-1">
              <input
                type="checkbox"
                checked={showConsumedDate}
                onChange={(event) =>
                  setShowConsumedDate(
                    event.target.checked,
                  )
                }
                disabled={loading}
                aria-label="Mostrar fecha en la review"
                className="h-5 w-5 shrink-0 accent-fuchsia-500"
              />

              <span className="text-sm text-zinc-400">
                {getDateLabel(mediaType)}
              </span>

              <time
                dateTime={registrationDate}
                className="text-sm font-medium tabular-nums text-zinc-200"
              >
                {formatDate(registrationDate)}
              </time>
            </label>

            <div className="mt-review-rating mt-3 shrink-0">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                Tu puntuación
              </p>

              <StarRating
                value={rating}
                onChange={setRating}
                size={30}
                showLabel={false}
              />
            </div>

            {/* REVIEW EDITOR */}
            <div className="mt-review-editor -mx-4 mt-3 flex min-h-0 flex-1 flex-col sm:-mx-6">
              <p className="mb-2 shrink-0 px-4 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 sm:px-6">
                Review
              </p>

              <div className="shrink-0 border-t border-white/10" />

              <textarea
                value={reviewText}
                onChange={(event) =>
                  setReviewText(event.target.value)
                }
                placeholder="¿Qué te pareció?"
                rows={4}
                className="min-h-[80px] w-full flex-1 resize-none overflow-y-auto border-0 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 focus:outline-none sm:px-6"
              />
            </div>

            <div className="mt-review-options -mx-4 shrink-0 border-t border-white/10 px-4 py-1.5 sm:-mx-6 sm:px-6">
              <CreateOptions
                mediaType={mediaType}
                liked={liked}
                isRepeat={isRepeat}
                containsSpoilers={containsSpoilers}
                disabled={loading}
                onLikedChange={() =>
                  setLiked(!liked)
                }
                onRepeatChange={() =>
                  setIsRepeat(!isRepeat)
                }
                onSpoilersChange={() =>
                  setContainsSpoilers(
                    !containsSpoilers,
                  )
                }
              />
            </div>

            {message && (
              <p className="mt-1 text-sm text-red-400">
                {message}
              </p>
            )}
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:grid lg:grid-cols-[168px_minmax(0,1fr)] lg:gap-5">
            <div className="aspect-[2/3] w-full">
              <ReviewCover
                title={title}
                coverUrl={coverUrl}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="break-words text-[22px] font-semibold leading-tight tracking-tight text-white">
                  {title}
                </h2>

                {releaseYear ? (
                  <span className="text-sm font-medium tabular-nums text-zinc-500">
                    {releaseYear}
                  </span>
                ) : null}
              </div>

              <label className="mt-3 flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
                <input
                  type="checkbox"
                  checked={showConsumedDate}
                  onChange={(event) =>
                    setShowConsumedDate(
                      event.target.checked,
                    )
                  }
                  disabled={loading}
                  aria-label="Mostrar fecha en la review"
                  className="h-4 w-4 shrink-0 accent-fuchsia-500"
                />

                <span className="text-sm text-zinc-400">
                  {getDateLabel(mediaType)}
                </span>

                <time
                  dateTime={registrationDate}
                  className="text-sm tabular-nums text-zinc-200"
                >
                  {formatDate(registrationDate)}
                </time>
              </label>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Tu puntuación
                </p>

                <StarRating
                  value={rating}
                  onChange={setRating}
                  size={30}
                  showLabel={false}
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Review
                </p>

                <textarea
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                  placeholder="¿Qué te pareció?"
                  rows={5}
                  className="block h-[154px] w-full resize-none overflow-y-auto rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-fuchsia-500/60"
                />
              </div>

              <div className="mt-3">
                <CreateOptions
                  mediaType={mediaType}
                  liked={liked}
                  isRepeat={isRepeat}
                  containsSpoilers={containsSpoilers}
                  disabled={loading}
                  onLikedChange={() =>
                    setLiked(!liked)
                  }
                  onRepeatChange={() =>
                    setIsRepeat(!isRepeat)
                  }
                  onSpoilersChange={() =>
                    setContainsSpoilers(
                      !containsSpoilers,
                    )
                  }
                />
              </div>

              {message && (
                <p className="mt-2 text-sm text-red-400">
                  {message}
                </p>
              )}
            </div>
          </div>
        </main>

        {/* DESKTOP FOOTER */}
        <footer className="hidden shrink-0 px-6 pb-4 pt-2 lg:block">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={loading}
              className="h-11 rounded-xl px-5 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={save}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-6 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
            >
              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </footer>
      </section>

      {/* DISCARD CONFIRMATION */}
      {confirmDiscard && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-review-title"
            aria-describedby="discard-review-description"
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.7)]"
          >
            <h3
              id="discard-review-title"
              className="text-lg font-semibold text-white"
            >
              ¿Descartar review?
            </h3>

            <p
              id="discard-review-description"
              className="mt-2 text-sm leading-6 text-zinc-400"
            >
              Tienes cambios sin guardar. Si sales,
              se perderán.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmDiscard(false)
                }
                className="h-10 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.05]"
              >
                Seguir editando
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Descartar review
              </button>
            </div>
          </section>
        </div>
      )}
    </div>,
    document.body,
  );
}

/* =========================================================
   SAVED REVIEW CARD
========================================================= */

function SavedReviewCard({
  review,
  mediaType,
  coverOnly = false,
}: SavedProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [message, setMessage] = useState("");
  const [reviewText, setReviewText] = useState(
    review.review_text ?? "",
  );
  const [rating, setRating] = useState<number | null>(
    review.rating,
  );
  const [liked, setLiked] = useState(review.liked);
  const [isRepeat, setIsRepeat] = useState(
    review.is_rewatch,
  );
  const [containsSpoilers, setContainsSpoilers] =
    useState(review.contains_spoilers);
  const [showConsumedDate, setShowConsumedDate] =
    useState(review.show_consumed_date ?? true);
  const [spoilersRevealed, setSpoilersRevealed] =
    useState(!review.contains_spoilers);

  const coverPositionX =
    review.cover_position_x ?? 50;
  const coverPositionY =
    review.cover_position_y ?? 50;
  const coverZoom = review.cover_zoom ?? 1;

  const hasText = reviewText.trim().length > 0;

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function resetValues() {
    setReviewText(review.review_text ?? "");
    setRating(review.rating);
    setLiked(review.liked);
    setIsRepeat(review.is_rewatch);
    setContainsSpoilers(review.contains_spoilers);
    setShowConsumedDate(
      review.show_consumed_date ?? true,
    );
  }

  function openModal() {
    resetValues();
    setEditing(false);
    setConfirmDelete(false);
    setMessage("");
    setSpoilersRevealed(
      !review.contains_spoilers,
    );
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setOpen(false);
    setEditing(false);
    setConfirmDelete(false);
    setMessage("");
  }

  function cancelEditing() {
    resetValues();
    setEditing(false);
    setMessage("");
  }

  async function saveChanges() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("reviews")
      .update({
        review_text: reviewText.trim() || null,
        rating,
        liked,
        is_rewatch: isRepeat,
        contains_spoilers: containsSpoilers,
        show_consumed_date: showConsumedDate,
        experience: getExperience(
          mediaType,
          isRepeat,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", review.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setEditing(false);
    setSpoilersRevealed(!containsSpoilers);
    setMessage("Review actualizada.");
    setLoading(false);

    router.refresh();
  }

  async function deleteReview() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", review.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      setConfirmDelete(false);
      return;
    }

    setConfirmDelete(false);
    setOpen(false);
    setLoading(false);

    router.refresh();
  }

  return (
    <>
      <div>
        <button
          type="button"
          onClick={openModal}
          className="block w-full text-left"
          aria-label={`Abrir review de ${review.title}`}
        >
          <div className="aspect-[2/3] w-full">
            <ReviewCover
              title={review.title}
              coverUrl={review.cover_url}
              positionX={coverPositionX}
              positionY={coverPositionY}
              zoom={coverZoom}
            />
          </div>
        </button>

        {/* Solo se ocultan los metadatos externos
            cuando se utiliza desde Biblioteca. */}
        {!coverOnly && (
          <div className="mt-2">
            <StarRating
              value={rating}
              readonly
              size={17}
              showLabel={false}
            />

            <div className="mt-2 flex items-center gap-3 text-zinc-500">
              {liked ? (
                <Heart
                  size={17}
                  fill="currentColor"
                  className="text-red-500"
                />
              ) : (
                <HeartCrack size={17} />
              )}

              {isRepeat ? (
                <Repeat2 size={17} />
              ) : mediaType === "BOOK" ? (
                <BookOpen size={17} />
              ) : mediaType === "GAME" ? (
                <Gamepad2 size={17} />
              ) : (
                <Eye size={17} />
              )}

              {containsSpoilers ? (
                <ShieldAlert size={17} />
              ) : (
                <ShieldCheck size={17} />
              )}
            </div>
          </div>
        )}
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm lg:p-5"
              onMouseDown={closeModal}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-label={`Review de ${review.title}`}
                className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#0a0a0d] text-zinc-100 lg:h-auto lg:max-h-[92dvh] lg:max-w-3xl lg:rounded-2xl lg:border lg:border-white/10 lg:shadow-2xl"
                onMouseDown={(event) =>
                  event.stopPropagation()
                }
              >
                <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-6 lg:pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
                    {getMediaLabel(mediaType)}
                  </p>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    aria-label="Cerrar"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:text-white disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 lg:py-6">
                  <div className="lg:grid lg:grid-cols-[145px_minmax(0,1fr)] lg:gap-7">
                    <div className="hidden lg:block">
                      <Link
                        href={getMediaRoute(
                          mediaType,
                          review.external_id,
                        )}
                        onClick={() =>
                          setOpen(false)
                        }
                      >
                        <div className="aspect-[2/3] w-full">
                          <ReviewCover
                            title={review.title}
                            coverUrl={review.cover_url}
                            positionX={coverPositionX}
                            positionY={coverPositionY}
                            zoom={coverZoom}
                          />
                        </div>
                      </Link>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3 lg:hidden">
                        <Link
                          href={getMediaRoute(
                            mediaType,
                            review.external_id,
                          )}
                          onClick={() =>
                            setOpen(false)
                          }
                          className="h-[84px] w-[60px] shrink-0"
                        >
                          <ReviewCover
                            title={review.title}
                            coverUrl={review.cover_url}
                            positionX={coverPositionX}
                            positionY={coverPositionY}
                            zoom={coverZoom}
                          />
                        </Link>

                        <div className="min-w-0">
                          <h2 className="break-words text-lg font-bold">
                            {review.title}
                          </h2>

                          {review.release_year ? (
                            <p className="mt-1 text-xs text-zinc-500">
                              {review.release_year}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="hidden lg:flex lg:flex-wrap lg:items-baseline lg:gap-3">
                        <h2 className="break-words text-2xl font-bold">
                          {review.title}
                        </h2>

                        {review.release_year ? (
                          <span className="text-base text-zinc-500">
                            {review.release_year}
                          </span>
                        ) : null}
                      </div>

                      {editing ? (
                        <div className="mt-4 border-b border-white/8 pb-4 lg:mt-5">
                          <label className="flex cursor-pointer flex-wrap items-center gap-3">
                            <input
                              type="checkbox"
                              checked={showConsumedDate}
                              onChange={(event) =>
                                setShowConsumedDate(
                                  event.target.checked,
                                )
                              }
                              disabled={loading}
                              className="h-4 w-4 accent-fuchsia-500"
                              aria-label="Mostrar fecha en la review"
                            />

                            <span className="text-sm text-zinc-400">
                              {getDateLabel(mediaType)}
                            </span>

                            <span className="text-sm text-zinc-200">
                              {formatDate(
                                review.consumed_at,
                              )}
                            </span>
                          </label>
                        </div>
                      ) : showConsumedDate ? (
                        <p className="mt-4 border-b border-white/8 pb-4 text-sm text-zinc-500 lg:mt-5">
                          {getDateLabel(mediaType)}{" "}
                          <span className="text-zinc-300">
                            {formatDate(
                              review.consumed_at,
                            )}
                          </span>
                        </p>
                      ) : null}

                      {(editing ||
                        (rating !== null &&
                          rating > 0)) && (
                        <div className="mt-5">
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                            Tu puntuación
                          </p>

                          <StarRating
                            value={rating}
                            onChange={
                              editing
                                ? setRating
                                : undefined
                            }
                            readonly={!editing}
                            size={30}
                            showLabel={false}
                          />
                        </div>
                      )}

                      <div className="mt-5">
                        <ReviewOptions
                          mediaType={mediaType}
                          liked={liked}
                          isRepeat={isRepeat}
                          containsSpoilers={
                            containsSpoilers
                          }
                          disabled={loading}
                          onLikedChange={
                            editing
                              ? () =>
                                  setLiked(!liked)
                              : undefined
                          }
                          onRepeatChange={
                            editing
                              ? () =>
                                  setIsRepeat(
                                    !isRepeat,
                                  )
                              : undefined
                          }
                          onSpoilersChange={
                            editing
                              ? () =>
                                  setContainsSpoilers(
                                    !containsSpoilers,
                                  )
                              : undefined
                          }
                        />
                      </div>

                      <div className="mt-5">
                        {editing ? (
                          <textarea
                            value={reviewText}
                            onChange={(event) =>
                              setReviewText(
                                event.target.value,
                              )
                            }
                            placeholder="Escribe tu review..."
                            rows={5}
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-zinc-200 outline-none focus:border-fuchsia-500/60"
                          />
                        ) : hasText &&
                          containsSpoilers &&
                          !spoilersRevealed ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5 text-center">
                            <ShieldAlert
                              size={28}
                              className="mx-auto text-zinc-400"
                            />

                            <h3 className="mt-3 font-semibold">
                              Esta review contiene
                              spoilers
                            </h3>

                            <p className="mt-2 text-sm text-zinc-500">
                              ¿Quieres continuar y
                              leerla?
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                setSpoilersRevealed(
                                  true,
                                )
                              }
                              className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
                            >
                              Mostrar review
                            </button>
                          </div>
                        ) : hasText ? (
                          <div className="rounded-xl bg-white/[0.035] p-4">
                            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                              {reviewText}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm italic text-zinc-600">
                            Sin review escrita.
                          </p>
                        )}
                      </div>

                      {message && (
                        <p className="mt-4 text-sm text-zinc-400">
                          {message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <footer className="shrink-0 border-t border-white/8 bg-[#0a0a0d] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete(true)
                      }
                      disabled={loading}
                      className="flex h-10 items-center gap-2 rounded-xl border border-red-900/50 px-3 text-sm text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Borrar
                    </button>

                    {!editing ? (
                      <button
                        type="button"
                        onClick={() =>
                          setEditing(true)
                        }
                        disabled={loading}
                        className="flex h-10 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={loading}
                          className="h-10 rounded-xl px-3 text-sm text-zinc-500 disabled:opacity-50"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void saveChanges()
                          }
                          disabled={loading}
                          className="flex h-10 items-center gap-2 rounded-xl bg-fuchsia-500 px-4 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
                        >
                          <Save size={16} />
                          {loading
                            ? "Guardando..."
                            : "Guardar"}
                        </button>
                      </div>
                    )}
                  </div>
                </footer>
              </section>
            </div>,
            document.body,
          )
        : null}

      {open &&
      confirmDelete &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onMouseDown={() => {
                if (!loading) {
                  setConfirmDelete(false);
                }
              }}
            >
              <section
                role="alertdialog"
                aria-modal="true"
                aria-label="Confirmar eliminación de review"
                className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
                onMouseDown={(event) =>
                  event.stopPropagation()
                }
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                  <Trash2 size={21} />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  ¿Borrar review?
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  La review de{" "}
                  <span className="font-medium text-zinc-300">
                    {review.title}
                  </span>{" "}
                  se eliminará permanentemente.
                  Esta acción no se puede deshacer.
                </p>

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete(false)
                    }
                    disabled={loading}
                    className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void deleteReview()
                    }
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    {loading
                      ? "Borrando..."
                      : "Borrar review"}
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}