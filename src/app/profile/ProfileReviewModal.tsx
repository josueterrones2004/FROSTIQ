
"use client";

import {
  ExternalLink,
  Heart,
  HeartCrack,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Star,
  X,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { shouldUseOriginalImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

type ReviewDetails = {
  id: string;
  media_type: MediaType;
  external_id: string;
  title: string;
  review_text: string | null;
  rating: number | null;
  liked: boolean | null;
  experience:
    | "FIRST_TIME"
    | "REWATCH"
    | "REPLAY"
    | "REREAD"
    | null;
  contains_spoilers: boolean;
  show_consumed_date: boolean;
  consumed_at: string | null;
  cover_url: string | null;
  release_year: number | null;
  created_at: string;
};

type TriggerVariant =
  | "sidebar"
  | "grid"
  | "poster";

interface ProfileReviewModalProps {
  reviewId: string;
  mediaType: MediaType;
  title: string;
  coverUrl: string | null;
  posterPositionX?: number;
  posterPositionY?: number;
  posterZoom?: number;
  createdAt?: string;
  variant?: TriggerVariant;
}

function getMediaHref(
  mediaType: MediaType,
  externalId: string,
) {
  if (mediaType === "MOVIE") {
    return `/movies/${externalId}`;
  }

  if (mediaType === "SERIES") {
    return `/series/${externalId}`;
  }

  if (mediaType === "BOOK") {
    return `/books/${externalId}`;
  }

  return `/games/${externalId}`;
}

function getMediaLabel(mediaType: MediaType) {
  if (mediaType === "MOVIE") {
    return "Película";
  }

  if (mediaType === "SERIES") {
    return "Serie";
  }

  if (mediaType === "BOOK") {
    return "Libro";
  }

  return "Juego";
}

function getExperienceLabel(
  review: ReviewDetails,
) {
  if (review.experience === "REWATCH") {
    return "Rewatch";
  }

  if (review.experience === "REPLAY") {
    return "Replay";
  }

  if (review.experience === "REREAD") {
    return "Relectura";
  }

  if (review.media_type === "BOOK") {
    return "Primera lectura";
  }

  if (review.media_type === "GAME") {
    return "Primera partida";
  }

  return "Primera vez";
}

function getConsumedLabel(
  mediaType: MediaType,
) {
  if (mediaType === "BOOK") {
    return "Leído el";
  }

  if (mediaType === "GAME") {
    return "Completado el";
  }

  return "Visto el";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(
      new Date(
        value.length === 10
          ? `${value}T12:00:00`
          : value,
      ),
    );
  } catch {
    return "";
  }
}

export default function ProfileReviewModal({
  reviewId,
  mediaType,
  title,
  coverUrl,
  posterPositionX = 50,
  posterPositionY = 50,
  posterZoom = 1,
  createdAt,
  variant = "sidebar",
}: ProfileReviewModalProps) {
  const [supabase] = useState(() =>
    createClient(),
  );

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [review, setReview] =
    useState<ReviewDetails | null>(null);

  const [
    spoilerRevealed,
    setSpoilerRevealed,
  ] = useState(false);

  async function openReview() {
    setOpen(true);
    setError("");
    setLoading(true);

    const {
      data,
      error: reviewError,
    } = await supabase
      .from("reviews")
      .select(`
        id,
        media_type,
        external_id,
        title,
        review_text,
        rating,
        liked,
        experience,
        contains_spoilers,
        show_consumed_date,
        consumed_at,
        cover_url,
        release_year,
        created_at
      `)
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError) {
      setError(reviewError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError(
        "Esta review ya no está disponible.",
      );
      setLoading(false);
      return;
    }

    const loadedReview =
      data as ReviewDetails;

    setReview(loadedReview);
    setSpoilerRevealed(
      !loadedReview.contains_spoilers,
    );
    setLoading(false);
  }

  function closeReview() {
    setOpen(false);
    setError("");
  }

  const displayCover =
    coverUrl ??
    review?.cover_url ??
    null;

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .profile-review-responsive-grid {
            grid-template-columns: 180px minmax(0, 1fr);
          }
        }
      `}</style>

      {variant === "sidebar" && (
        <button
          type="button"
          onClick={() => {
            void openReview();
          }}
          className="group flex w-full gap-3 text-left"
        >
          {coverUrl ? (
            <div className="relative h-14 w-10 shrink-0 overflow-hidden bg-frost-surface">
              <Image
                src={coverUrl}
                alt={title}
                fill
                sizes="40px"
                unoptimized={shouldUseOriginalImage(
                  coverUrl,
                )}
                className="object-cover"
                style={{
                  objectPosition:
                    `${posterPositionX}% ${posterPositionY}%`,
                  transform:
                    `scale(${posterZoom})`,
                }}
              />
            </div>
          ) : (
            <div className="h-14 w-10 shrink-0 bg-frost-surface" />
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-frost-text transition-colors group-hover:text-frost-accent">
              {title}
            </p>

            <p className="mt-1 text-xs text-frost-muted">
              {getMediaLabel(mediaType)}
            </p>

            {createdAt && (
              <p
                className="mt-0.5 text-frost-muted"
                style={{ fontSize: 11 }}
              >
                {formatDate(createdAt)}
              </p>
            )}
          </div>
        </button>
      )}

      {variant === "grid" && (
        <button
          type="button"
          onClick={() => {
            void openReview();
          }}
          className="group min-w-0 text-left"
        >
          <div className="relative aspect-2/3 overflow-hidden rounded-lg border border-frost-border bg-frost-surface transition-colors group-hover:border-frost-accent/40">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                fill
                sizes="150px"
                unoptimized={shouldUseOriginalImage(
                  coverUrl,
                )}
                className="object-cover"
                style={{
                  objectPosition:
                    `${posterPositionX}% ${posterPositionY}%`,
                  transform:
                    `scale(${posterZoom})`,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-frost-muted">
                Sin portada
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/80 to-transparent" />

            <div className="absolute bottom-2 left-2 right-2">
              <span
                className="rounded-full bg-black/60 px-2 py-1 font-medium text-white backdrop-blur"
                style={{ fontSize: 9 }}
              >
                Review
              </span>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-xs font-medium leading-4 text-frost-muted transition-colors group-hover:text-frost-text">
            {title}
          </p>
        </button>
      )}

      {variant === "poster" && (
        <button
          type="button"
          onClick={() => {
            void openReview();
          }}
          className="block w-full overflow-hidden rounded-xl border border-frost-border bg-frost-surface text-left transition-colors hover:border-frost-accent/40"
          aria-label={`Ver review de ${title}`}
        >
          {coverUrl ? (
            <div className="relative aspect-2/3 w-full overflow-hidden">
              <Image
                src={coverUrl}
                alt={title}
                fill
                sizes="155px"
                unoptimized={shouldUseOriginalImage(
                  coverUrl,
                )}
                className="object-cover"
                style={{
                  objectPosition:
                    `${posterPositionX}% ${posterPositionY}%`,
                  transform:
                    `scale(${posterZoom})`,
                }}
              />
            </div>
          ) : (
            <div className="flex aspect-2/3 items-center justify-center px-4 text-center text-xs text-frost-muted">
              Sin portada
            </div>
          )}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          style={{ zIndex: 200 }}
          onClick={closeReview}
        >
          <div
            className="relative w-full max-w-3xl overflow-y-auto rounded-2xl border border-frost-border bg-frost-bg p-5 shadow-2xl sm:p-7"
            style={{ maxHeight: "92dvh" }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={closeReview}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-frost-muted transition-colors hover:bg-frost-surface hover:text-frost-text"
              aria-label="Cerrar review"
            >
              <X size={20} />
            </button>

            {loading && (
              <div
                className="flex flex-col items-center justify-center"
                style={{ minHeight: 300 }}
              >
                <Loader2
                  size={28}
                  className="animate-spin text-frost-accent"
                />

                <p className="mt-3 text-sm text-frost-muted">
                  Cargando review...
                </p>
              </div>
            )}

            {!loading && error && (
              <div
                className="flex items-center justify-center px-6 text-center"
                style={{ minHeight: 250 }}
              >
                <p className="text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && review && (
              <div className="profile-review-responsive-grid grid gap-7">
                <div>
                  {displayCover ? (
                    <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl bg-frost-surface shadow-xl">
                      <Image
                        src={displayCover}
                        alt={review.title}
                        fill
                        sizes="180px"
                        unoptimized={shouldUseOriginalImage(
                          displayCover,
                        )}
                        className="object-cover"
                        style={{
                          objectPosition:
                            `${posterPositionX}% ${posterPositionY}%`,
                          transform:
                            `scale(${posterZoom})`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-2/3 w-full items-center justify-center rounded-xl bg-frost-surface text-sm text-frost-muted">
                      Sin portada
                    </div>
                  )}
                </div>

                <div className="min-w-0 pt-1">
                  <div className="pr-10">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="text-2xl font-bold text-frost-text">
                        {review.title}
                      </h2>

                      {review.release_year && (
                        <span className="text-frost-muted">
                          {review.release_year}
                        </span>
                      )}
                    </div>

                    <p
                      className="mt-1 text-xs font-medium uppercase text-frost-muted"
                      style={{
                        letterSpacing: "0.14em",
                      }}
                    >
                      {getMediaLabel(
                        review.media_type,
                      )}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-frost-muted">
                      {review.rating !== null && (
                        <span className="flex items-center gap-1.5">
                          <Star
                            size={16}
                            fill="currentColor"
                            className="text-amber-400"
                          />

                          <span className="font-medium text-frost-text">
                            {review.rating}/5
                          </span>
                        </span>
                      )}

                      <span className="flex items-center gap-2">
                        {review.liked ? (
                          <Heart
                            size={16}
                            fill="currentColor"
                            className="text-red-500"
                          />
                        ) : (
                          <HeartCrack size={16} />
                        )}

                        {review.liked
                          ? "Le gustó"
                          : "No le gustó"}
                      </span>

                      <span className="flex items-center gap-2">
                        {review.experience !==
                          "FIRST_TIME" && (
                          <RotateCcw size={15} />
                        )}

                        {getExperienceLabel(
                          review,
                        )}
                      </span>

                      {review.contains_spoilers && (
                        <span className="flex items-center gap-2">
                          <ShieldAlert size={15} />
                          Spoilers
                        </span>
                      )}
                    </div>

                    {review.show_consumed_date &&
                      review.consumed_at && (
                        <p className="mt-4 text-sm text-frost-muted">
                          {getConsumedLabel(
                            review.media_type,
                          )}{" "}

                          <span className="text-frost-text">
                            {formatDate(
                              review.consumed_at,
                            )}
                          </span>
                        </p>
                      )}
                  </div>

                  {review.contains_spoilers &&
                  !spoilerRevealed ? (
                    <div className="mt-7 rounded-xl border border-frost-border bg-frost-surface/60 p-6 text-center">
                      <ShieldAlert
                        size={28}
                        className="mx-auto text-frost-muted"
                      />

                      <p className="mt-3 font-medium text-frost-text">
                        Esta review contiene spoilers
                      </p>

                      <p className="mt-1 text-sm text-frost-muted">
                        El texto está oculto hasta que decidas mostrarlo.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setSpoilerRevealed(true)
                        }
                        className="mt-5 rounded-lg border border-frost-border bg-frost-surface px-4 py-2 text-sm text-frost-text transition-colors hover:bg-frost-raised"
                      >
                        Mostrar review
                      </button>
                    </div>
                  ) : (
                    <div className="mt-7">
                      {review.review_text ? (
                        <p
                          className="whitespace-pre-wrap wrap-break-words leading-7 text-frost-text"
                          style={{ fontSize: 15 }}
                        >
                          {review.review_text}
                        </p>
                      ) : (
                        <p className="text-sm italic text-frost-muted">
                          Esta review no tiene texto.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-8 border-t border-frost-border pt-5">
                    <Link
                      href={getMediaHref(
                        review.media_type,
                        review.external_id,
                      )}
                      className="inline-flex items-center gap-2 text-sm font-medium text-frost-muted transition-colors hover:text-frost-accent"
                    >
                      <ExternalLink size={15} />
                      Ver ficha
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}