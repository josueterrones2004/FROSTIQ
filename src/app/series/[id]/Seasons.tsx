"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CircleCheck, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { announceLibraryProgress } from "@/lib/library-progress-events";
import {
  findNextUnwatchedEpisode,
  formatNextEpisode,
} from "@/lib/series-progress";

export type SeasonSummary = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string | null;
};

type Episode = {
  id: number;
  name: string;
  overview?: string;
  episode_number: number;
  season_number: number;
  air_date?: string | null;
  still_path?: string | null;
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
  episode_title?: string | null;
  episode_still_url?: string | null;
};

export type SeasonsProps = {
  seriesId: number;
  seriesTitle: string;
  posterUrl: string | null;
  seasons: SeasonSummary[];
  embedded?: boolean;
};

const keyOf = (season: number, episode: number) =>
  `${season}:${episode}`;

const today = () => {
  const now = new Date();

  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 10);
};

function dateLabel(date?: string | null) {
  if (!date) return null;

  const parsed = new Date(`${date}T00:00:00Z`);

  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(parsed);
}

function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percent =
    max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className="flex min-w-0 items-center gap-3"
    >
      <div className="h-[5px] min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-fuchsia-400 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="shrink-0 text-xs tabular-nums text-zinc-400">
        {Math.round(percent)}%
      </span>
    </div>
  );
}

function LoadingIndicator({
  label,
}: {
  label: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[165px] flex-col items-center justify-center gap-4 py-8"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400 motion-reduce:animate-none"
      />

      <p className="text-xs font-medium text-zinc-500">
        {label}
      </p>
    </div>
  );
}

export default function Seasons({
  seriesId,
  seriesTitle,
  posterUrl,
  seasons,
  embedded = false,
}: SeasonsProps) {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  /* =========================================
     TEMPORADAS DISPONIBLES
  ========================================= */

  const available = useMemo(
    () =>
      seasons
        .filter(
          (season) =>
            season.season_number > 0 &&
            season.episode_count > 0,
        )
        .sort(
          (a, b) =>
            a.season_number - b.season_number,
        ),
    [seasons],
  );

  const seasonNumbers = useMemo(
    () =>
      new Set(
        available.map(
          (season) => season.season_number,
        ),
      ),
    [available],
  );

  const total = useMemo(
    () =>
      available.reduce(
        (count, season) =>
          count + season.episode_count,
        0,
      ),
    [available],
  );

  /* =========================================
     ESTADOS
  ========================================= */

  const [ready, setReady] = useState(false);

  const [selected, setSelected] =
    useState<number | null>(null);

  const [details, setDetails] = useState<
    Record<number, SeasonDetails>
  >({});

  const [loading, setLoading] =
    useState<number | null>(null);

  const [watches, setWatches] =
    useState<EpisodeWatch[]>([]);

  const [expanded, setExpanded] =
    useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState("");
  const progressRequestRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const initialScrollDone = useRef(false);


  const active = ready
    ? selected !== null &&
      seasonNumbers.has(selected)
      ? selected
      : available[0]?.season_number ?? null
    : null;

  const season = available.find(
    (item) => item.season_number === active,
  );

  const current =
    active === null
      ? undefined
      : details[active];

  // El modal se abre en la primera temporada con pendientes.
  // Si el pendiente es el E1, conservamos una vista previa del último
  // episodio de la temporada anterior.
  const nextToWatch = useMemo(
    () => findNextUnwatchedEpisode(available, watches),
    [available, watches],
  );

  const previousSeason =
    nextToWatch?.episodeNumber === 1
      ? available.filter(
          (s) => s.season_number < nextToWatch.seasonNumber,
        ).at(-1)
      : undefined;

  const previousSeasonLastWatch = previousSeason
    ? watches.find(
        (w) =>
          w.season_number === previousSeason.season_number &&
          w.episode_number === previousSeason.episode_count,
      )
    : undefined;

  const showPreviousPreview =
    embedded &&
    nextToWatch?.seasonNumber === active &&
    nextToWatch.episodeNumber === 1 &&
    Boolean(previousSeasonLastWatch);

  const initialEpisodeNumber =
    nextToWatch?.seasonNumber === active
      ? Math.max(1, nextToWatch.episodeNumber - 1)
      : current?.episodes.at(-1)?.episode_number ?? 1;

  /* =========================================
     EPISODIOS VISTOS
  ========================================= */

  const seen = useMemo(
    () =>
      new Set(
        watches
          .filter(
            (watch) =>
              seasonNumbers.has(
                watch.season_number,
              ) &&
              watch.episode_number > 0,
          )
          .map((watch) =>
            keyOf(
              watch.season_number,
              watch.episode_number,
            ),
          ),
      ),
    [watches, seasonNumbers],
  );

  const seasonSeen =
    active === null
      ? 0
      : [...seen].filter((id) =>
          id.startsWith(`${active}:`),
        ).length;

  const seasonDone =
    !!season &&
    seasonSeen >= season.episode_count;

  function seriesDone(
    history: EpisodeWatch[],
  ) {
    return (
      total > 0 &&
      new Set(
        history
          .filter(
            (watch) =>
              seasonNumbers.has(
                watch.season_number,
              ) &&
              watch.episode_number > 0,
          )
          .map((watch) =>
            keyOf(
              watch.season_number,
              watch.episode_number,
            ),
          ),
      ).size >= total
    );
  }

  function watchesFor(
    episode: Episode,
  ) {
    return watches.filter(
      (watch) =>
        watch.season_number ===
          episode.season_number &&
        watch.episode_number ===
          episode.episode_number,
    );
  }

  /* =========================================
     SIGUIENTE EPISODIO PENDIENTE
  ========================================= */

  /* =========================================
     AVISAR AL CARRUSEL CON EL TÍTULO REAL
  ========================================= */

  function announceChange(
    history: EpisodeWatch[],
    updatedAt: string,
  ) {
    const requestId = ++progressRequestRef.current;
    const next = findNextUnwatchedEpisode(available, history);
    const knownTitle = next
      ? details[next.seasonNumber]?.episodes.find(
          (episode) => episode.episode_number === next.episodeNumber,
        )?.name ?? null
      : null;

    announceLibraryProgress({
      mediaType: "SERIES",
      externalId: String(seriesId),
      updatedAt,
      nextEpisode: next ? formatNextEpisode(next, knownTitle) : null,
    });

    router.refresh();

    if (!next || knownTitle) return;

    // La temporada siguiente puede no estar en memoria. Reutilizamos
    // la ruta existente /api/season y actualizamos el mismo carrusel.
    const params = new URLSearchParams({
      seriesId: String(seriesId),
      seasonNumber: String(next.seasonNumber),
    });

    void (async () => {
      try {
        const response = await fetch(`/api/season?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const seasonDetails = (await response.json()) as SeasonDetails;
        if (progressRequestRef.current !== requestId) return;

        const title = seasonDetails.episodes.find(
          (episode) => episode.episode_number === next.episodeNumber,
        )?.name ?? null;

        setDetails((currentDetails) => ({
          ...currentDetails,
          [next.seasonNumber]:
            currentDetails[next.seasonNumber] ?? seasonDetails,
        }));

        if (title) {
          announceLibraryProgress({
            mediaType: "SERIES",
            externalId: String(seriesId),
            updatedAt,
            nextEpisode: formatNextEpisode(next, title),
          });
        }
      } catch (error) {
        console.error("Error loading next episode title:", error);
      }
    })();
  }

  /* =========================================
     CARGAR HISTORIAL
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setReady(false);
      setSelected(null);
      setWatches([]);
      setDetails({});

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          return;
        }

        const { data, error } = await supabase
          .from("episode_watches")
          .select(
            "id,season_number,episode_number,episode_title,episode_still_url,is_rewatch,watched_at,created_at",
          )
          .eq("user_id", user.id)
          .eq(
            "series_id",
            String(seriesId),
          )
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        const history =
          (data ?? []) as EpisodeWatch[];

        setWatches(history);

        // Primera temporada con episodios pendientes.
        // No dependemos del último registro insertado.

        const next =
          findNextUnwatchedEpisode(
            available,
            history,
          );

        setSelected(
          next?.seasonNumber ??
            available.at(-1)
              ?.season_number ??
            null,
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Error loading episode history",
            error,
          );

          setMessage(
            "No se pudo consultar el historial de episodios.",
          );
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [seriesId, supabase, available]);

  /* =========================================
     CARGAR EPISODIOS DE TEMPORADA
  ========================================= */

  useEffect(() => {
    // No consultar si no existe una temporada
    // activa o si ya está en memoria.

    if (
      active === null ||
      details[active]
    ) {
      return;
    }

    let cancelled = false;
    const number = active;

    async function loadSeason() {
      setLoading(number);

      try {
        const params = new URLSearchParams({
          seriesId: String(seriesId),
          seasonNumber: String(number),
        });

        const response = await fetch(
          `/api/season?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar la temporada ${number} (HTTP ${response.status}).`,
          );
        }

        const data =
          (await response.json()) as SeasonDetails;

        if (!cancelled) {
          setDetails((old) => ({
            ...old,
            [number]: data,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "No se pudo cargar la temporada.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(null);
        }
      }
    }

    void loadSeason();

    return () => {
      cancelled = true;
    };
  }, [active, details, seriesId]);

  // Al abrir el modal, dejar el episodio visto precedente y el siguiente
  // en el área visible. Desplazamos solo el scroll interno del modal.
  useEffect(() => {
    if (!embedded || !ready || !current || initialScrollDone.current) return;

    const frame = window.requestAnimationFrame(() => {
      const target = sectionRef.current?.querySelector<HTMLElement>(
        '[data-progress-focus="true"]',
      );
      const scroller = target?.closest<HTMLElement>(".overflow-y-auto");
      if (!target || !scroller) return;

      const top = target.getBoundingClientRect().top;
      const containerTop = scroller.getBoundingClientRect().top;
      scroller.scrollTop += top - containerTop - 12;
      initialScrollDone.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [embedded, ready, current]);

  /* =========================================
     ACTUALIZAR ESTADO Y FECHA
  ========================================= */

  async function setWatching(
    userId: string,
    updatedAt: string,
  ) {
    const { error } = await supabase
      .from("library_items")
      .upsert(
        {
          user_id: userId,
          media_type: "SERIES",
          external_id: String(seriesId),
          title: seriesTitle,
          cover_url: posterUrl,
          status: "IN_PROGRESS",
          updated_at: updatedAt,
        },
        {
          onConflict:
            "user_id,media_type,external_id",
        },
      );

    if (error) {
      console.error(
        "Error setting series status",
        error,
      );
    }
  }

  /* =========================================
     ACTIVIDAD SOCIAL
  ========================================= */

  async function activity(
    userId: string,
    episode: Episode,
    watchId: string,
  ) {
    const { error } = await supabase
      .from("activity_events")
      .insert({
        user_id: userId,
        activity_type:
          "EPISODE_WATCHED",
        media_type: "SERIES",
        external_id: String(seriesId),
        title: seriesTitle,
        cover_url: posterUrl,
        episode_watch_id: watchId,
        season_number:
          episode.season_number,
        episode_number:
          episode.episode_number,
        episode_title: episode.name,
      });

    if (error) {
      console.error(
        "Error creating episode activity",
        error,
      );
    }
  }

  /* =========================================
     SERIE COMPLETADA
  ========================================= */

  function completed(
    updated: EpisodeWatch[],
    previouslyCompleted: boolean,
  ) {
    if (
      !previouslyCompleted &&
      seriesDone(updated)
    ) {
      setMessage(
        "Has visto todos los episodios.",
      );

      window.dispatchEvent(
        new CustomEvent(
          "series-completed",
          {
            detail: { seriesId },
          },
        ),
      );

      return true;
    }

    return false;
  }

  /* =========================================
     MARCAR EPISODIO VISTO
  ========================================= */

  async function addWatch(
    episode: Episode,
    repeat: boolean,
  ) {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Debes iniciar sesión.",
        );
      }

      const previousComplete =
        seriesDone(watches);

      const { data, error } = await supabase
        .from("episode_watches")
        .insert({
          user_id: user.id,
          series_id: String(seriesId),
          series_title: seriesTitle,
          season_number:
            episode.season_number,
          episode_number:
            episode.episode_number,
          episode_id: String(episode.id),
          episode_title: episode.name,
          series_cover_url: posterUrl,
          episode_still_url:
            episode.still_path
              ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
              : null,
          is_rewatch: repeat,
          watched_at: today(),
        })
        .select(
          "id,season_number,episode_number,episode_title,episode_still_url,is_rewatch,watched_at,created_at",
        )
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "No se confirmó el registro.",
        );
      }

      await activity(
        user.id,
        episode,
        data.id,
      );

      const updated: EpisodeWatch[] = [
        data as EpisodeWatch,
        ...watches,
      ];

      setWatches(updated);
      setExpanded(null);

      const updatedAt =
        new Date().toISOString();

      await setWatching(
        user.id,
        updatedAt,
      );

      announceChange(
        updated,
        updatedAt,
      );

      if (
        !completed(
          updated,
          previousComplete,
        )
      ) {
        setMessage(
          repeat
            ? "Rewatch del episodio guardado."
            : "Episodio marcado como visto.",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el episodio.",
      );
    } finally {
      setBusy(false);
    }
  }

  /* =========================================
     QUITAR ÚLTIMA VISUALIZACIÓN
  ========================================= */

  async function removeWatch(
    episode: Episode,
  ) {
    if (busy) return;

    const last = watchesFor(episode)[0];

    if (!last) return;

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("episode_watches")
        .delete()
        .eq("id", last.id);

      if (error) {
        throw error;
      }

      const updated =
        watches.filter(
          (watch) =>
            watch.id !== last.id,
        );

      setWatches(updated);
      setExpanded(null);

      const updatedAt =
        new Date().toISOString();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const {
          error: timestampError,
        } = await supabase
          .from("library_items")
          .update({
            updated_at: updatedAt,
          })
          .eq("user_id", user.id)
          .eq("media_type", "SERIES")
          .eq(
            "external_id",
            String(seriesId),
          );

        if (timestampError) {
          console.error(
            "Error updating series activity date",
            timestampError,
          );
        }
      }

      announceChange(
        updated,
        updatedAt,
      );

      setMessage(
        "Última visualización eliminada.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo quitar la visualización.",
      );
    } finally {
      setBusy(false);
    }
  }

  /* =========================================
     MARCAR TODA LA TEMPORADA COMO VISTA
  ========================================= */

  async function markSeason() {
    if (busy || !current) return;

    const missing =
      current.episodes.filter(
        (episode) =>
          episode.episode_number > 0 &&
          !seen.has(
            keyOf(
              episode.season_number,
              episode.episode_number,
            ),
          ),
      );

    if (!missing.length) {
      setMessage(
        "Ya has visto todos los episodios de esta temporada.",
      );

      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Debes iniciar sesión.",
        );
      }

      const previousComplete =
        seriesDone(watches);

      const rows = missing.map(
        (episode) => ({
          user_id: user.id,
          series_id: String(seriesId),
          series_title: seriesTitle,
          season_number:
            episode.season_number,
          episode_number:
            episode.episode_number,
          episode_id:
            String(episode.id),
          episode_title:
            episode.name,
          series_cover_url: posterUrl,
          episode_still_url:
            episode.still_path
              ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
              : null,
          is_rewatch: false,
          watched_at: today(),
        }),
      );

      const { data, error } =
        await supabase
          .from("episode_watches")
          .insert(rows)
          .select(
            "id,season_number,episode_number,episode_title,episode_still_url,is_rewatch,watched_at,created_at",
          );

      if (error) {
        throw error;
      }

      const added =
        (data ?? []) as EpisodeWatch[];

      if (
        added.length !== missing.length
      ) {
        throw new Error(
          "No se pudo confirmar toda la temporada.",
        );
      }

      const episodeMap = new Map(
        missing.map((episode) => [
          keyOf(
            episode.season_number,
            episode.episode_number,
          ),
          episode,
        ]),
      );

      const events = added.flatMap(
        (watch) => {
          const episode =
            episodeMap.get(
              keyOf(
                watch.season_number,
                watch.episode_number,
              ),
            );

          return episode
            ? [
                {
                  user_id: user.id,
                  activity_type:
                    "EPISODE_WATCHED",
                  media_type: "SERIES",
                  external_id:
                    String(seriesId),
                  title: seriesTitle,
                  cover_url: posterUrl,
                  episode_watch_id:
                    watch.id,
                  season_number:
                    episode.season_number,
                  episode_number:
                    episode.episode_number,
                  episode_title:
                    episode.name,
                },
              ]
            : [];
        },
      );

      if (events.length) {
        const {
          error: activityError,
        } = await supabase
          .from("activity_events")
          .insert(events);

        if (activityError) {
          console.error(
            "Error creating episode activities",
            activityError,
          );
        }
      }

      const updated: EpisodeWatch[] = [
        ...added,
        ...watches,
      ];

      setWatches(updated);
      setExpanded(null);

      const updatedAt =
        new Date().toISOString();

      await setWatching(
        user.id,
        updatedAt,
      );

      announceChange(
        updated,
        updatedAt,
      );

      if (
        !completed(
          updated,
          previousComplete,
        )
      ) {
        setMessage(
          `Se marcaron ${added.length} episodios como vistos.`,
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo completar la temporada.",
      );
    } finally {
      setBusy(false);
    }
  }

  /* =========================================
     INTERFAZ
  ========================================= */

  if (!available.length) return null;

  return (
    <section ref={sectionRef} className={embedded ? "" : "mt-12"}>
      {/* ENCABEZADO */}

      <div className="flex items-center justify-between gap-5 border-b border-white/[0.09] pb-4">
        <div className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Episodios
          </p>

          <h2 className="mt-1 text-xl font-semibold text-zinc-100 sm:text-2xl">
            Temporadas
          </h2>
        </div>

        {ready && seen.size > 0 && (
          <div className="w-[38%] min-w-[110px] max-w-[250px]">
            <Progress
              value={seen.size}
              max={total}
              label={`${seen.size} de ${total} episodios vistos`}
            />
          </div>
        )}
      </div>

      {!ready ? (
        <LoadingIndicator
          label="Cargando historial..."
        />
      ) : (
        <>
          {/* SELECTOR DE TEMPORADAS */}

          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-7 border-b border-white/[0.07]">
              {available.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    initialScrollDone.current = true;
                    setSelected(
                      item.season_number,
                    );
                    setExpanded(null);
                    setMessage("");
                  }}
                  className={`relative py-4 text-sm font-medium transition ${
                    active === item.season_number
                      ? "text-zinc-100"
                      : "text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  <span className="sm:hidden">
                    T{item.season_number}
                  </span>

                  <span className="hidden sm:inline">
                    Temporada{" "}
                    {item.season_number}
                  </span>

                  {active === item.season_number && (
                    <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-fuchsia-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* PROGRESO DE TEMPORADA */}

          {season && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                {seasonSeen > 0 && (
                  <Progress
                    value={seasonSeen}
                    max={season.episode_count}
                    label={`Temporada ${active}: ${seasonSeen} de ${season.episode_count} vistos`}
                  />
                )}
              </div>

              <button
                type="button"
                disabled={
                  busy ||
                  !current ||
                  loading !== null ||
                  seasonDone
                }
                onClick={() => void markSeason()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-fuchsia-400/30 hover:bg-fuchsia-400/[0.06] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CircleCheck size={15} />
                Marcar toda como vista
              </button>
            </div>
          )}

          {/* LISTADO DE EPISODIOS */}

          <div className="mt-4">
            {!current ? (
              loading === active ||
              (loading === null && !message) ? (
                <LoadingIndicator
                  label="Cargando episodios..."
                />
              ) : (
                <p className="py-12 text-center text-sm text-zinc-600">
                  No se pudieron cargar los episodios.
                </p>
              )
            ) : (
              <div className="space-y-3">
                {showPreviousPreview && previousSeasonLastWatch && (
                  <article
                    data-progress-focus="true"
                    className="overflow-hidden rounded-xl border border-emerald-400/15 bg-emerald-400/[0.025]"
                  >
                    <div className="sm:grid sm:grid-cols-[210px_minmax(0,1fr)]">
                      <div className="relative aspect-video overflow-hidden bg-zinc-950 sm:aspect-auto sm:min-h-[138px]">
                        {previousSeasonLastWatch.episode_still_url ? (
                          <Image
                            src={previousSeasonLastWatch.episode_still_url}
                            alt={previousSeasonLastWatch.episode_title ?? "Último episodio visto"}
                            fill
                            unoptimized
                            sizes="(max-width:639px) 100vw, 210px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-[138px] items-center justify-center text-xs text-zinc-600">
                            Último episodio visto
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/70">
                            Último episodio visto
                          </p>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                            T{previousSeasonLastWatch.season_number} · E{previousSeasonLastWatch.episode_number}
                          </p>
                          <h3 className="mt-1.5 text-base font-medium text-zinc-100">
                            {previousSeasonLastWatch.episode_title ?? "Último episodio de la temporada anterior"}
                          </h3>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 py-2 text-sm text-emerald-300">
                            <CircleCheck size={15} /> Visto
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                )}
                {current.episodes.map((episode) => {
                  const history =
                    watchesFor(episode);

                  const watched =
                    history.length > 0;

                  const key = keyOf(
                    episode.season_number,
                    episode.episode_number,
                  );

                  const isExpanded =
                    expanded === key;

                  return (
                    <article
                      key={episode.id}
                      data-progress-focus={
                        !showPreviousPreview &&
                        episode.episode_number === initialEpisodeNumber
                          ? "true"
                          : undefined
                      }
                      className={`overflow-hidden rounded-xl border transition ${
                        watched
                          ? "border-emerald-400/[0.15] bg-emerald-400/[0.025]"
                          : "border-white/[0.075] bg-white/[0.018]"
                      }`}
                    >
                      <div className="sm:grid sm:grid-cols-[210px_minmax(0,1fr)]">
                        {/* IMAGEN */}

                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-950 sm:aspect-auto sm:min-h-[138px]">
                          {episode.still_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                              alt={episode.name}
                              fill
                              sizes="(max-width:639px) 100vw, 210px"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[138px] items-center justify-center text-xs text-zinc-700">
                              Sin imagen
                            </div>
                          )}

                          {watched && (
                            <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-emerald-400 backdrop-blur-sm">
                              <CircleCheck
                                size={16}
                              />
                            </div>
                          )}
                        </div>

                        {/* INFORMACIÓN */}

                        <div className="flex min-w-0 flex-col p-4 sm:min-h-[138px] sm:p-5">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                              T
                              {
                                episode.season_number
                              }{" "}
                              · E
                              {
                                episode.episode_number
                              }
                            </p>

                            <h3 className="mt-1.5 text-[16px] font-medium leading-5 text-zinc-100">
                              {episode.name}
                            </h3>

                            {episode.air_date && (
                              <p className="mt-1.5 text-xs text-zinc-600">
                                {dateLabel(
                                  episode.air_date,
                                )}
                              </p>
                            )}
                          </div>

                          <p
                            className={`mt-3 text-sm leading-6 ${
                              episode.overview
                                ? "line-clamp-3 text-zinc-400 sm:line-clamp-2"
                                : "text-zinc-600"
                            }`}
                          >
                            {episode.overview ||
                              "Sin descripción disponible."}
                          </p>

                          {/* MARCAR VISTO */}

                          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-auto sm:justify-end sm:pt-4">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                watched
                                  ? setExpanded(
                                      isExpanded
                                        ? null
                                        : key,
                                    )
                                  : void addWatch(
                                      episode,
                                      false,
                                    )
                              }
                              className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-medium transition disabled:opacity-40 ${
                                watched
                                  ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300 hover:bg-emerald-400/[0.11]"
                                  : "border-white/[0.10] bg-white/[0.025] text-zinc-400 hover:border-fuchsia-400/30 hover:text-zinc-100"
                              }`}
                            >
                              <CircleCheck
                                size={15}
                              />

                              {watched
                                ? "Visto"
                                : "Marcar visto"}
                            </button>

                            {history.length > 1 && (
                              <span className="text-xs text-zinc-600">
                                {
                                  history.length
                                }{" "}
                                visualizaciones
                              </span>
                            )}
                          </div>

                          {/* REWATCH Y QUITAR VISTO */}

                          {isExpanded && (
                            <div className="mt-3 flex flex-wrap justify-start gap-1 border-t border-white/[0.06] pt-3 sm:justify-end">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void addWatch(
                                    episode,
                                    true,
                                  )
                                }
                                className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-40"
                              >
                                <RotateCcw
                                  size={14}
                                />
                                Marcar rewatch
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void removeWatch(
                                    episode,
                                  )
                                }
                                className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-red-400/70 hover:bg-red-500/[0.06] hover:text-red-300 disabled:opacity-40"
                              >
                                <Trash2
                                  size={14}
                                />
                                Quitar último visto
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* MENSAJES */}

      {message && (
        <p
          role="status"
          className="mt-4 text-sm text-zinc-500"
        >
          {message}
        </p>
      )}
    </section>
  );
}