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
              className="relative h-3.5 w-3.5 shrink-0"
            >
              <Star
                size={14}
                strokeWidth={0}
                fill="currentColor"
                className="absolute inset-0 text-frost-raised"
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
    <section className="mt-5 border-t border-frost-border pt-4">
      <style>{`
        .frost-ratings-grid { grid-template-columns: minmax(0,1fr) auto; }
        .frost-ratings-bars-height { height: 58px; }
        .frost-ratings-bars-gap { gap: 3px; }
        .frost-ratings-bar-radius { border-radius: 1px; }
        .frost-ratings-average-width { min-width: 76px; }
        .frost-ratings-text-9 { font-size: 9px; }
        .frost-ratings-text-10 { font-size: 10px; }
        .frost-ratings-track-018 { letter-spacing: .18em; }
        .frost-ratings-track-012 { letter-spacing: .12em; }
        .frost-ratings-average-track { letter-spacing: -.04em; }
        @media (min-width: 640px) {
          .frost-ratings-bars-height { height: 64px; }
          .frost-ratings-average-width { min-width: 90px; }
          .frost-ratings-sm-text-34 { font-size: 34px; }
        }
      `}</style>
      <div className="flex items-center justify-between gap-4">
        <h2 className="frost-ratings-text-10 font-semibold uppercase frost-ratings-track-018 text-frost-muted">
          Valoraciones
        </h2>

        {stats.count >
        0 ? (
          <p className="frost-ratings-text-10 uppercase frost-ratings-track-012 text-frost-muted">
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
          <p className="text-sm text-frost-muted">
            Todavía no hay valoraciones.
          </p>

          <p className="mt-1 text-xs text-frost-muted">
            Sé el primero en valorar este título.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid frost-ratings-grid items-end gap-5 sm:gap-8">
          {/* HISTOGRAM */}

          <div className="min-w-0">
            <div className="flex frost-ratings-bars-height items-end frost-ratings-bars-gap  sm:gap-1">
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
                        className={`w-full frost-ratings-bar-radius ${
                          bucket.count >
                          0
                            ? "bg-frost-muted/80"
                            : "bg-frost-raised"
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

            <div className="mt-1.5 flex items-center justify-between frost-ratings-text-9 font-medium text-frost-muted">
              <span>
                ½
              </span>

              <span>
                ★★★★★
              </span>
            </div>
          </div>

          {/* AVERAGE */}

          <div className="frost-ratings-average-width pb-0.5 text-right ">
            <p className="text-3xl font-light leading-none frost-ratings-average-track text-frost-muted frost-ratings-sm-text-34">
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