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

import {
  useState,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  createClient,
} from "@/lib/supabase/client";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

type ReviewDetails = {
  id: string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  review_text:
    | string
    | null;

  rating:
    | number
    | null;

  liked:
    | boolean
    | null;

  experience:
    | "FIRST_TIME"
    | "REWATCH"
    | "REPLAY"
    | "REREAD"
    | null;

  contains_spoilers:
    boolean;

  show_consumed_date:
    boolean;

  consumed_at:
    | string
    | null;

  cover_url:
    | string
    | null;

  release_year:
    | number
    | null;

  created_at:
    string;
};

type TriggerVariant =
  | "sidebar"
  | "grid"
  | "poster";

interface ProfileReviewModalProps {
  reviewId:
    string;

  mediaType:
    MediaType;

  title:
    string;

  coverUrl:
    | string
    | null;

  posterPositionX?:
    number;

  posterPositionY?:
    number;

  posterZoom?:
    number;

  createdAt?:
    string;

  variant?:
    TriggerVariant;
}

function getMediaHref(
  mediaType:
    MediaType,

  externalId:
    string
) {
  if (
    mediaType ===
    "MOVIE"
  ) {
    return `/movies/${externalId}`;
  }

  if (
    mediaType ===
    "SERIES"
  ) {
    return `/series/${externalId}`;
  }

  if (
    mediaType ===
    "BOOK"
  ) {
    return `/books/${externalId}`;
  }

  return `/games/${externalId}`;
}

function getMediaLabel(
  mediaType:
    MediaType
) {
  if (
    mediaType ===
    "MOVIE"
  ) {
    return "Película";
  }

  if (
    mediaType ===
    "SERIES"
  ) {
    return "Serie";
  }

  if (
    mediaType ===
    "BOOK"
  ) {
    return "Libro";
  }

  return "Juego";
}

function getExperienceLabel(
  review:
    ReviewDetails
) {
  if (
    review.experience ===
    "REWATCH"
  ) {
    return "Rewatch";
  }

  if (
    review.experience ===
    "REPLAY"
  ) {
    return "Replay";
  }

  if (
    review.experience ===
    "REREAD"
  ) {
    return "Relectura";
  }

  if (
    review.media_type ===
    "BOOK"
  ) {
    return "Primera lectura";
  }

  if (
    review.media_type ===
    "GAME"
  ) {
    return "Primera partida";
  }

  return "Primera vez";
}

function getConsumedLabel(
  mediaType:
    MediaType
) {
  if (
    mediaType ===
    "BOOK"
  ) {
    return "Leído el";
  }

  if (
    mediaType ===
    "GAME"
  ) {
    return "Completado el";
  }

  return "Visto el";
}

function formatDate(
  value:
    string
) {
  try {
    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day:
          "numeric",

        month:
          "short",

        year:
          "numeric",
      }
    ).format(
      new Date(
        value.length === 10
          ? `${value}T12:00:00`
          : value
      )
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
  const [
    supabase,
  ] =
    useState(
      () =>
        createClient()
    );

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    review,
    setReview,
  ] =
    useState<
      ReviewDetails |
      null
    >(
      null
    );

  const [
    spoilerRevealed,
    setSpoilerRevealed,
  ] =
    useState(
      false
    );

  async function openReview() {
    setOpen(
      true
    );

    setError(
      ""
    );

    setLoading(
      true
    );

    const {
      data,
      error:
        reviewError,
    } =
      await supabase
        .from(
          "reviews"
        )
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
        .eq(
          "id",
          reviewId
        )
        .maybeSingle();

    if (
      reviewError
    ) {
      setError(
        reviewError.message
      );

      setLoading(
        false
      );

      return;
    }

    if (
      !data
    ) {
      setError(
        "Esta review ya no está disponible."
      );

      setLoading(
        false
      );

      return;
    }

    const loadedReview =
      data as ReviewDetails;

    setReview(
      loadedReview
    );

    setSpoilerRevealed(
      !loadedReview.contains_spoilers
    );

    setLoading(
      false
    );
  }

  function closeReview() {
    setOpen(
      false
    );

    setError(
      ""
    );
  }

  const displayCover =
    coverUrl ??
    review?.cover_url ??
    null;

  return (
    <>
      {variant ===
        "sidebar" && (
        <button
          type="button"
          onClick={() => {
            void openReview();
          }}
          className="group flex w-full gap-3 text-left"
        >
          {coverUrl ? (
            <div className="relative h-14 w-10 shrink-0 overflow-hidden bg-zinc-900">
              <Image
                src={
                  coverUrl
                }
                alt={
                  title
                }
                fill
                sizes="40px"
                unoptimized={
                  shouldUseOriginalImage(
                    coverUrl
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
            </div>
          ) : (
            <div className="h-14 w-10 shrink-0 bg-zinc-900" />
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-300 transition group-hover:text-white">
              {
                title
              }
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              {getMediaLabel(
                mediaType
              )}
            </p>

            {createdAt && (
              <p className="mt-0.5 text-[11px] text-zinc-700">
                {formatDate(
                  createdAt
                )}
              </p>
            )}
          </div>
        </button>
      )}

      {variant ===
        "grid" && (
        <button
          type="button"
          onClick={() => {
            void openReview();
          }}
          className="group min-w-0 text-left"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition group-hover:border-zinc-600">
            {coverUrl ? (
              <Image
                src={
                  coverUrl
                }
                alt={
                  title
                }
                fill
                sizes="150px"
                unoptimized={
                  shouldUseOriginalImage(
                    coverUrl
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
              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
                Sin portada
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />

            <div className="absolute bottom-2 left-2 right-2">
              <span className="rounded-full bg-black/60 px-2 py-1 text-[9px] font-medium text-white backdrop-blur">
                Review
              </span>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-xs font-medium leading-4 text-zinc-400 transition group-hover:text-zinc-200">
            {
              title
            }
          </p>
        </button>
      )}

      {variant ===
        "poster" && (
        <button
          type="button"
          onClick={() => {
            void openReview();
          }}
          className="block w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left transition hover:border-zinc-600"
          aria-label={`Ver review de ${title}`}
        >
          {coverUrl ? (
            <div className="relative aspect-[2/3] w-full overflow-hidden">
              <Image
                src={
                  coverUrl
                }
                alt={
                  title
                }
                fill
                sizes="155px"
                unoptimized={
                  shouldUseOriginalImage(
                    coverUrl
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
            </div>
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center px-4 text-center text-xs text-zinc-600">
              Sin portada
            </div>
          )}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={
            closeReview
          }
        >
          <div
            className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={
                closeReview
              }
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              aria-label="Cerrar review"
            >
              <X
                size={
                  20
                }
              />
            </button>

            {loading && (
              <div className="flex min-h-[300px] flex-col items-center justify-center">
                <Loader2
                  size={
                    28
                  }
                  className="animate-spin text-zinc-500"
                />

                <p className="mt-3 text-sm text-zinc-600">
                  Cargando review...
                </p>
              </div>
            )}

            {!loading &&
              error && (
                <div className="flex min-h-[250px] items-center justify-center px-6 text-center">
                  <p className="text-sm text-red-400">
                    {
                      error
                    }
                  </p>
                </div>
              )}

            {!loading &&
              !error &&
              review && (
                <div className="grid gap-7 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div>
                    {displayCover ? (
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-xl">
                        <Image
                          src={
                            displayCover
                          }
                          alt={
                            review.title
                          }
                          fill
                          sizes="180px"
                          unoptimized={
                            shouldUseOriginalImage(
                              displayCover
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
                      </div>
                    ) : (
                      <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-zinc-900 text-sm text-zinc-600">
                        Sin portada
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 pt-1">
                    <div className="pr-10">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h2 className="text-2xl font-bold text-zinc-100">
                          {
                            review.title
                          }
                        </h2>

                        {review.release_year && (
                          <span className="text-zinc-500">
                            {
                              review.release_year
                            }
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600">
                        {getMediaLabel(
                          review.media_type
                        )}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-zinc-400">
                        {review.rating !==
                          null && (
                          <span className="flex items-center gap-1.5">
                            <Star
                              size={
                                16
                              }
                              fill="currentColor"
                              className="text-amber-400"
                            />

                            <span className="font-medium text-zinc-200">
                              {
                                review.rating
                              }
                              /5
                            </span>
                          </span>
                        )}

                        <span className="flex items-center gap-2">
                          {review.liked ? (
                            <Heart
                              size={
                                16
                              }
                              fill="currentColor"
                              className="text-red-500"
                            />
                          ) : (
                            <HeartCrack
                              size={
                                16
                              }
                            />
                          )}

                          {review.liked
                            ? "Le gustó"
                            : "No le gustó"}
                        </span>

                        <span className="flex items-center gap-2">
                          {review.experience !==
                            "FIRST_TIME" && (
                            <RotateCcw
                              size={
                                15
                              }
                            />
                          )}

                          {getExperienceLabel(
                            review
                          )}
                        </span>

                        {review.contains_spoilers && (
                          <span className="flex items-center gap-2">
                            <ShieldAlert
                              size={
                                15
                              }
                            />

                            Spoilers
                          </span>
                        )}
                      </div>

                      {review.show_consumed_date &&
                        review.consumed_at && (
                          <p className="mt-4 text-sm text-zinc-500">
                            {getConsumedLabel(
                              review.media_type
                            )}{" "}

                            <span className="text-zinc-300">
                              {formatDate(
                                review.consumed_at
                              )}
                            </span>
                          </p>
                        )}
                    </div>

                    {review.contains_spoilers &&
                    !spoilerRevealed ? (
                      <div className="mt-7 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
                        <ShieldAlert
                          size={
                            28
                          }
                          className="mx-auto text-zinc-500"
                        />

                        <p className="mt-3 font-medium text-zinc-200">
                          Esta review contiene spoilers
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          El texto está oculto hasta que decidas mostrarlo.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setSpoilerRevealed(
                              true
                            )
                          }
                          className="mt-5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                        >
                          Mostrar review
                        </button>
                      </div>
                    ) : (
                      <div className="mt-7">
                        {review.review_text ? (
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-300">
                            {
                              review.review_text
                            }
                          </p>
                        ) : (
                          <p className="text-sm italic text-zinc-600">
                            Esta review no tiene texto.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-8 border-t border-zinc-800 pt-5">
                      <Link
                        href={getMediaHref(
                          review.media_type,
                          review.external_id
                        )}
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-200"
                      >
                        <ExternalLink
                          size={
                            15
                          }
                        />

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