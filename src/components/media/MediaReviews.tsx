"use client";

import {
  Heart,
  ShieldAlert,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import ActivityLikeButton from "@/app/social/ActivityLikeButton";
import { shouldUseOriginalImage } from "@/lib/image-optimization";

export type MediaReviewItem = {
  id: string;
  userId: string;

  username:
    | string
    | null;

  displayName: string;

  avatarUrl:
    | string
    | null;

  reviewText: string;

  rating:
    | number
    | null;

  liked: boolean;

  containsSpoilers: boolean;

  createdAt: string;

  consumedAt:
    | string
    | null;
};

interface MediaReviewsProps {
  friendReviews: MediaReviewItem[];
  reviews: MediaReviewItem[];

  mediaTitle: string;

  mediaYear:
    | number
    | null;

  mediaPosterUrl:
    | string
    | null;

  mediaTypeLabel: string;
}

function formatDate(
  value: string,
) {
  try {
    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(
      new Date(value),
    );
  } catch {
    return "";
  }
}

/* =========================================================
   AVATAR
========================================================= */

function UserAvatar({
  review,
  size = 38,
}: {
  review: MediaReviewItem;
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-zinc-900"
      style={{
        width: size,
        height: size,
      }}
    >
      {review.avatarUrl ? (
        <Image
          src={review.avatarUrl}
          alt={review.displayName}
          fill
          sizes={`${size}px`}
          unoptimized={shouldUseOriginalImage(
            review.avatarUrl,
          )}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-500">
          {review.displayName
            .slice(0, 1)
            .toUpperCase()}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STARS
========================================================= */

function ReviewStars({
  value,
  size = 15,
}: {
  value: number;
  size?: number;
}) {
  return (
    <div
      className="flex items-center gap-[2px]"
      aria-label={`${value.toFixed(1)} de 5 estrellas`}
    >
      {[0, 1, 2, 3, 4].map(
        (index) => {
          const fill = Math.max(
            0,
            Math.min(
              1,
              value - index,
            ),
          );

          return (
            <span
              key={index}
              className="relative block shrink-0"
              style={{
                width: size,
                height: size,
              }}
            >
              <Star
                size={size}
                strokeWidth={0}
                fill="currentColor"
                className="absolute inset-0 text-zinc-700"
              />

              {fill > 0 ? (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{
                    width: `${fill * 100}%`,
                  }}
                >
                  <Star
                    size={size}
                    strokeWidth={0}
                    fill="currentColor"
                    className="text-emerald-400"
                  />
                </span>
              ) : null}
            </span>
          );
        },
      )}
    </div>
  );
}

/* =========================================================
   LIST CARD
========================================================= */

function ReviewCard({
  review,
  onOpen,
}: {
  review: MediaReviewItem;

  onOpen: (
    review: MediaReviewItem,
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onOpen(review)
      }
      aria-label={`Abrir reseña de ${review.displayName}`}
      className="group w-full rounded-xl border border-white/[0.08] bg-white/[0.018] p-4 text-left transition hover:border-white/[0.15] hover:bg-white/[0.035] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/60 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            review={review}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-200">
              {review.displayName}
            </p>

            <p className="mt-0.5 text-[11px] text-zinc-600">
              {formatDate(
                review.createdAt,
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {review.liked ? (
            <Heart
              size={14}
              fill="currentColor"
              className="text-rose-400"
            />
          ) : null}

          {review.rating !==
          null ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:block">
                <ReviewStars
                  value={review.rating}
                  size={12}
                />
              </span>

              <span className="text-xs font-semibold text-emerald-300">
                {review.rating.toFixed(
                  1,
                )}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {review.containsSpoilers ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-amber-300/70">
          <ShieldAlert
            size={14}
          />

          Contiene spoilers
        </div>
      ) : (
        <p className="mt-4 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-400">
          {review.reviewText}
        </p>
      )}
    </button>
  );
}

function ReviewGrid({
  reviews,
  onOpen,
}: {
  reviews: MediaReviewItem[];

  onOpen: (
    review: MediaReviewItem,
  ) => void;
}) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {reviews.map(
        (review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onOpen={onOpen}
          />
        ),
      )}
    </div>
  );
}

function SectionHeading({
  children,
}: {
  children: string;
}) {
  return (
    <div className="border-b border-white/10 pb-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.21em] text-zinc-500">
        {children}
      </h2>
    </div>
  );
}

/* =========================================================
   USER
========================================================= */

function ReviewUser({
  review,
}: {
  review: MediaReviewItem;
}) {
  const profileHref =
    review.username
      ? `/profile/${encodeURIComponent(
          review.username,
        )}`
      : null;

  const content = (
    <>
      <UserAvatar
        review={review}
        size={42}
      />

      <p className="min-w-0 truncate text-[17px] font-semibold text-zinc-100">
        {review.displayName}
      </p>
    </>
  );

  if (!profileHref) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={profileHref}
      className="flex min-w-0 items-center gap-3 transition hover:opacity-80"
    >
      {content}
    </Link>
  );
}

/* =========================================================
   POSTER
========================================================= */

function ReviewPoster({
  src,
  title,
}: {
  src:
    | string
    | null;

  title: string;
}) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-900 shadow-[0_12px_36px_rgba(0,0,0,0.32)]">
      {src ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 639px) 86px, 185px"
          unoptimized={shouldUseOriginalImage(
            src,
          )}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-700">
          Sin portada
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RATING
========================================================= */

function ReviewRating({
  review,
}: {
  review: MediaReviewItem;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {review.rating !==
      null ? (
        <div className="flex items-center gap-2">
          <ReviewStars
            value={review.rating}
            size={16}
          />

          <span className="text-sm text-zinc-400">
            {review.rating.toFixed(
              1,
            )}
          </span>
        </div>
      ) : null}

      {review.liked ? (
        <Heart
          size={19}
          fill="currentColor"
          className="text-rose-400"
          aria-label="Le gustó"
        />
      ) : null}
    </div>
  );
}

/* =========================================================
   REVIEW TEXT
========================================================= */

function ReviewText({
  review,
}: {
  review: MediaReviewItem;
}) {
  if (
    review.containsSpoilers
  ) {
    return (
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-amber-300">
          <ShieldAlert
            size={16}
          />

          Esta reseña contiene spoilers

          <span className="text-xs text-zinc-600 group-open:hidden">
            — mostrar
          </span>
        </summary>

        <p className="mt-4 whitespace-pre-wrap break-words text-[16px] leading-7 text-zinc-300">
          {review.reviewText}
        </p>
      </details>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words text-[16px] leading-7 text-zinc-300">
      {review.reviewText}
    </p>
  );
}

/* =========================================================
   MODAL
========================================================= */

interface ReviewModalProps {
  review: MediaReviewItem;

  mediaTitle: string;

  mediaYear:
    | number
    | null;

  mediaPosterUrl:
    | string
    | null;

  mediaTypeLabel: string;

  onClose: () => void;
}

function ReviewModal({
  review,

  mediaTitle,
  mediaYear,
  mediaPosterUrl,
  mediaTypeLabel,

  onClose,
}: ReviewModalProps) {
  const reviewDate =
    formatDate(
      review.createdAt,
    );

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <article className="relative max-h-[calc(100dvh-24px)] w-full max-w-[820px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#131820] shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
        {/* ==================================================
            MOBILE
        ================================================== */}

        <div className="p-5 sm:hidden">
          <ReviewUser
            review={review}
          />

          <div className="mt-5 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                {mediaTypeLabel}
              </p>

              <h3 className="mt-1.5 break-words text-[21px] font-bold leading-[1.08] tracking-[-0.025em] text-white">
                {mediaTitle}
              </h3>

              {mediaYear ? (
                <p className="mt-1.5 text-sm text-zinc-500">
                  {mediaYear}
                </p>
              ) : null}

              <div className="mt-4">
                <ReviewRating
                  review={review}
                />
              </div>

              <p className="mt-4 text-sm text-zinc-500">
                {reviewDate}
              </p>
            </div>

            <div className="w-[86px] shrink-0">
              <ReviewPoster
                src={mediaPosterUrl}
                title={mediaTitle}
              />
            </div>
          </div>

          <div className="mt-6">
            <ReviewText
              review={review}
            />
          </div>

          <div className="mt-6">
            <ActivityLikeButton
              key={review.id}
              reviewId={review.id}
              variant="review"
            />
          </div>
        </div>

        {/* ==================================================
            DESKTOP
        ================================================== */}

        <div className="hidden p-7 sm:block">
          <ReviewUser
            review={review}
          />

          <div className="mt-7 grid grid-cols-[minmax(0,1fr)_185px] items-start gap-8">
            {/* CONTENT */}

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                {mediaTypeLabel}
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <h3 className="max-w-[480px] break-words text-[34px] font-bold leading-[1.04] tracking-[-0.03em] text-white">
                  {mediaTitle}
                </h3>

                {mediaYear ? (
                  <span className="text-[22px] font-normal text-zinc-500">
                    {mediaYear}
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                <ReviewRating
                  review={review}
                />
              </div>

              <p className="mt-5 text-[14px] text-zinc-500">
                {reviewDate}
              </p>

              <div className="mt-7 max-w-[500px]">
                <ReviewText
                  review={review}
                />
              </div>

              <div className="mt-7">
                <ActivityLikeButton
                  key={review.id}
                  reviewId={review.id}
                  variant="review"
                />
              </div>
            </div>

            {/* POSTER RIGHT */}

            <div className="w-[185px]">
              <ReviewPoster
                src={mediaPosterUrl}
                title={mediaTitle}
              />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function MediaReviews({
  friendReviews,
  reviews,

  mediaTitle,
  mediaYear,
  mediaPosterUrl,
  mediaTypeLabel,
}: MediaReviewsProps) {
  const [
    openedReview,
    setOpenedReview,
  ] =
    useState<
      MediaReviewItem |
      null
    >(null);

  useEffect(() => {
    if (
      !openedReview
    ) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpenedReview(
          null,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    openedReview,
  ]);

  const hasFriendReviews =
    friendReviews.length >
    0;

  const hasCommunityReviews =
    reviews.length >
    0;

  const hasAnyReviews =
    hasFriendReviews ||
    hasCommunityReviews;

  return (
    <>
      <div className="space-y-7">
        {hasFriendReviews ? (
          <section>
            <SectionHeading>
              Reseñas de amigos
            </SectionHeading>

            <ReviewGrid
              reviews={
                friendReviews
              }
              onOpen={
                setOpenedReview
              }
            />
          </section>
        ) : null}

        {hasCommunityReviews ? (
          <section>
            <SectionHeading>
              Reseñas
            </SectionHeading>

            <ReviewGrid
              reviews={reviews}
              onOpen={
                setOpenedReview
              }
            />
          </section>
        ) : null}

        {!hasAnyReviews ? (
          <section>
            <SectionHeading>
              Reseñas
            </SectionHeading>

            <div className="py-4">
              <p className="text-sm text-zinc-400">
                Aún no hay reseñas.
              </p>

              <p className="mt-1.5 text-sm text-zinc-600">
                Sé el primero en escribir una.
              </p>
            </div>
          </section>
        ) : null}
      </div>

      {openedReview ? (
        <ReviewModal
          review={openedReview}
          mediaTitle={mediaTitle}
          mediaYear={mediaYear}
          mediaPosterUrl={
            mediaPosterUrl
          }
          mediaTypeLabel={
            mediaTypeLabel
          }
          onClose={() =>
            setOpenedReview(
              null,
            )
          }
        />
      ) : null}
    </>
  );
}