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
      className="relative shrink-0 overflow-hidden rounded-full bg-frost-surface"
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
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-frost-muted">
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
      className="flex items-center gap-0.5"
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
                className="absolute inset-0 text-frost-muted"
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
      className="group w-full rounded-xl border border-frost-border/80 bg-frost-surface/20 p-4 text-left transition hover:border-frost-accent/35 hover:bg-frost-surface/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-frost-accent/60 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            review={review}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-frost-text">
              {review.displayName}
            </p>

            <p className="mt-0.5 frost-reviews-text-11 text-frost-muted">
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
              className="text-red-500"
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
        <p className="mt-4 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-7 text-frost-muted">
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
    <div className="border-b border-frost-border/60 pb-3">
      <h2 className="frost-reviews-text-11 font-semibold uppercase frost-reviews-track-021 text-frost-muted">
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

      <p className="min-w-0 truncate frost-reviews-text-17 font-semibold text-frost-text">
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
    <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-frost-surface frost-reviews-poster-shadow">
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
        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-frost-muted">
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

          <span className="text-sm text-frost-muted">
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
          className="text-red-500"
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

          <span className="text-xs text-frost-muted group-open:hidden">
            — mostrar
          </span>
        </summary>

        <p className="mt-4 whitespace-pre-wrap break-words frost-reviews-text-16 leading-7 text-frost-text">
          {review.reviewText}
        </p>
      </details>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words frost-reviews-text-16 leading-7 text-frost-text">
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
      className="fixed inset-0 frost-reviews-z-250 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
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
      <article className="relative frost-reviews-modal-max-height w-full frost-reviews-modal-width overflow-y-auto rounded-2xl border border-frost-border/80 bg-frost-surface frost-reviews-modal-shadow">
        {/* ==================================================
            MOBILE
        ================================================== */}

        <div className="p-5 sm:hidden">
          <ReviewUser
            review={review}
          />

          <div className="mt-5 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="frost-reviews-text-9 font-semibold uppercase frost-reviews-track-020 text-frost-muted">
                {mediaTypeLabel}
              </p>

              <h3 className="mt-1.5 break-words frost-reviews-text-21 font-bold frost-reviews-leading-108 frost-reviews-track-neg025 text-frost-text">
                {mediaTitle}
              </h3>

              {mediaYear ? (
                <p className="mt-1.5 text-sm text-frost-muted">
                  {mediaYear}
                </p>
              ) : null}

              <div className="mt-4">
                <ReviewRating
                  review={review}
                />
              </div>

              <p className="mt-4 text-sm text-frost-muted">
                {reviewDate}
              </p>
            </div>

            <div className="frost-reviews-width-86 shrink-0">
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

          <div className="mt-7 grid frost-reviews-modal-grid items-start gap-8">
            {/* CONTENT */}

            <div className="min-w-0">
              <p className="frost-reviews-text-10 font-semibold uppercase frost-reviews-track-020 text-frost-muted">
                {mediaTypeLabel}
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <h3 className="frost-reviews-width-480 break-words frost-reviews-text-34 font-bold frost-reviews-leading-104 frost-reviews-track-neg03 text-frost-text">
                  {mediaTitle}
                </h3>

                {mediaYear ? (
                  <span className="frost-reviews-text-22 font-normal text-frost-muted">
                    {mediaYear}
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                <ReviewRating
                  review={review}
                />
              </div>

              <p className="mt-5 frost-reviews-text-14 text-frost-muted">
                {reviewDate}
              </p>

              <div className="mt-7 frost-reviews-width-500">
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

            <div className="frost-reviews-width-185">
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
      <style>{`
        .frost-reviews-z-250 { z-index: 250; }
        .frost-reviews-modal-width { max-width: 820px; }
        .frost-reviews-modal-max-height { max-height: calc(100dvh - 24px); }
        .frost-reviews-width-480 { max-width: 480px; }
        .frost-reviews-width-500 { max-width: 500px; }
        .frost-reviews-width-86 { width: 86px; }
        .frost-reviews-width-185 { width: 185px; }
        .frost-reviews-modal-grid { grid-template-columns: minmax(0,1fr) 185px; }
        .frost-reviews-modal-shadow { box-shadow: 0 30px 100px rgba(0,0,0,.75); }
        .frost-reviews-poster-shadow { box-shadow: 0 12px 36px rgba(0,0,0,.32); }
        .frost-reviews-track-neg025 { letter-spacing: -.025em; }
        .frost-reviews-track-neg03 { letter-spacing: -.03em; }
        .frost-reviews-track-021 { letter-spacing: .21em; }
        .frost-reviews-track-020 { letter-spacing: .2em; }
        .frost-reviews-leading-104 { line-height: 1.04; }
        .frost-reviews-leading-108 { line-height: 1.08; }
        .frost-reviews-text-9 { font-size: 9px; }
        .frost-reviews-text-10 { font-size: 10px; }
        .frost-reviews-text-11 { font-size: 11px; }
        .frost-reviews-text-14 { font-size: 14px; }
        .frost-reviews-text-16 { font-size: 16px; }
        .frost-reviews-text-17 { font-size: 17px; }
        .frost-reviews-text-21 { font-size: 21px; }
        .frost-reviews-text-22 { font-size: 22px; }
        .frost-reviews-text-34 { font-size: 34px; }
      `}</style>
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
              <p className="text-sm text-frost-muted">
                Aún no hay reseñas.
              </p>

              <p className="mt-1.5 text-sm text-frost-muted">
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