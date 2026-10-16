"use client";

import {
  CircleCheck,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

type SeasonSummary = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;

  poster_path?:
    | string
    | null;
};

type Episode = {
  id: number;
  name: string;

  overview?: string;

  episode_number: number;
  season_number: number;

  air_date?:
    | string
    | null;

  still_path?:
    | string
    | null;
};

type SeasonDetails = {
  id: number;
  name: string;
  season_number: number;
  episodes: Episode[];
};

type EpisodeWatch = {
  id: string;
  season_number: number;
  episode_number: number;
  is_rewatch: boolean;
  watched_at: string;
  created_at: string;
};

interface SeasonsProps {
  seriesId: number;
  seriesTitle: string;

  posterUrl:
    | string
    | null;

  seasons: SeasonSummary[];
}

function getToday() {
  const now =
    new Date();

  const local =
    new Date(
      now.getTime() -
        now.getTimezoneOffset() *
          60_000,
    );

  return local
    .toISOString()
    .slice(
      0,
      10,
    );
}

function formatDate(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

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

        timeZone:
          "UTC",
      },
    ).format(
      new Date(
        `${value}T00:00:00Z`,
      ),
    );
  } catch {
    return value;
  }
}

export default function Seasons({
  seriesId,
  seriesTitle,
  posterUrl,
  seasons,
}: SeasonsProps) {
  const [
    supabase,
  ] =
    useState(
      () =>
        createClient(),
    );

  const visibleSeasons =
    useMemo(
      () =>
        seasons
          .filter(
            (
              season,
            ) =>
              season.season_number >
                0 &&
              season.episode_count >
                0,
          )
          .sort(
            (
              first,
              second,
            ) =>
              first.season_number -
              second.season_number,
          ),
      [
        seasons,
      ],
    );

  const totalEpisodes =
    useMemo(
      () =>
        visibleSeasons.reduce(
          (
            total,
            season,
          ) =>
            total +
            season.episode_count,
          0,
        ),
      [
        visibleSeasons,
      ],
    );

  const [
    selectedSeason,
    setSelectedSeason,
  ] =
    useState<
      number |
      null
    >(null);

  const activeSeason =
    selectedSeason !==
      null &&
    visibleSeasons.some(
      (
        season,
      ) =>
        season.season_number ===
        selectedSeason,
    )
      ? selectedSeason
      : visibleSeasons[0]
          ?.season_number ??
        null;

  const [
    seasonData,
    setSeasonData,
  ] =
    useState<
      Record<
        number,
        SeasonDetails
      >
    >({});

  const [
    loadingSeason,
    setLoadingSeason,
  ] =
    useState(false);

  const [
    watches,
    setWatches,
  ] =
    useState<
      EpisodeWatch[]
    >([]);

  const [
    expandedEpisode,
    setExpandedEpisode,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    message,
    setMessage,
  ] =
    useState("");

  /* =======================================================
     WATCH HISTORY
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function loadWatches() {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (
        !user ||
        cancelled
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "episode_watches",
          )
          .select(`
            id,
            season_number,
            episode_number,
            is_rewatch,
            watched_at,
            created_at
          `)
          .eq(
            "user_id",
            user.id,
          )
          .eq(
            "series_id",
            String(
              seriesId,
            ),
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          );

      if (
        cancelled
      ) {
        return;
      }

      if (error) {
        console.error(
          "Error loading episode watches:",
          error,
        );

        return;
      }

      setWatches(
        data ?? [],
      );
    }

    void loadWatches();

    return () => {
      cancelled =
        true;
    };
  }, [
    seriesId,
    supabase,
  ]);

  /* =======================================================
     LOAD SEASON
  ======================================================= */

  useEffect(() => {
    if (
      activeSeason ===
        null ||
      seasonData[
        activeSeason
      ]
    ) {
      return;
    }

    const seasonNumber =
      activeSeason;

    let cancelled =
      false;

    async function loadSeason() {
      setLoadingSeason(
        true,
      );

      setMessage("");

      try {
        const params =
          new URLSearchParams({
            seriesId:
              String(
                seriesId,
              ),

            seasonNumber:
              String(
                seasonNumber,
              ),
          });

        const response =
          await fetch(
            `/api/season?${params.toString()}`,
          );

        if (
          !response.ok
        ) {
          const errorText =
            await response.text();

          console.error(
            "Season API error:",
            response.status,
            errorText,
          );

          throw new Error(
            "No se pudo cargar la temporada.",
          );
        }

        const data =
          (await response.json()) as SeasonDetails;

        if (
          cancelled
        ) {
          return;
        }

        setSeasonData(
          (
            current,
          ) => ({
            ...current,

            [seasonNumber]:
              data,
          }),
        );
      } catch (error) {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "Error loading season:",
          error,
        );

        setMessage(
          "No se pudo cargar la temporada.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoadingSeason(
            false,
          );
        }
      }
    }

    void loadSeason();

    return () => {
      cancelled =
        true;
    };
  }, [
    activeSeason,
    seasonData,
    seriesId,
  ]);

  /* =======================================================
     WATCH HELPERS
  ======================================================= */

  function getEpisodeWatches(
    seasonNumber: number,
    episodeNumber: number,
  ) {
    return watches.filter(
      (
        watch,
      ) =>
        watch.season_number ===
          seasonNumber &&
        watch.episode_number ===
          episodeNumber,
    );
  }

  function getUniqueEpisodeCount(
    episodeWatches:
      EpisodeWatch[],
  ) {
    return new Set(
      episodeWatches
        .filter(
          (
            watch,
          ) =>
            watch.season_number >
            0,
        )
        .map(
          (
            watch,
          ) =>
            `${watch.season_number}-${watch.episode_number}`,
        ),
    ).size;
  }

  function hasCompletedSeries(
    episodeWatches:
      EpisodeWatch[],
  ) {
    return (
      totalEpisodes >
        0 &&
      getUniqueEpisodeCount(
        episodeWatches,
      ) >=
        totalEpisodes
    );
  }

  const watchedEpisodes =
    getUniqueEpisodeCount(
      watches,
    );

  const activeSeasonSummary =
    visibleSeasons.find(
      (
        season,
      ) =>
        season.season_number ===
        activeSeason,
    );

  const watchedInSeason =
    activeSeason ===
    null
      ? 0
      : new Set(
          watches
            .filter(
              (
                watch,
              ) =>
                watch.season_number ===
                activeSeason,
            )
            .map(
              (
                watch,
              ) =>
                watch.episode_number,
            ),
        ).size;

  /* =======================================================
     LIBRARY
  ======================================================= */

  async function markSeriesAsWatching(
    userId: string,
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "library_items",
        )
        .upsert(
          {
            user_id:
              userId,

            media_type:
              "SERIES",

            external_id:
              String(
                seriesId,
              ),

            title:
              seriesTitle,

            cover_url:
              posterUrl,

            status:
              "IN_PROGRESS",
          },
          {
            onConflict:
              "user_id,media_type,external_id",
          },
        );

    if (error) {
      console.error(
        "Error marking series as watching:",
        error,
      );
    }
  }

  /* =======================================================
     ACTIVITY
  ======================================================= */

  async function createEpisodeActivity(
    userId: string,
    episode: Episode,
    episodeWatchId: string,
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "activity_events",
        )
        .insert({
          user_id:
            userId,

          activity_type:
            "EPISODE_WATCHED",

          media_type:
            "SERIES",

          external_id:
            String(
              seriesId,
            ),

          title:
            seriesTitle,

          cover_url:
            posterUrl,

          episode_watch_id:
            episodeWatchId,

          season_number:
            episode.season_number,

          episode_number:
            episode.episode_number,

          episode_title:
            episode.name,
        });

    if (error) {
      console.error(
        "Error creating episode activity:",
        error,
      );
    }
  }

  /* =======================================================
     MARK WATCHED
  ======================================================= */

  async function markEpisodeWatched(
    episode: Episode,
    isRewatch: boolean,
  ) {
    setMessage("");

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Debes iniciar sesión.",
      );

      return;
    }

    const wasCompleted =
      hasCompletedSeries(
        watches,
      );

    const stillUrl =
      episode.still_path
        ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
        : null;

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "episode_watches",
        )
        .insert({
          user_id:
            user.id,

          series_id:
            String(
              seriesId,
            ),

          series_title:
            seriesTitle,

          season_number:
            episode.season_number,

          episode_number:
            episode.episode_number,

          episode_id:
            String(
              episode.id,
            ),

          episode_title:
            episode.name,

          series_cover_url:
            posterUrl,

          episode_still_url:
            stillUrl,

          is_rewatch:
            isRewatch,

          watched_at:
            getToday(),
        })
        .select(`
          id,
          season_number,
          episode_number,
          is_rewatch,
          watched_at,
          created_at
        `)
        .single();

    if (error) {
      setMessage(
        error.message,
      );

      return;
    }

    if (!data) {
      return;
    }

    await createEpisodeActivity(
      user.id,
      episode,
      data.id,
    );

    const updatedWatches =
      [
        data,
        ...watches,
      ];

    setWatches(
      updatedWatches,
    );

    await markSeriesAsWatching(
      user.id,
    );

    setExpandedEpisode(
      null,
    );

    if (
      !wasCompleted &&
      hasCompletedSeries(
        updatedWatches,
      ) &&
      !isRewatch
    ) {
      setMessage(
        "Has visto todos los episodios.",
      );

      window.dispatchEvent(
        new CustomEvent(
          "series-completed",
          {
            detail: {
              seriesId,
            },
          },
        ),
      );

      return;
    }

    setMessage(
      isRewatch
        ? "Rewatch del episodio guardado."
        : "Episodio marcado como visto.",
    );
  }

  /* =======================================================
     REMOVE WATCH
  ======================================================= */

  async function removeLatestWatch(
    episode: Episode,
  ) {
    const episodeWatches =
      getEpisodeWatches(
        episode.season_number,
        episode.episode_number,
      );

    if (
      episodeWatches.length ===
      0
    ) {
      return;
    }

    const latest =
      episodeWatches[0];

    const {
      error,
    } =
      await supabase
        .from(
          "episode_watches",
        )
        .delete()
        .eq(
          "id",
          latest.id,
        );

    if (error) {
      setMessage(
        error.message,
      );

      return;
    }

    setWatches(
      (
        current,
      ) =>
        current.filter(
          (
            watch,
          ) =>
            watch.id !==
            latest.id,
        ),
    );

    setExpandedEpisode(
      null,
    );

    setMessage(
      "Última visualización eliminada.",
    );
  }

  /* =======================================================
     CURRENT SEASON
  ======================================================= */

  const currentSeason =
    activeSeason !==
    null
      ? seasonData[
          activeSeason
        ]
      : undefined;

  if (
    visibleSeasons.length ===
    0
  ) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section className="mt-12">
      {/* HEADER */}

      <div className="flex items-end justify-between gap-4 border-b border-white/[0.09] pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Episodios
          </p>

          <h2 className="mt-1 text-xl font-semibold text-zinc-100 sm:text-2xl">
            Temporadas
          </h2>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-200">
              {
                watchedEpisodes
              }
            </span>

            {" / "}

            {totalEpisodes}
          </p>

          <p className="mt-0.5 text-[10px] text-zinc-700">
            episodios vistos
          </p>
        </div>
      </div>

      {/* SEASONS */}

      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-7 border-b border-white/[0.07]">
          {visibleSeasons.map(
            (
              season,
            ) => {
              const active =
                activeSeason ===
                season.season_number;

              return (
                <button
                  key={
                    season.id
                  }
                  type="button"
                  onClick={() => {
                    setExpandedEpisode(
                      null,
                    );

                    setSelectedSeason(
                      season.season_number,
                    );
                  }}
                  className={`relative py-4 text-sm font-medium transition ${
                    active
                      ? "text-zinc-100"
                      : "text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  <span className="sm:hidden">
                    T
                    {
                      season.season_number
                    }
                  </span>

                  <span className="hidden sm:inline">
                    Temporada{" "}
                    {
                      season.season_number
                    }
                  </span>

                  {active ? (
                    <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-fuchsia-400" />
                  ) : null}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* PROGRESS */}

      {activeSeasonSummary ? (
        <div className="mt-5 flex items-center justify-between gap-3 text-xs">
          <p className="text-zinc-500">
            Temporada{" "}
            {
              activeSeasonSummary.season_number
            }
          </p>

          <p className="text-zinc-600">
            {watchedInSeason}
            {" / "}
            {
              activeSeasonSummary.episode_count
            }{" "}
            vistos
          </p>
        </div>
      ) : null}

      {/* EPISODES */}

      <div className="mt-4">
        {loadingSeason ? (
          <div className="space-y-3">
            {[0, 1, 2].map(
              (
                item,
              ) => (
                <div
                  key={
                    item
                  }
                  className="h-[220px] animate-pulse rounded-xl bg-white/[0.025] sm:h-[145px]"
                />
              ),
            )}
          </div>
        ) : !currentSeason ? (
          <p className="py-12 text-center text-sm text-zinc-600">
            No se pudieron cargar los episodios.
          </p>
        ) : (
          <div className="space-y-3">
            {currentSeason.episodes.map(
              (
                episode,
              ) => {
                const episodeWatches =
                  getEpisodeWatches(
                    episode.season_number,
                    episode.episode_number,
                  );

                const watched =
                  episodeWatches.length >
                  0;

                const key =
                  `${episode.season_number}-${episode.episode_number}`;

                const expanded =
                  expandedEpisode ===
                  key;

                const date =
                  formatDate(
                    episode.air_date,
                  );

                return (
                  <article
                    key={
                      episode.id
                    }
                    className={`overflow-hidden rounded-xl border transition ${
                      watched
                        ? "border-emerald-400/[0.15] bg-emerald-400/[0.025]"
                        : "border-white/[0.075] bg-white/[0.018]"
                    }`}
                  >
                    <div className="sm:grid sm:grid-cols-[210px_minmax(0,1fr)]">
                      {/* STILL */}

                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950 sm:aspect-auto sm:min-h-[138px]">
                        {episode.still_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                            alt={
                              episode.name
                            }
                            fill
                            sizes="(max-width: 639px) 100vw, 210px"
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-[138px] items-center justify-center text-xs text-zinc-700">
                            Sin imagen
                          </div>
                        )}

                        {watched ? (
                          <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-emerald-400 backdrop-blur-sm">
                            <CircleCheck
                              size={
                                16
                              }
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* CONTENT */}

                      <div className="flex min-w-0 flex-col p-4 sm:min-h-[138px] sm:p-5">
                        <div className="flex min-w-0 items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                              T
                              {
                                episode.season_number
                              }

                              {" · "}

                              E
                              {
                                episode.episode_number
                              }
                            </p>

                            <h3 className="mt-1.5 text-[16px] font-medium leading-5 text-zinc-100">
                              {
                                episode.name
                              }
                            </h3>

                            {date ? (
                              <p className="mt-1.5 text-xs text-zinc-600">
                                {
                                  date
                                }
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {episode.overview ? (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400 sm:line-clamp-2">
                            {
                              episode.overview
                            }
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-zinc-600">
                            Sin descripción disponible.
                          </p>
                        )}

                        {/* ACTION */}

                        <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-auto sm:justify-end sm:pt-4">
                          {!watched ? (
                            <button
                              type="button"
                              onClick={() =>
                                void markEpisodeWatched(
                                  episode,
                                  false,
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.025] px-3.5 text-sm font-medium text-zinc-400 transition hover:border-fuchsia-400/30 hover:bg-fuchsia-400/[0.05] hover:text-zinc-100"
                            >
                              <CircleCheck
                                size={
                                  15
                                }
                              />

                              Marcar visto
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedEpisode(
                                  expanded
                                    ? null
                                    : key,
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/[0.11]"
                            >
                              <CircleCheck
                                size={
                                  15
                                }
                                fill="currentColor"
                                className="text-emerald-400"
                              />

                              Visto
                            </button>
                          )}

                          {episodeWatches.length >
                          1 ? (
                            <span className="text-xs text-zinc-600">
                              {
                                episodeWatches.length
                              }{" "}
                              visualizaciones
                            </span>
                          ) : null}
                        </div>

                        {/* EXTRA OPTIONS */}

                        {expanded ? (
                          <div className="mt-3 flex flex-wrap justify-start gap-1 border-t border-white/[0.06] pt-3 sm:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                void markEpisodeWatched(
                                  episode,
                                  true,
                                )
                              }
                              className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
                            >
                              <RotateCcw
                                size={
                                  14
                                }
                              />

                              Marcar rewatch
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void removeLatestWatch(
                                  episode,
                                )
                              }
                              className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-red-400/70 transition hover:bg-red-500/[0.06] hover:text-red-300"
                            >
                              <Trash2
                                size={
                                  14
                                }
                              />

                              Quitar último visto
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>

      {message ? (
        <p className="mt-4 text-sm text-zinc-500">
          {message}
        </p>
      ) : null}
    </section>
  );
}