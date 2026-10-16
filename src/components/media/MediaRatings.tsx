import {
  Star,
} from "lucide-react";

import type {
  MediaRatingStats,
} from "@/lib/media-ratings";

interface MediaRatingsProps {
  stats: MediaRatingStats;
}

function RatingStars({
  value,
}: {
  value: number;
}) {
  return (
    <div
      className="flex items-center justify-end"
      aria-label={`${value.toFixed(1)} de 5 estrellas`}
    >
      {[0, 1, 2, 3, 4].map(
        (
          index,
        ) => {
          const fillAmount =
            Math.max(
              0,
              Math.min(
                1,
                value -
                  index,
              ),
            );

          return (
            <div
              key={index}
              className="relative h-[14px] w-[14px] shrink-0"
            >
              <Star
                size={14}
                strokeWidth={0}
                fill="currentColor"
                className="absolute inset-0 text-zinc-800"
              />

              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{
                  width:
                    `${fillAmount * 100}%`,
                }}
              >
                <Star
                  size={14}
                  strokeWidth={0}
                  fill="currentColor"
                  className="text-emerald-400"
                />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}

export default function MediaRatings({
  stats,
}: MediaRatingsProps) {
  const maximumBucket =
    Math.max(
      1,
      ...stats.buckets.map(
        (
          bucket,
        ) =>
          bucket.count,
      ),
    );

  return (
    <section className="mt-5 border-t border-white/8 pt-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Valoraciones
        </h2>

        {stats.count >
        0 ? (
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
            {new Intl.NumberFormat(
              "es-MX",
            ).format(
              stats.count,
            )}{" "}
            {stats.count ===
            1
              ? "valoración"
              : "valoraciones"}
          </p>
        ) : null}
      </div>

      {stats.count ===
      0 ||
      stats.average ===
        null ? (
        <div className="mt-4">
          <p className="text-sm text-zinc-500">
            Todavía no hay valoraciones.
          </p>

          <p className="mt-1 text-xs text-zinc-700">
            Sé el primero en valorar este título.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5 sm:gap-8">
          {/* HISTOGRAM */}

          <div className="min-w-0">
            <div className="flex h-[58px] items-end gap-[3px] sm:h-[64px] sm:gap-1">
              {stats.buckets.map(
                (
                  bucket,
                ) => {
                  const ratio =
                    bucket.count /
                    maximumBucket;

                  const height =
                    bucket.count ===
                    0
                      ? 2
                      : Math.max(
                          5,
                          Math.round(
                            ratio *
                              100,
                          ),
                        );

                  return (
                    <div
                      key={
                        bucket.value
                      }
                      className="flex h-full min-w-0 flex-1 items-end"
                      title={`${bucket.value} ★ · ${bucket.count}`}
                    >
                      <div
                        className={`w-full rounded-[1px] ${
                          bucket.count >
                          0
                            ? "bg-zinc-500/80"
                            : "bg-zinc-800"
                        }`}
                        style={{
                          height:
                            `${height}%`,
                        }}
                      />
                    </div>
                  );
                },
              )}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[9px] font-medium text-zinc-700">
              <span>
                ½
              </span>

              <span>
                ★★★★★
              </span>
            </div>
          </div>

          {/* AVERAGE */}

          <div className="min-w-[76px] pb-0.5 text-right sm:min-w-[90px]">
            <p className="text-3xl font-light leading-none tracking-[-0.04em] text-zinc-400 sm:text-[34px]">
              {stats.average.toFixed(
                1,
              )}
            </p>

            <div className="mt-2">
              <RatingStars
                value={
                  stats.average
                }
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}