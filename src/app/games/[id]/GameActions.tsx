"use client";

import Image from "next/image";
import {
  Clock3,
  Gamepad2,
  Heart,
  Play,
  Repeat2,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import MediaActionBar from "@/components/media/MediaActionBar";
import StarRating from "@/components/media/StarRating";

import { shouldUseOriginalImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";

interface GameActionsProps {
  game: {
    id: string;
    title: string;

    coverUrl:
      | string
      | null;

    backdropUrl:
      | string
      | null;

    releaseYear:
      | number
      | null;
  };
}

type GameStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DROPPED";

function isGameStatus(
  value: string,
): value is GameStatus {
  return (
    value === "PENDING" ||
    value === "IN_PROGRESS" ||
    value === "DROPPED"
  );
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
    .slice(0, 10);
}

function formatDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  );
}

export default function GameActions({
  game,
}: GameActionsProps) {
  const router =
    useRouter();

  const [supabase] =
    useState(
      () =>
        createClient(),
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      GameStatus |
      null
    >(null);

  const [
    hasCompletedBefore,
    setHasCompletedBefore,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    showReview,
    setShowReview,
  ] =
    useState(false);

  const [
    review,
    setReview,
  ] =
    useState("");

  const [
    rating,
    setRating,
  ] =
    useState<
      number |
      null
    >(null);

  const [
    liked,
    setLiked,
  ] =
    useState(true);

  const [
    isReplay,
    setIsReplay,
  ] =
    useState(false);

  const [
    containsSpoilers,
    setContainsSpoilers,
  ] =
    useState(false);

  const [
    completedDate,
    setCompletedDate,
  ] =
    useState(
      getToday(),
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  /*
   * CARGAR ESTADO REAL DEL JUEGO
   */

  useEffect(() => {
    let cancelled =
      false;

    const timeout =
      window.setTimeout(
        () => {
          void (async () => {
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

            const [
              libraryResult,
              reviewResult,
            ] =
              await Promise.all([
                supabase
                  .from(
                    "library_items",
                  )
                  .select(
                    "status",
                  )
                  .eq(
                    "user_id",
                    user.id,
                  )
                  .eq(
                    "media_type",
                    "GAME",
                  )
                  .eq(
                    "external_id",
                    game.id,
                  )
                  .maybeSingle(),

                supabase
                  .from(
                    "reviews",
                  )
                  .select(
                    "id",
                  )
                  .eq(
                    "user_id",
                    user.id,
                  )
                  .eq(
                    "media_type",
                    "GAME",
                  )
                  .eq(
                    "external_id",
                    game.id,
                  )
                  .limit(1),
              ]);

            if (
              libraryResult.error
            ) {
              console.error(
                "Error loading game state:",
                libraryResult.error,
              );
            }

            if (
              reviewResult.error
            ) {
              console.error(
                "Error loading game reviews:",
                reviewResult.error,
              );
            }

            if (
              cancelled
            ) {
              return;
            }

            const loadedStatus =
              libraryResult
                .data
                ?.status;

            if (
              loadedStatus ===
                "PENDING" ||
              loadedStatus ===
                "IN_PROGRESS" ||
              loadedStatus ===
                "DROPPED"
            ) {
              setStatus(
                loadedStatus,
              );
            } else {
              setStatus(
                null,
              );
            }

            setHasCompletedBefore(
              Boolean(
                reviewResult
                  .data
                  ?.length,
              ),
            );
          })();
        },
        0,
      );

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timeout,
      );
    };
  }, [
    game.id,
    supabase,
  ]);

  function getGameData(
    userId: string,
  ) {
    return {
      user_id:
        userId,

      media_type:
        "GAME",

      external_id:
        game.id,

      title:
        game.title,

      original_title:
        null,

      cover_url:
        game.coverUrl,

      backdrop_url:
        game.backdropUrl,

      release_year:
        game.releaseYear,
    };
  }

  async function clearTemporaryActivity(
    userId: string,
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "activity_events",
        )
        .delete()
        .eq(
          "user_id",
          userId,
        )
        .eq(
          "media_type",
          "GAME",
        )
        .eq(
          "external_id",
          game.id,
        )
        .in(
          "activity_type",
          [
            "ADDED_PENDING",
            "STARTED",
          ],
        );

    if (error) {
      console.error(
        "Error clearing temporary game activity:",
        error,
      );
    }
  }

  async function createActivity(
    userId: string,

    activityType:
      | "STARTED"
      | "ADDED_PENDING",
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
            activityType,

          media_type:
            "GAME",

          external_id:
            game.id,

          title:
            game.title,

          cover_url:
            game.coverUrl,
        });

    if (error) {
      console.error(
        "Error creating game activity:",
        error,
      );
    }
  }

  async function setLibraryStatus(
    newStatus:
      | GameStatus
      | null,
  ) {
    if (loading) {
      return;
    }

    setLoading(true);
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

      setLoading(false);

      return;
    }

    if (
      newStatus ===
      null
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            "library_items",
          )
          .delete()
          .eq(
            "user_id",
            user.id,
          )
          .eq(
            "media_type",
            "GAME",
          )
          .eq(
            "external_id",
            game.id,
          );

      if (error) {
        setMessage(
          error.message,
        );

        setLoading(false);

        return;
      }

      await clearTemporaryActivity(
        user.id,
      );

      setStatus(
        null,
      );

      setMessage(
        "Juego quitado de tu biblioteca.",
      );

      setLoading(false);

      router.refresh();

      return;
    }

    await clearTemporaryActivity(
      user.id,
    );

    const {
      error,
    } =
      await supabase
        .from(
          "library_items",
        )
        .upsert(
          {
            ...getGameData(
              user.id,
            ),

            status:
              newStatus,
          },
          {
            onConflict:
              "user_id,media_type,external_id",
          },
        );

    if (error) {
      setMessage(
        error.message,
      );

      setLoading(false);

      return;
    }

    if (
      newStatus ===
      "IN_PROGRESS"
    ) {
      await createActivity(
        user.id,
        "STARTED",
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      await createActivity(
        user.id,
        "ADDED_PENDING",
      );
    }

    setStatus(
      newStatus,
    );

    if (
      newStatus ===
      "IN_PROGRESS"
    ) {
      setMessage(
        "Juego marcado como jugando.",
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      setMessage(
        "Juego añadido a pendientes.",
      );
    }

    if (
      newStatus ===
      "DROPPED"
    ) {
      setMessage(
        "Juego marcado como abandonado.",
      );
    }

    setLoading(false);

    router.refresh();
  }

  async function openCompletedModal() {
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

    const {
      data:
        previousReviews,

      error,
    } =
      await supabase
        .from(
          "reviews",
        )
        .select(
          "id",
        )
        .eq(
          "user_id",
          user.id,
        )
        .eq(
          "media_type",
          "GAME",
        )
        .eq(
          "external_id",
          game.id,
        )
        .limit(1);

    if (error) {
      console.error(
        "Error checking previous game reviews:",
        error,
      );
    }

    const completedBefore =
      Boolean(
        previousReviews
          ?.length,
      );

    setIsReplay(
      completedBefore,
    );

    setReview("");
    setRating(null);
    setLiked(true);

    setContainsSpoilers(
      false,
    );

    setCompletedDate(
      getToday(),
    );

    setShowReview(
      true,
    );
  }

  async function saveReview() {
    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    const cleanReview =
      review.trim();

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

      setLoading(false);

      return;
    }

    const {
      data:
        createdReview,

      error:
        reviewError,
    } =
      await supabase
        .from(
          "reviews",
        )
        .insert({
          user_id:
            user.id,

          media_type:
            "GAME",

          external_id:
            game.id,

          title:
            game.title,

          review_text:
            cleanReview ||
            null,

          rating,

          liked,

          is_rewatch:
            isReplay,

          contains_spoilers:
            containsSpoilers,

          show_consumed_date:
            true,

          experience:
            isReplay
              ? "REPLAY"
              : "FIRST_TIME",

          consumed_at:
            completedDate,

          cover_url:
            game.coverUrl,

          backdrop_url:
            game.backdropUrl,

          release_year:
            game.releaseYear,
        })
        .select(
          "id",
        )
        .single();

    if (
      reviewError
    ) {
      setMessage(
        reviewError.message,
      );

      setLoading(false);

      return;
    }

    if (
      createdReview
    ) {
      const {
        error:
          activityError,
      } =
        await supabase
          .from(
            "activity_events",
          )
          .insert({
            user_id:
              user.id,

            activity_type:
              "REVIEWED",

            media_type:
              "GAME",

            external_id:
              game.id,

            title:
              game.title,

            cover_url:
              game.coverUrl,

            review_id:
              createdReview.id,
          });

      if (
        activityError
      ) {
        console.error(
          "Error creating game review activity:",
          activityError,
        );
      }
    }

    const {
      error:
        deleteError,
    } =
      await supabase
        .from(
          "library_items",
        )
        .delete()
        .eq(
          "user_id",
          user.id,
        )
        .eq(
          "media_type",
          "GAME",
        )
        .eq(
          "external_id",
          game.id,
        );

    if (
      deleteError
    ) {
      setMessage(
        deleteError.message,
      );

      setLoading(false);

      return;
    }

    await clearTemporaryActivity(
      user.id,
    );

    setStatus(
      null,
    );

    setHasCompletedBefore(
      true,
    );

    setShowReview(
      false,
    );

    setMessage(
      isReplay
        ? "Replay guardado."
        : "Juego marcado como completado.",
    );

    setLoading(false);

    router.refresh();
  }

  return (
    <>
      <div className="mt-6">
        <MediaActionBar
          primaryLabel={
            hasCompletedBefore
              ? "✓ Completado"
              : "Marcar como completado"
          }
          primaryActive={
            hasCompletedBefore
          }
          onPrimaryAction={
            openCompletedModal
          }
          primaryDisabled={
            loading
          }
          activeStatus={
            status
          }
          statusDisabled={
            loading
          }
          statusOptions={[
            {
              value:
                "IN_PROGRESS",

              label:
                "Jugando",

              icon: (
                <Play
                  size={
                    13
                  }
                />
              ),
            },
            {
              value:
                "PENDING",

              label:
                "Pendiente",

              icon: (
                <Clock3
                  size={
                    13
                  }
                />
              ),
            },
          ]}
          onStatusChange={(
            newStatus,
          ) => {
            if (
              newStatus ===
              null
            ) {
              return setLibraryStatus(
                null,
              );
            }

            if (
              !isGameStatus(
                newStatus,
              )
            ) {
              return;
            }

            return setLibraryStatus(
              newStatus,
            );
          }}
          message={
            message
          }
        />
      </div>

      {showReview ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => {
                setShowReview(
                  false,
                );

                setMessage("");
              }}
              disabled={
                loading
              }
              className="absolute right-5 top-5 text-3xl leading-none text-zinc-500 transition hover:text-white disabled:opacity-50"
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="grid gap-8 md:grid-cols-[180px_1fr] md:items-start">
              <div className="flex justify-center md:justify-start md:pt-12">
                <div className="w-full max-w-[180px]">
                  {game.coverUrl ? (
                    <Image
                      src={
                        game.coverUrl
                      }
                      alt={
                        game.title
                      }
                      width={
                        500
                      }
                      height={
                        750
                      }
                      unoptimized={
                        shouldUseOriginalImage(
                          game.coverUrl,
                        )
                      }
                      className="w-full rounded-xl object-cover shadow-xl"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
                      Sin imagen
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 pt-2 md:pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  {isReplay
                    ? "Registrar replay"
                    : "Juego completado"}
                </p>

                <div className="mt-2 flex flex-wrap items-baseline gap-3 pr-10">
                  <h2 className="text-2xl font-bold text-zinc-100">
                    {
                      game.title
                    }
                  </h2>

                  {game.releaseYear ? (
                    <span className="text-lg text-zinc-500">
                      {
                        game.releaseYear
                      }
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 text-sm text-zinc-500">
                  Completado el{" "}
                  <span className="text-zinc-300">
                    {formatDate(
                      completedDate,
                    )}
                  </span>
                </p>

                <input
                  type="date"
                  value={
                    completedDate
                  }
                  max={
                    getToday()
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletedDate(
                      event.target.value,
                    )
                  }
                  className="mt-3 h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none transition focus:border-fuchsia-500"
                />

                <div className="mt-6">
                  <p className="mb-2 text-sm font-medium text-zinc-300">
                    Tu puntuación
                  </p>

                  <StarRating
                    value={
                      rating
                    }
                    onChange={
                      setRating
                    }
                    size={
                      34
                    }
                    showLabel={
                      false
                    }
                  />
                </div>

                <textarea
                  value={
                    review
                  }
                  onChange={(
                    event,
                  ) =>
                    setReview(
                      event.target.value,
                    )
                  }
                  placeholder="Escribe tu review (opcional)..."
                  rows={
                    6
                  }
                  className="mt-6 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
                />

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      setIsReplay(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                      isReplay
                        ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                        : "border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                    }`}
                  >
                    {isReplay ? (
                      <Repeat2
                        size={
                          25
                        }
                      />
                    ) : (
                      <Gamepad2
                        size={
                          25
                        }
                      />
                    )}

                    <span className="text-sm">
                      {isReplay
                        ? "Replay"
                        : "Primera partida"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setContainsSpoilers(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                      containsSpoilers
                        ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                        : "border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                    }`}
                  >
                    <ShieldAlert
                      size={
                        25
                      }
                    />

                    <span className="text-sm">
                      {containsSpoilers
                        ? "Con spoilers"
                        : "Sin spoilers"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLiked(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                      liked
                        ? "border-red-500/40 bg-red-500/10 text-red-400"
                        : "border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                    }`}
                  >
                    <Heart
                      size={
                        25
                      }
                      fill={
                        liked
                          ? "currentColor"
                          : "none"
                      }
                    />

                    <span className="text-sm">
                      {liked
                        ? "Me gustó"
                        : "No me gustó"}
                    </span>
                  </button>
                </div>

                {message ? (
                  <p className="mt-5 text-sm text-zinc-500">
                    {
                      message
                    }
                  </p>
                ) : null}

                <div className="mt-7 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      void saveReview();
                    }}
                    disabled={
                      loading
                    }
                    className="rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Guardando..."
                      : isReplay
                        ? "Guardar replay"
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