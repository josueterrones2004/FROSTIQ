"use client";

import Image from "next/image";

import {
  Heart,
  HeartCrack,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

type Review = {
  id:
    string;

  media_type:
    | "MOVIE"
    | "SERIES"
    | "GAME"
    | "BOOK";

  external_id:
    string;

  title:
    string;

  review_text:
    string;

  liked:
    boolean;

  experience:
    | "FIRST_TIME"
    | "REWATCH"
    | "REPLAY"
    | "REREAD";

  contains_spoilers:
    boolean;

  show_consumed_date:
    boolean;

  consumed_at:
    string;

  cover_url:
    | string
    | null;

  poster_position_x?:
    number;

  poster_position_y?:
    number;

  poster_zoom?:
    number;

  release_year:
    | number
    | null;
};

interface SocialReviewModalProps {
  review:
    Review;
}

function formatDate(
  date:
    string
) {
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
      `${date}T12:00:00`
    )
  );
}

function getExperienceLabel(
  review:
    Review
) {
  if (
    review.experience ===
    "REWATCH"
  ) {
    return "Rewatch";
  }

  if (
    review.experience ===
    "REREAD"
  ) {
    return "Relectura";
  }

  if (
    review.experience ===
    "REPLAY"
  ) {
    return "Replay";
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

function getDateLabel(
  mediaType:
    Review["media_type"]
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

export default function SocialReviewModal({
  review,
}: SocialReviewModalProps) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    spoilerRevealed,
    setSpoilerRevealed,
  ] =
    useState(
      !review.contains_spoilers
    );

  const positionX =
    review.poster_position_x ??
    50;

  const positionY =
    review.poster_position_y ??
    50;

  const zoom =
    review.poster_zoom ??
    1;

  function openModal() {
    setSpoilerRevealed(
      !review.contains_spoilers
    );

    setOpen(
      true
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={
          openModal
        }
        className="mt-4 flex w-full gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900/70"
      >
        {review.cover_url ? (
          <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
            <Image
              src={
                review.cover_url
              }
              alt={
                review.title
              }
              fill
              sizes="64px"
              unoptimized={
                shouldUseOriginalImage(
                  review.cover_url
                )
              }
              className="object-cover"
              style={{
                objectPosition:
                  `${positionX}% ${positionY}%`,

                transform:
                  `scale(${zoom})`,
              }}
            />
          </div>
        ) : (
          <div className="flex aspect-[2/3] w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-800 px-2 text-center text-[10px] text-zinc-500">
            Sin portada
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-center gap-2">
            <p className="line-clamp-1 font-medium text-zinc-100">
              {
                review.title
              }
            </p>

            {review.release_year && (
              <span className="text-sm text-zinc-600">
                {
                  review.release_year
                }
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 text-zinc-500">
            {review.liked ? (
              <Heart
                size={
                  16
                }
                fill="currentColor"
              />
            ) : (
              <HeartCrack
                size={
                  16
                }
              />
            )}

            {review.experience !==
              "FIRST_TIME" && (
              <RotateCcw
                size={
                  16
                }
              />
            )}

            {review.contains_spoilers && (
              <ShieldAlert
                size={
                  16
                }
              />
            )}
          </div>

          <p className="mt-2 text-xs text-zinc-600">
            Ver review
          </p>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() =>
            setOpen(
              false
            )
          }
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                setOpen(
                  false
                )
              }
              className="absolute right-5 top-5 z-10 rounded-full p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              aria-label="Cerrar"
            >
              <X
                size={
                  20
                }
              />
            </button>

            <div className="grid gap-7 md:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                {review.cover_url ? (
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-xl">
                    <Image
                      src={
                        review.cover_url
                      }
                      alt={
                        review.title
                      }
                      fill
                      sizes="180px"
                      unoptimized={
                        shouldUseOriginalImage(
                          review.cover_url
                        )
                      }
                      className="object-cover"
                      style={{
                        objectPosition:
                          `${positionX}% ${positionY}%`,

                        transform:
                          `scale(${zoom})`,
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

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
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

                  {review.show_consumed_date && (
                    <p className="mt-4 text-sm text-zinc-500">
                      {getDateLabel(
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
                  <div className="mt-7 whitespace-pre-wrap break-words leading-7 text-zinc-300">
                    {
                      review.review_text
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}