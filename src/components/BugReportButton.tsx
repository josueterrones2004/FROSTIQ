"use client";

import {
  Bug,
  Check,
  Loader2,
  X,
} from "lucide-react";

import {
  FormEvent,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type Category =
  | "BUG"
  | "UI"
  | "PERFORMANCE"
  | "OTHER";

const categories: {
  value: Category;
  label: string;
}[] = [
  {
    value: "BUG",
    label: "Error",
  },
  {
    value: "UI",
    label: "Diseño / interfaz",
  },
  {
    value: "PERFORMANCE",
    label: "Rendimiento",
  },
  {
    value: "OTHER",
    label: "Otro",
  },
];

export default function BugReportButton() {
  const [supabase] =
    useState(() =>
      createClient()
    );

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    category,
    setCategory,
  ] =
    useState<Category>(
      "BUG"
    );

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  function closeModal() {
    if (
      sending
    ) {
      return;
    }

    setOpen(false);
    setSuccess(false);
    setErrorMessage("");
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      sending
    ) {
      return;
    }

    const cleanDescription =
      description.trim();

    if (
      cleanDescription.length <
      5
    ) {
      setErrorMessage(
        "Describe un poco más el problema."
      );

      return;
    }

    setSending(true);
    setErrorMessage("");

    try {
      const {
        data: {
          user,
        },
        error:
          authError,
      } =
        await supabase.auth.getUser();

      if (
        authError ||
        !user
      ) {
        throw new Error(
          "Tu sesión ha caducado."
        );
      }

      const {
        error,
      } =
        await supabase
          .from(
            "bug_reports"
          )
          .insert({
            user_id:
              user.id,

            category,

            description:
              cleanDescription,

            page_url:
              window.location.href,

            user_agent:
              navigator.userAgent,

            viewport_width:
              window.innerWidth,

            viewport_height:
              window.innerHeight,
          });

      if (
        error
      ) {
        setErrorMessage(
          error.message
        );

        setSending(false);

        return;
      }

      setSuccess(true);
      setDescription("");

      window.setTimeout(
        () => {
          setOpen(false);
          setSuccess(false);
        },
        1200
      );
    } catch (
       error
     ) {
       if (
         typeof error ===
           "object" &&
         error !== null &&
         "message" in error &&
         typeof error.message ===
           "string"
       ) {
         setErrorMessage(
           error.message
         );
       } else {
         setErrorMessage(
           "No se pudo enviar el reporte."
         );
       }
     }
         finally {
       setSending(false);
     }
    }  return (
    <>
      <style>{`
        .frost-bug-floating { bottom: calc(88px + env(safe-area-inset-bottom)); }
        .frost-bug-modal-z { z-index: 100; }
        @media (min-width: 768px) {
          .frost-bug-floating { bottom: 20px; }
        }
      `}</style>
      {/* BUTTON */}

      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setSuccess(false);
          setErrorMessage("");
        }}
        className="fixed frost-bug-floating right-5 z-40 flex items-center gap-2 rounded-full border border-frost-border bg-frost-surface/95 px-4 py-2.5 text-sm font-medium text-frost-muted shadow-xl backdrop-blur transition hover:border-frost-accent/30 hover:text-frost-accent "
      >
        <Bug
          size={17}
        />

        <span className="hidden sm:inline">
          Reportar un problema
        </span>
      </button>

      {/* MODAL */}

      {open && (
        <div className="fixed inset-0 frost-bug-modal-z flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={
              closeModal
            }
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-frost-border bg-frost-bg shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-frost-border p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Bug
                    size={19}
                    className="text-frost-accent"
                  />

                  <h2 className="text-lg font-semibold text-frost-text">
                    Reportar un problema
                  </h2>
                </div>

                <p className="mt-2 text-sm leading-6 text-frost-muted">
                  Tu reporte incluirá automáticamente
                  la página donde ocurrió el problema.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-lg p-2 text-frost-muted transition hover:bg-frost-surface hover:text-frost-text"
                aria-label="Cerrar"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            {/* FORM */}

            {success ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check
                    size={24}
                  />
                </div>

                <h3 className="mt-4 font-semibold text-frost-text">
                  Reporte enviado
                </h3>

                <p className="mt-2 text-sm text-frost-muted">
                  Gracias por ayudar a mejorar FROSTIQ.
                </p>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="p-5"
              >
                {/* CATEGORY */}

                <div>
                  <label
                    htmlFor="bug-category"
                    className="text-sm font-medium text-frost-text"
                  >
                    Tipo de problema
                  </label>

                  <select
                    id="bug-category"
                    value={
                      category
                    }
                    onChange={(
                      event
                    ) =>
                      setCategory(
                        event.target.value as Category
                      )
                    }
                    disabled={
                      sending
                    }
                    className="mt-2 w-full rounded-xl border border-frost-border bg-frost-surface px-4 py-3 text-sm text-frost-text outline-none transition focus:border-frost-accent disabled:opacity-50"
                  >
                    {categories.map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* DESCRIPTION */}

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="bug-description"
                      className="text-sm font-medium text-frost-text"
                    >
                      ¿Qué ocurrió?
                    </label>

                    <span className="text-xs text-frost-muted">
                      {
                        description.length
                      }
                      /2000
                    </span>
                  </div>

                  <textarea
                    id="bug-description"
                    value={
                      description
                    }
                    onChange={(
                      event
                    ) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    maxLength={
                      2000
                    }
                    rows={
                      6
                    }
                    disabled={
                      sending
                    }
                    placeholder="Por ejemplo: pulsé el botón de completar y no ocurrió nada..."
                    className="mt-2 w-full resize-none rounded-xl border border-frost-border bg-frost-surface px-4 py-3 text-sm leading-6 text-frost-text outline-none transition placeholder:text-frost-muted focus:border-frost-accent disabled:opacity-50"
                  />
                </div>

                {/* ERROR */}

                {errorMessage && (
                  <p className="mt-3 text-sm text-red-400">
                    {
                      errorMessage
                    }
                  </p>
                )}

                {/* ACTIONS */}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      sending
                    }
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-frost-muted transition hover:bg-frost-surface hover:text-frost-text disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      description.trim().length <
                        5
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-frost-accent px-4 py-2.5 text-sm font-semibold text-frost-bg transition hover:bg-frost-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        Enviando...
                      </>
                    ) : (
                      <>
                        <Bug
                          size={16}
                        />

                        Enviar reporte
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}