"use client";

import {
  AlertTriangle,
  BookOpen,
  X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

export type BookReadingEdition = {
  id: string;
  title: string;
  pageCount: number;
  language?: string | null;
  published?: string | null;
};

export type BookReadingProgress = {
  editionId: string;
  pagesRead: number;
  totalPages: number;
};

type Props = {
  bookTitle: string;
  editions: BookReadingEdition[];
  initialEditionId?: string | null;
  initialPages?: number;
  onClose: () => void;
  onSave: (progress: BookReadingProgress) => Promise<void>;
  onCompleted: () => void;
};

function clampPages(value: number, maximum: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(
    0,
    Math.min(Math.trunc(value), maximum),
  );
}

export default function BookProgressModal({
  bookTitle,
  editions,
  initialEditionId = null,
  initialPages = 0,
  onClose,
  onSave,
  onCompleted,
}: Props) {
  const titleId = useId();

  const initialEdition =
    editions.find(
      (edition) => edition.id === initialEditionId,
    ) ??
    editions[0] ??
    null;

  const [editionId, setEditionId] = useState(
    initialEdition?.id ?? "",
  );

  const edition =
    editions.find((item) => item.id === editionId) ??
    null;

  const totalPages = edition?.pageCount ?? 0;

  const initialValidPages = clampPages(
    initialPages,
    initialEdition?.pageCount ?? 0,
  );

  const [pagesText, setPagesText] = useState(
    String(initialValidPages),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);

  const pagesRead =
    pagesText === ""
      ? null
      : clampPages(Number(pagesText), totalPages);

  const changed =
    editionId !== (initialEdition?.id ?? "") ||
    pagesText === "" ||
    pagesRead !== initialValidPages;

  const completed =
    totalPages > 0 &&
    pagesRead !== null &&
    pagesRead === totalPages;

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      event.preventDefault();

      if (discardOpen) {
        setDiscardOpen(false);
        return;
      }

      if (saving) return;

      if (changed) {
        setDiscardOpen(true);
      } else {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    changed,
    discardOpen,
    onClose,
    saving,
  ]);

  function requestClose() {
    if (saving) return;

    if (changed) {
      setDiscardOpen(true);
    } else {
      onClose();
    }
  }

  function updatePages(value: number) {
    setPagesText(
      String(clampPages(value, totalPages)),
    );
    setError("");
  }

  function handleTextInput(value: string) {
    const digits = value.replace(/\D/g, "");

    if (digits === "") {
      setPagesText("");
      setError("");
      return;
    }

    setPagesText(
      String(
        clampPages(Number(digits), totalPages),
      ),
    );

    setError("");
  }

  function selectEdition(id: string) {
    const nextEdition = editions.find(
      (item) => item.id === id,
    );

    if (!nextEdition) return;

    const currentPages = pagesRead ?? 0;

    setEditionId(id);
    setPagesText(
      String(
        clampPages(
          currentPages,
          nextEdition.pageCount,
        ),
      ),
    );

    setError("");
  }

  async function save() {
    if (
      saving ||
      !edition ||
      totalPages <= 0 ||
      pagesRead === null
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({
        editionId: edition.id,
        pagesRead,
        totalPages,
      });

      if (completed) {
        onCompleted();
      } else {
        onClose();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el progreso.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar registro de lectura"
        onClick={requestClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-[3px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/15 bg-[#1b2030] shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2
            id={titleId}
            className="text-lg font-semibold text-white"
          >
            Actualizar lectura
          </h2>

          <button
            type="button"
            aria-label="Cerrar"
            disabled={saving}
            onClick={requestClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X size={19} />
          </button>
        </header>

        <div className="px-6 py-8">
          <div className="mb-7 text-center">
            <BookOpen
              size={22}
              className="mx-auto mb-3 text-violet-300"
            />

            <h3 className="text-xl font-semibold text-white">
              {bookTitle}
            </h3>
          </div>

          {editions.length === 0 ? (
            <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm leading-6 text-amber-200">
              No encontramos una edición de este libro
              con un número de páginas conocido.
              No se registrará un total supuesto.
            </p>
          ) : (
            <>
              {editions.length > 1 && (
                <label className="mb-7 block">
                  <span className="mb-2 block text-xs font-medium text-zinc-400">
                    Edición
                  </span>

                  <select
                    value={editionId}
                    disabled={saving}
                    onChange={(event) =>
                      selectEdition(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-white/15 bg-[#252d3e] px-3 text-sm text-zinc-200 outline-none focus:border-violet-300 disabled:opacity-40"
                  >
                    {editions.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.title} — {item.pageCount} páginas
                        {item.published
                          ? ` (${item.published})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-zinc-500">
                    El número de páginas puede variar
                    según la edición.
                  </p>
                </label>
              )}

              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {([-5, -1] as const).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      updatePages(
                        (pagesRead ?? 0) + amount,
                      )
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#30394e] text-sm font-medium text-zinc-200 transition-colors hover:bg-[#3b4560] disabled:opacity-40"
                  >
                    {amount}
                  </button>
                ))}

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Páginas leídas"
                  autoComplete="off"
                  disabled={saving}
                  value={pagesText}
                  placeholder={String(totalPages)}
                  onChange={(event) =>
                    handleTextInput(event.target.value)
                  }
                  onBlur={() => {
                    if (pagesRead !== null) {
                      setPagesText(String(pagesRead));
                    }
                  }}
                  className="h-20 w-[125px] min-w-0 rounded-xl border border-violet-300/35 bg-[#202638] px-2 text-center text-3xl font-medium tabular-nums text-white outline-none placeholder:text-zinc-600 focus:border-violet-300 disabled:opacity-40"
                />

                {([1, 5] as const).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      updatePages(
                        (pagesRead ?? 0) + amount,
                      )
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#30394e] text-sm font-medium text-zinc-200 transition-colors hover:bg-[#3b4560] disabled:opacity-40"
                  >
                    +{amount}
                  </button>
                ))}
              </div>

              <div className="mt-9">
                <input
                  type="range"
                  aria-label="Avance de lectura"
                  min={0}
                  max={totalPages}
                  step={1}
                  disabled={saving}
                  value={pagesRead ?? 0}
                  onChange={(event) =>
                    updatePages(
                      Number(event.target.value),
                    )
                  }
                  className="w-full cursor-pointer accent-violet-300 disabled:cursor-not-allowed"
                />

                <p className="mt-2 text-center text-xs text-zinc-500">
                  {pagesRead ?? 0} de {totalPages} páginas
                </p>
              </div>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 text-sm text-red-300"
            >
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-white/10 px-6 py-5">
          <button
            type="button"
            disabled={saving}
            onClick={requestClose}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={
              saving ||
              !edition ||
              totalPages <= 0 ||
              pagesRead === null
            }
            onClick={() => void save()}
            className="rounded-lg bg-violet-300 px-4 py-2.5 text-sm font-semibold text-[#161827] hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Guardando..."
              : "Guardar progreso"}
          </button>
        </footer>
      </section>

      {discardOpen && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/70 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-label="Descartar progreso"
            className="w-full max-w-sm rounded-xl border border-white/15 bg-[#252d3e] p-6 shadow-2xl"
          >
            <AlertTriangle
              size={23}
              className="mb-4 text-amber-300"
            />

            <h3 className="text-lg font-semibold text-white">
              ¿Descartar cambios?
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              El avance que modificaste no se guardará.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDiscardOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200"
              >
                Seguir editando
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-red-400/15 px-4 py-2 text-sm font-medium text-red-200"
              >
                Descartar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}