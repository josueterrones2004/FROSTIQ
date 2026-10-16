"use client";

import {
  Clock3,
  Eye,
  Heart,
  Loader2,
  Repeat2,
  ShieldAlert,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import StarRating from "@/components/media/StarRating";
import { shouldUseOriginalImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";

interface MovieActionsProps {
  movie: {
    id: string;
    title: string;
    originalTitle: string | null;
    coverUrl: string | null;
    backdropUrl: string | null;
    releaseYear: number | null;
  };
}

function getToday() {
  const now = new Date();

  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function MovieActions({
  movie,
}: MovieActionsProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [pending, setPending] = useState(false);
  const [hasWatchedBefore, setHasWatchedBefore] = useState(false);

  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const [review, setReview] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const [liked, setLiked] = useState(true);
  const [isRewatch, setIsRewatch] = useState(false);
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  const [watchedDate, setWatchedDate] = useState(getToday());
  const [message, setMessage] = useState("");

  /*
   * CARGAR ESTADO ACTUAL
   */

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) {
          return;
        }

        const [libraryResult, reviewResult] = await Promise.all([
          supabase
            .from("library_items")
            .select("status")
            .eq("user_id", user.id)
            .eq("media_type", "MOVIE")
            .eq("external_id", movie.id)
            .maybeSingle(),

          supabase
            .from("reviews")
            .select("id")
            .eq("user_id", user.id)
            .eq("media_type", "MOVIE")
            .eq("external_id", movie.id)
            .limit(1),
        ]);

        if (libraryResult.error) {
          console.error(
            "Error loading movie state:",
            libraryResult.error,
          );
        }

        if (reviewResult.error) {
          console.error(
            "Error loading movie reviews:",
            reviewResult.error,
          );
        }

        if (cancelled) {
          return;
        }

        setPending(
          libraryResult.data?.status === "PENDING",
        );

        setHasWatchedBefore(
          Boolean(reviewResult.data?.length),
        );
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [movie.id, supabase]);

  function getMovieData(userId: string) {
    return {
      user_id: userId,
      media_type: "MOVIE",
      external_id: movie.id,

      title: movie.title,
      original_title: movie.originalTitle,

      cover_url: movie.coverUrl,
      backdrop_url: movie.backdropUrl,

      release_year: movie.releaseYear,
    };
  }

  /*
   * BORRAR ACTIVIDAD TEMPORAL
   */

  async function clearTemporaryActivity(userId: string) {
    const { error } = await supabase
      .from("activity_events")
      .delete()
      .eq("user_id", userId)
      .eq("media_type", "MOVIE")
      .eq("external_id", movie.id)
      .in("activity_type", [
        "ADDED_PENDING",
        "STARTED",
      ]);

    if (error) {
      console.error(
        "Error clearing temporary movie activity:",
        error,
      );
    }
  }

  /*
   * VER DESPUÉS
   */

  async function togglePending() {
    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Debes iniciar sesión.");
      setLoading(false);
      return;
    }

    /*
     * QUITAR DE VER DESPUÉS
     */

    if (pending) {
      const { error } = await supabase
        .from("library_items")
        .delete()
        .eq("user_id", user.id)
        .eq("media_type", "MOVIE")
        .eq("external_id", movie.id);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      await clearTemporaryActivity(user.id);

      setPending(false);
      setMessage("Quitada de tu lista.");

      setLoading(false);
      router.refresh();

      return;
    }

    /*
     * AÑADIR A VER DESPUÉS
     */

    await clearTemporaryActivity(user.id);

    const { error } = await supabase
      .from("library_items")
      .upsert(
        {
          ...getMovieData(user.id),
          status: "PENDING",
        },
        {
          onConflict:
            "user_id,media_type,external_id",
        },
      );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const { error: activityError } =
      await supabase
        .from("activity_events")
        .insert({
          user_id: user.id,

          activity_type:
            "ADDED_PENDING",

          media_type: "MOVIE",
          external_id: movie.id,

          title: movie.title,
          cover_url: movie.coverUrl,
        });

    if (activityError) {
      console.error(
        "Error creating movie pending activity:",
        activityError,
      );
    }

    setPending(true);
    setMessage("Añadida para ver después.");

    setLoading(false);
    router.refresh();
  }

  /*
   * ABRIR MODAL VISTA / REWATCH
   */

  async function openWatchedModal() {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Debes iniciar sesión.");
      return;
    }

    const {
      data: previousReviews,
      error,
    } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_type", "MOVIE")
      .eq("external_id", movie.id)
      .limit(1);

    if (error) {
      console.error(
        "Error checking previous movie reviews:",
        error,
      );
    }

    setIsRewatch(
      Boolean(previousReviews?.length),
    );

    setWatchedDate(getToday());

    setRating(null);
    setReview("");

    setLiked(true);
    setContainsSpoilers(false);

    setShowReview(true);
  }

  /*
   * GUARDAR VISTA / REVIEW
   */

  async function saveReview() {
    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    const cleanReview = review.trim();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Debes iniciar sesión.");
      setLoading(false);
      return;
    }

    const {
      data: createdReview,
      error: reviewError,
    } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,

        media_type: "MOVIE",
        external_id: movie.id,

        title: movie.title,

        review_text:
          cleanReview || null,

        rating,
        liked,

        is_rewatch: isRewatch,

        contains_spoilers:
          containsSpoilers,

        show_consumed_date: true,

        experience: isRewatch
          ? "REWATCH"
          : "FIRST_TIME",

        consumed_at: watchedDate,

        cover_url: movie.coverUrl,
        backdrop_url: movie.backdropUrl,

        release_year:
          movie.releaseYear,
      })
      .select("id")
      .single();

    if (reviewError) {
      setMessage(reviewError.message);
      setLoading(false);
      return;
    }

    /*
     * ACTIVIDAD
     */

    if (createdReview) {
      const { error: activityError } =
        await supabase
          .from("activity_events")
          .insert({
            user_id: user.id,

            activity_type: "REVIEWED",

            media_type: "MOVIE",
            external_id: movie.id,

            title: movie.title,
            cover_url: movie.coverUrl,

            review_id:
              createdReview.id,
          });

      if (activityError) {
        console.error(
          "Error creating movie review activity:",
          activityError,
        );
      }
    }

    /*
     * QUITAR DE VER DESPUÉS
     */

    const { error: deleteError } =
      await supabase
        .from("library_items")
        .delete()
        .eq("user_id", user.id)
        .eq("media_type", "MOVIE")
        .eq("external_id", movie.id);

    if (deleteError) {
      setMessage(deleteError.message);
      setLoading(false);
      return;
    }

    await clearTemporaryActivity(user.id);

    setPending(false);
    setHasWatchedBefore(true);

    setShowReview(false);

    setMessage(
      isRewatch
        ? "Rewatch guardado."
        : "Película marcada como vista.",
    );

    setLoading(false);

    router.refresh();
  }

  return (
    <>
      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* MARCAR COMO VISTA */}

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            void openWatchedModal();
          }}
          className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-fuchsia-500/15 px-4 text-sm font-medium text-fuchsia-200 transition hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : hasWatchedBefore ? (
            <Repeat2 size={16} />
          ) : (
            <Eye size={17} />
          )}

          <span>
            {hasWatchedBefore
              ? "Registrar rewatch"
              : "Marcar como vista"}
          </span>
        </button>

        {/* VER DESPUÉS */}

        <button
          type="button"
          disabled={loading}
          aria-pressed={pending}
          onClick={() => {
            void togglePending();
          }}
          className={`inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition sm:w-auto ${
            pending
              ? "bg-amber-500/12 text-amber-200"
              : "bg-white/[0.035] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Clock3 size={16} />

          <span>
            {pending
              ? "En mi lista"
              : "Ver después"}
          </span>
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-xs text-zinc-500 sm:text-sm">
          {message}
        </p>
      ) : null}

      {/* ==================================================
          REVIEW MODAL
      ================================================== */}

      {showReview ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[26px] border border-white/10 bg-[#0a0a0d] shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:max-w-3xl sm:rounded-2xl">
            {/* MOBILE HANDLE */}

            <div className="flex justify-center py-3 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-zinc-700" />
            </div>

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 pb-5 pt-2 sm:px-7 sm:pt-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
                  {isRewatch
                    ? "Registrar rewatch"
                    : "Película vista"}
                </p>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="break-words text-xl font-bold leading-tight text-white [text-wrap:balance] sm:text-2xl">
                    {movie.title}
                  </h2>

                  {movie.releaseYear ? (
                    <span className="text-sm text-zinc-500 sm:text-base">
                      {movie.releaseYear}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setShowReview(false);
                  setMessage("");
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X size={19} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="grid gap-6 px-5 py-6 sm:px-7 md:grid-cols-[135px_minmax(0,1fr)] md:gap-7">
              {/* POSTER */}

              <div className="hidden md:block">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900">
                  {movie.coverUrl ? (
                    <Image
                      src={movie.coverUrl}
                      alt={movie.title}
                      fill
                      sizes="135px"
                      unoptimized={shouldUseOriginalImage(
                        movie.coverUrl,
                      )}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
                      Sin imagen
                    </div>
                  )}
                </div>
              </div>

              {/* FORM */}

              <div className="min-w-0">
                {/* DATE */}

                <div className="flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      Fecha
                    </p>

                    <p className="mt-1 text-sm text-zinc-200">
                      {formatDate(
                        watchedDate,
                      )}
                    </p>
                  </div>

                  <input
                    type="date"
                    value={watchedDate}
                    max={getToday()}
                    onChange={(event) =>
                      setWatchedDate(
                        event.target.value,
                      )
                    }
                    className="h-10 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-300 outline-none transition focus:border-fuchsia-500/60"
                  />
                </div>

                {/* RATING */}

                <div className="mt-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Tu puntuación
                  </p>

                  <StarRating
                    value={rating}
                    onChange={setRating}
                    size={32}
                    showLabel={false}
                  />
                </div>

                {/* REVIEW */}

                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Review
                  </p>

                  <textarea
                    value={review}
                    onChange={(event) =>
                      setReview(
                        event.target.value,
                      )
                    }
                    placeholder="¿Qué te pareció? Puedes dejarlo vacío."
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500/60 focus:bg-white/[0.05]"
                  />
                </div>

                {/* OPTIONS */}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setIsRewatch(
                        (current) =>
                          !current,
                      )
                    }
                    className={`flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                      isRewatch
                        ? "border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-300"
                        : "border-white/10 bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                    }`}
                  >
                    <Repeat2 size={19} />

                    <span className="text-[11px] font-medium sm:text-xs">
                      {isRewatch
                        ? "Rewatch"
                        : "Primera vez"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setContainsSpoilers(
                        (current) =>
                          !current,
                      )
                    }
                    className={`flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                      containsSpoilers
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                    }`}
                  >
                    <ShieldAlert size={19} />

                    <span className="text-[11px] font-medium sm:text-xs">
                      {containsSpoilers
                        ? "Con spoilers"
                        : "Sin spoilers"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLiked(
                        (current) =>
                          !current,
                      )
                    }
                    className={`flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                      liked
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                    }`}
                  >
                    <Heart
                      size={19}
                      fill={
                        liked
                          ? "currentColor"
                          : "none"
                      }
                    />

                    <span className="text-[11px] font-medium sm:text-xs">
                      {liked
                        ? "Me gustó"
                        : "No me gustó"}
                    </span>
                  </button>
                </div>

                {message ? (
                  <p className="mt-4 text-sm text-zinc-500">
                    {message}
                  </p>
                ) : null}

                {/* FOOTER */}

                <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/8 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setShowReview(false);
                      setMessage("");
                    }}
                    className="h-11 rounded-xl px-5 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      void saveReview();
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-6 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : null}

                    {loading
                      ? "Guardando..."
                      : isRewatch
                        ? "Guardar rewatch"
                        : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}