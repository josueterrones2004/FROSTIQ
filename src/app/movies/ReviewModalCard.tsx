"use client";

import {
  Eye,
  EyeOff,
  Heart,
  HeartCrack,
  Pencil,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import StarRating from "@/components/media/StarRating";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  createClient,
} from "@/lib/supabase/client";

type Review = {
  id: string;
  external_id: string;
  title: string;

  cover_url:
    | string
    | null;

  cover_position_x?:
    number;

  cover_position_y?:
    number;

  cover_zoom?:
    number;

  release_year:
    | number
    | null;

  rating:
    | number
    | null;

  liked: boolean;
  is_rewatch: boolean;
  contains_spoilers: boolean;

  consumed_at: string;

  review_text:
    | string
    | null;
};

export default function ReviewModalCard({
  review,
}: {
  review:
    Review;
}) {
  const router =
    useRouter();

  const supabase =
    createClient();

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    editing,
    setEditing,
  ] =
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );

  const [
    confirmDelete,
    setConfirmDelete,
  ] =
    useState(
      false
    );

  const [
    reviewText,
    setReviewText,
  ] =
    useState(
      review.review_text ??
        ""
    );

  const [
    rating,
    setRating,
  ] =
    useState<
      number |
      null
    >(
      review.rating
    );

  const [
    liked,
    setLiked,
  ] =
    useState(
      review.liked
    );

  const [
    isRewatch,
    setIsRewatch,
  ] =
    useState(
      review.is_rewatch
    );

  const [
    containsSpoilers,
    setContainsSpoilers,
  ] =
    useState(
      review.contains_spoilers
    );

  const [
    spoilersRevealed,
    setSpoilersRevealed,
  ] =
    useState(
      !review.contains_spoilers
    );

  const coverPositionX =
    review.cover_position_x ??
    50;

  const coverPositionY =
    review.cover_position_y ??
    50;

  const coverZoom =
    review.cover_zoom ??
    1;

  function formatDate(
    date:
      string
  ) {
    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day:
          "2-digit",

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

  function resetValues() {
    setReviewText(
      review.review_text ??
        ""
    );

    setRating(
      review.rating
    );

    setLiked(
      review.liked
    );

    setIsRewatch(
      review.is_rewatch
    );

    setContainsSpoilers(
      review.contains_spoilers
    );
  }

  function openModal() {
    setEditing(
      false
    );

    resetValues();

    setSpoilersRevealed(
      !review.contains_spoilers
    );

    setConfirmDelete(
      false
    );

    setMessage(
      ""
    );

    setOpen(
      true
    );
  }

  function closeModal() {
    if (
      loading
    ) {
      return;
    }

    setOpen(
      false
    );

    setEditing(
      false
    );

    setConfirmDelete(
      false
    );

    setMessage(
      ""
    );
  }

  function cancelEditing() {
    resetValues();

    setEditing(
      false
    );

    setMessage(
      ""
    );
  }

  async function saveChanges() {
    if (
      loading
    ) {
      return;
    }

    setLoading(
      true
    );

    setMessage(
      ""
    );

    const {
      error,
    } =
      await supabase
        .from(
          "reviews"
        )
        .update({
          review_text:
            reviewText.trim() ||
            null,

          rating,

          liked,

          is_rewatch:
            isRewatch,

          contains_spoilers:
            containsSpoilers,

          experience:
            isRewatch
              ? "REWATCH"
              : "FIRST_TIME",

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          review.id
        );

    if (
      error
    ) {
      setMessage(
        error.message
      );

      setLoading(
        false
      );

      return;
    }

    setEditing(
      false
    );

    setSpoilersRevealed(
      !containsSpoilers
    );

    setLoading(
      false
    );

    setMessage(
      "Review actualizada."
    );

    router.refresh();
  }

  async function deleteReview() {
    if (
      loading
    ) {
      return;
    }

    setLoading(
      true
    );

    setMessage(
      ""
    );

    const {
      error,
    } =
      await supabase
        .from(
          "reviews"
        )
        .delete()
        .eq(
          "id",
          review.id
        );

    if (
      error
    ) {
      setMessage(
        error.message
      );

      setLoading(
        false
      );

      setConfirmDelete(
        false
      );

      return;
    }

    setLoading(
      false
    );

    setConfirmDelete(
      false
    );

    setOpen(
      false
    );

    router.refresh();
  }

  const hasText =
    reviewText
      .trim()
      .length >
    0;

  return (
    <>
      <div>
        <button
          type="button"
          onClick={
            openModal
          }
          className="block w-full text-left"
        >
          <MovieCover
            title={
              review.title
            }
            coverUrl={
              review.cover_url
            }
            positionX={
              coverPositionX
            }
            positionY={
              coverPositionY
            }
            zoom={
              coverZoom
            }
          />
        </button>

        <div className="mt-2">
          {review.rating !==
            null && (
            <StarRating
              value={
                review.rating
              }
              readonly
              size={
                16
              }
              showLabel={
                false
              }
            />
          )}

          <div className="mt-1 flex items-center gap-3 text-zinc-500">
            {review.liked ? (
              <Heart
                size={
                  17
                }
                fill="currentColor"
                className="text-red-500"
              />
            ) : (
              <HeartCrack
                size={
                  17
                }
              />
            )}

            {review.is_rewatch ? (
              <Eye
                size={
                  17
                }
              />
            ) : (
              <EyeOff
                size={
                  17
                }
              />
            )}

            {review.contains_spoilers ? (
              <ShieldAlert
                size={
                  17
                }
              />
            ) : (
              <ShieldCheck
                size={
                  17
                }
              />
            )}
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={
                closeModal
              }
              disabled={
                loading
              }
              className="absolute right-5 top-5 text-zinc-500 transition hover:text-white disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X
                size={
                  26
                }
              />
            </button>

            <div className="grid gap-8 md:grid-cols-[170px_1fr]">
              <div className="flex items-start justify-center md:pt-14">
                <div className="w-full max-w-[150px]">
                  <Link
                    href={`/movies/${review.external_id}`}
                    onClick={() =>
                      setOpen(
                        false
                      )
                    }
                  >
                    <MovieCover
                      title={
                        review.title
                      }
                      coverUrl={
                        review.cover_url
                      }
                      positionX={
                        coverPositionX
                      }
                      positionY={
                        coverPositionY
                      }
                      zoom={
                        coverZoom
                      }
                    />
                  </Link>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-3 pr-10">
                  <h2 className="text-2xl font-bold">
                    {
                      review.title
                    }
                  </h2>

                  {review.release_year && (
                    <span className="text-lg text-zinc-500">
                      {
                        review.release_year
                      }
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  Vista el{" "}
                  <span className="text-zinc-300">
                    {formatDate(
                      review.consumed_at
                    )}
                  </span>
                </p>

                <div className="mt-6">
                  <StarRating
                    value={
                      rating
                    }
                    readonly={
                      !editing
                    }
                    onChange={
                      editing
                        ? setRating
                        : undefined
                    }
                    size={
                      32
                    }
                  />
                </div>

                <div className="mt-7 flex flex-wrap items-start gap-8">
                  <ReviewToggle
                    editing={
                      editing
                    }
                    active={
                      liked
                    }
                    onClick={() =>
                      setLiked(
                        !liked
                      )
                    }
                    icon={
                      liked ? (
                        <Heart
                          size={
                            30
                          }
                          fill="currentColor"
                        />
                      ) : (
                        <HeartCrack
                          size={
                            30
                          }
                        />
                      )
                    }
                    label={
                      liked
                        ? "Me gustó"
                        : "No me gustó"
                    }
                  />

                  <ReviewToggle
                    editing={
                      editing
                    }
                    active={
                      isRewatch
                    }
                    onClick={() =>
                      setIsRewatch(
                        !isRewatch
                      )
                    }
                    icon={
                      isRewatch ? (
                        <Eye
                          size={
                            30
                          }
                        />
                      ) : (
                        <EyeOff
                          size={
                            30
                          }
                        />
                      )
                    }
                    label={
                      isRewatch
                        ? "Rewatch"
                        : "Primera vez"
                    }
                  />

                  <ReviewToggle
                    editing={
                      editing
                    }
                    active={
                      containsSpoilers
                    }
                    onClick={() =>
                      setContainsSpoilers(
                        !containsSpoilers
                      )
                    }
                    icon={
                      containsSpoilers ? (
                        <ShieldAlert
                          size={
                            30
                          }
                        />
                      ) : (
                        <ShieldCheck
                          size={
                            30
                          }
                        />
                      )
                    }
                    label={
                      containsSpoilers
                        ? "Contiene spoilers"
                        : "Sin spoilers"
                    }
                  />
                </div>

                <div className="mt-8">
                  {editing ? (
                    <textarea
                      value={
                        reviewText
                      }
                      onChange={(
                        event
                      ) =>
                        setReviewText(
                          event.target.value
                        )
                      }
                      placeholder="Escribe tu review..."
                      rows={
                        6
                      }
                      className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 leading-7 text-zinc-200 outline-none transition focus:border-fuchsia-500"
                    />
                  ) : hasText &&
                    containsSpoilers &&
                    !spoilersRevealed ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
                      <ShieldAlert
                        size={
                          32
                        }
                        className="mx-auto text-zinc-400"
                      />

                      <h3 className="mt-3 font-semibold">
                        Esta review contiene spoilers
                      </h3>

                      <p className="mt-2 text-sm text-zinc-500">
                        ¿Quieres continuar y leerla?
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setSpoilersRevealed(
                            true
                          )
                        }
                        className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                      >
                        Mostrar review
                      </button>
                    </div>
                  ) : hasText ? (
                    <div className="rounded-xl bg-zinc-900/40 p-5">
                      <p className="whitespace-pre-wrap leading-7 text-zinc-300">
                        {
                          reviewText
                        }
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-zinc-600">
                      Sin review escrita.
                    </p>
                  )}
                </div>

                {message && (
                  <p className="mt-4 text-sm text-zinc-400">
                    {
                      message
                    }
                  </p>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete(
                        true
                      )
                    }
                    disabled={
                      loading
                    }
                    className="flex items-center gap-2 rounded-xl border border-red-900/50 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
                  >
                    <Trash2
                      size={
                        17
                      }
                    />

                    Borrar
                  </button>

                  <div className="flex gap-3">
                    {!editing ? (
                      <button
                        type="button"
                        onClick={() =>
                          setEditing(
                            true
                          )
                        }
                        disabled={
                          loading
                        }
                        className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
                      >
                        <Pencil
                          size={
                            17
                          }
                        />

                        Editar
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={
                            cancelEditing
                          }
                          disabled={
                            loading
                          }
                          className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={
                            saveChanges
                          }
                          disabled={
                            loading
                          }
                          className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
                        >
                          <Save
                            size={
                              17
                            }
                          />

                          {loading
                            ? "Guardando..."
                            : "Guardar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {open &&
        confirmDelete && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={() => {
              if (
                !loading
              ) {
                setConfirmDelete(
                  false
                );
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <Trash2
                  size={
                    21
                  }
                />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-zinc-100">
                ¿Borrar review?
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                La review de{" "}
                <span className="font-medium text-zinc-300">
                  {
                    review.title
                  }
                </span>{" "}
                se eliminará permanentemente. Esta acción no se puede deshacer.
              </p>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDelete(
                      false
                    )
                  }
                  disabled={
                    loading
                  }
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    deleteReview
                  }
                  disabled={
                    loading
                  }
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2
                    size={
                      16
                    }
                  />

                  {loading
                    ? "Borrando..."
                    : "Borrar review"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

function ReviewToggle({
  editing,
  active,
  onClick,
  icon,
  label,
}: {
  editing:
    boolean;

  active:
    boolean;

  onClick:
    () => void;

  icon:
    React.ReactNode;

  label:
    string;
}) {
  return (
    <button
      type="button"
      disabled={
        !editing
      }
      onClick={
        onClick
      }
      className={`flex min-w-[90px] flex-col items-center gap-2 text-center ${
        editing
          ? "cursor-pointer"
          : "cursor-default"
      } ${
        active
          ? "text-zinc-300"
          : "text-zinc-500"
      }`}
    >
      {
        icon
      }

      <span className="text-xs">
        {
          label
        }
      </span>
    </button>
  );
}

function MovieCover({
  title,
  coverUrl,
  positionX,
  positionY,
  zoom,
}: {
  title:
    string;

  coverUrl:
    | string
    | null;

  positionX:
    number;

  positionY:
    number;

  zoom:
    number;
}) {
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition-colors duration-200 hover:border-zinc-400">
      {coverUrl ? (
        <Image
          src={
            coverUrl
          }
          alt={
            title
          }
          fill
          sizes="(max-width: 768px) 40vw, 150px"
          unoptimized={
            shouldUseOriginalImage(
              coverUrl
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
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-800 px-4 text-center text-zinc-500">
          Sin imagen
        </div>
      )}
    </div>
  );
}