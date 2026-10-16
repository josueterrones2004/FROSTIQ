"use client";

import {
  BookOpen,
  Heart,
  Repeat2,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import MediaActionBar from "@/components/media/MediaActionBar";
import StarRating from "@/components/media/StarRating";
import { shouldUseOriginalImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";

interface BookActionsProps {
  book: {
    id: string;
    title: string;

    coverUrl:
      | string
      | null;

    authors: string[];
  };
}

type BookStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DROPPED";

function isBookStatus(
  value: string,
): value is BookStatus {
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
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  );
}

export default function BookActions({
  book,
}: BookActionsProps) {
  const router =
    useRouter();

  const [
    supabase,
  ] =
    useState(
      () =>
        createClient(),
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      BookStatus |
      null
    >(null);

  const [
    hasReadBefore,
    setHasReadBefore,
  ] =
    useState(false);

  const [
    showReview,
    setShowReview,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
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
    isReread,
    setIsReread,
  ] =
    useState(false);

  const [
    containsSpoilers,
    setContainsSpoilers,
  ] =
    useState(false);

  const [
    readDate,
    setReadDate,
  ] =
    useState(
      getToday(),
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  /* =========================================================
     LOAD CURRENT STATE
  ========================================================= */

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
                    "BOOK",
                  )
                  .eq(
                    "external_id",
                    book.id,
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
                    "BOOK",
                  )
                  .eq(
                    "external_id",
                    book.id,
                  )
                  .limit(1),
              ]);

            if (
              libraryResult.error
            ) {
              console.error(
                "Error loading book state:",
                libraryResult.error,
              );
            }

            if (
              reviewResult.error
            ) {
              console.error(
                "Error loading book reviews:",
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

            setStatus(
              loadedStatus ===
                  "PENDING" ||
                loadedStatus ===
                  "IN_PROGRESS" ||
                loadedStatus ===
                  "DROPPED"
                ? loadedStatus
                : null,
            );

            setHasReadBefore(
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
    book.id,
    supabase,
  ]);

  /* =========================================================
     BOOK DATA
  ========================================================= */

  function getBookData(
    userId: string,
  ) {
    return {
      user_id:
        userId,

      media_type:
        "BOOK",

      external_id:
        book.id,

      title:
        book.title,

      original_title:
        null,

      cover_url:
        book.coverUrl,

      backdrop_url:
        null,

      release_year:
        null,
    };
  }

  /* =========================================================
     CLEAR TEMPORARY ACTIVITY
  ========================================================= */

  async function clearLibraryActivity(
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
          "BOOK",
        )
        .eq(
          "external_id",
          book.id,
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
        "Error clearing book library activity:",
        error,
      );
    }
  }

  /* =========================================================
     ACTIVITY
  ========================================================= */

  async function createLibraryActivity(
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
            "BOOK",

          external_id:
            book.id,

          title:
            book.title,

          cover_url:
            book.coverUrl,
        });

    if (error) {
      console.error(
        "Error creating book activity:",
        error,
      );
    }
  }

  /* =========================================================
     LIBRARY STATUS
  ========================================================= */

  async function setLibraryStatus(
    newStatus:
      | BookStatus
      | null,
  ) {
    if (loading) {
      return;
    }

    setLoading(
      true,
    );

    setMessage(
      "",
    );

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

      setLoading(
        false,
      );

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
            "BOOK",
          )
          .eq(
            "external_id",
            book.id,
          );

      if (error) {
        setMessage(
          error.message,
        );

        setLoading(
          false,
        );

        return;
      }

      await clearLibraryActivity(
        user.id,
      );

      setStatus(
        null,
      );

      setMessage(
        "Libro quitado de tu biblioteca.",
      );

      setLoading(
        false,
      );

      router.refresh();

      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "library_items",
        )
        .upsert(
          {
            ...getBookData(
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

      setLoading(
        false,
      );

      return;
    }

    await clearLibraryActivity(
      user.id,
    );

    if (
      newStatus ===
      "IN_PROGRESS"
    ) {
      await createLibraryActivity(
        user.id,
        "STARTED",
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      await createLibraryActivity(
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
        "Libro marcado como leyendo.",
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      setMessage(
        "Libro añadido a pendientes.",
      );
    }

    /*
     * Se conserva para compatibilidad
     * con registros antiguos.
     *
     * Ya no existe botón "Abandonado"
     * en la interfaz.
     */

    if (
      newStatus ===
      "DROPPED"
    ) {
      setMessage(
        "Libro marcado como abandonado.",
      );
    }

    setLoading(
      false,
    );

    router.refresh();
  }

  /* =========================================================
     OPEN READ MODAL
  ========================================================= */

  async function openReadModal() {
    setMessage(
      "",
    );

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
          "BOOK",
        )
        .eq(
          "external_id",
          book.id,
        )
        .limit(1);

    if (error) {
      console.error(
        "Error checking previous book reviews:",
        error,
      );
    }

    setIsReread(
      Boolean(
        previousReviews
          ?.length,
      ),
    );

    setReadDate(
      getToday(),
    );

    setRating(
      null,
    );

    setLiked(
      true,
    );

    setContainsSpoilers(
      false,
    );

    setReview(
      "",
    );

    setShowReview(
      true,
    );
  }

  /* =========================================================
     SAVE REVIEW
  ========================================================= */

  async function saveReview() {
    if (loading) {
      return;
    }

    setLoading(
      true,
    );

    setMessage(
      "",
    );

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

      setLoading(
        false,
      );

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
            "BOOK",

          external_id:
            book.id,

          title:
            book.title,

          review_text:
            cleanReview ||
            null,

          rating,

          liked,

          is_rewatch:
            isReread,

          contains_spoilers:
            containsSpoilers,

          show_consumed_date:
            true,

          experience:
            isReread
              ? "REREAD"
              : "FIRST_TIME",

          consumed_at:
            readDate,

          cover_url:
            book.coverUrl,

          backdrop_url:
            null,

          release_year:
            null,
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

      setLoading(
        false,
      );

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
              "BOOK",

            external_id:
              book.id,

            title:
              book.title,

            cover_url:
              book.coverUrl,

            review_id:
              createdReview.id,
          });

      if (
        activityError
      ) {
        console.error(
          "Error creating book review activity:",
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
          "BOOK",
        )
        .eq(
          "external_id",
          book.id,
        );

    if (
      deleteError
    ) {
      setMessage(
        deleteError.message,
      );

      setLoading(
        false,
      );

      return;
    }

    await clearLibraryActivity(
      user.id,
    );

    setStatus(
      null,
    );

    setHasReadBefore(
      true,
    );

    setShowReview(
      false,
    );

    setMessage(
      isReread
        ? "Relectura guardada."
        : "Libro marcado como leído.",
    );

    setLoading(
      false,
    );

    router.refresh();
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* ==================================================
          ACTIONS

          mt-6 iguala la separación de
          Películas, Juegos y Series.
      ================================================== */}

      <div className="mt-6">
        <MediaActionBar
          primaryLabel={
            hasReadBefore
              ? "Registrar relectura"
              : "Marcar como leído"
          }
          onPrimaryAction={
            openReadModal
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
                "Leyendo",
            },
            {
              value:
                "PENDING",

              label:
                "Pendiente",
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
              !isBookStatus(
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

      {/* ==================================================
          READ / REVIEW MODAL
      ================================================== */}

      {showReview ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() =>
                setShowReview(
                  false,
                )
              }
              disabled={
                loading
              }
              className="absolute right-5 top-5 text-3xl leading-none text-zinc-500 transition hover:text-white disabled:opacity-50"
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="grid gap-8 md:grid-cols-[180px_1fr] md:items-start">
              {/* POSTER */}

              <div className="flex justify-center md:justify-start md:pt-12">
                <div className="w-full max-w-[180px]">
                  {book.coverUrl ? (
                    <Image
                      src={
                        book.coverUrl
                      }
                      alt={
                        book.title
                      }
                      width={
                        500
                      }
                      height={
                        750
                      }
                      unoptimized={
                        shouldUseOriginalImage(
                          book.coverUrl,
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

              {/* CONTENT */}

              <div className="min-w-0 pt-2 md:pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  {isReread
                    ? "Registrar relectura"
                    : "Libro leído"}
                </p>

                <h2 className="mt-2 pr-10 text-2xl font-bold text-zinc-100">
                  {
                    book.title
                  }
                </h2>

                {book.authors.length >
                0 ? (
                  <p className="mt-1 text-sm text-zinc-500">
                    {book.authors.join(
                      ", ",
                    )}
                  </p>
                ) : null}

                <p className="mt-5 text-sm text-zinc-500">
                  Leído el{" "}

                  <span className="text-zinc-300">
                    {formatDate(
                      readDate,
                    )}
                  </span>
                </p>

                {/* RATING */}

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

                {/* REVIEW */}

                <textarea
                  value={
                    review
                  }
                  onChange={(
                    event,
                  ) =>
                    setReview(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Escribe tu review (opcional)..."
                  rows={
                    6
                  }
                  className="mt-6 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
                />

                {/* OPTIONS */}

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      setIsReread(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                      isReread
                        ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                        : "border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                    }`}
                  >
                    {isReread ? (
                      <Repeat2
                        size={
                          25
                        }
                      />
                    ) : (
                      <BookOpen
                        size={
                          25
                        }
                      />
                    )}

                    <span className="text-sm">
                      {isReread
                        ? "Relectura"
                        : "Primera lectura"}
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

                {/* SAVE */}

                <div className="mt-7 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      saveReview
                    }
                    disabled={
                      loading
                    }
                    className="rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Guardando..."
                      : isReread
                        ? "Guardar relectura"
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