"use client";

import {
  Loader2,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useId,
  useRef,
} from "react";

import { createPortal } from "react-dom";

import type {
  LibraryEntry,
} from "../libraryShared";

type Props = {
  item: LibraryEntry;
  removing: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LibraryRemoveDialog({
  item,
  removing,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();

  const cancelButton =
    useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    cancelButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !removing
      ) {
        event.preventDefault();
        onCancel();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      previousFocus?.focus();
    };
  }, [onCancel, removing]);

  const progressWarning =
    item.mediaType === "SERIES"
      ? "También se eliminarán sus episodios vistos y actividades de seguimiento."
      : item.mediaType === "BOOK"
        ? "También se eliminará su progreso de lectura."
        : "También se eliminarán sus actividades de seguimiento.";

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Cancelar eliminación"
        disabled={removing}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-[3px]"
      />

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-white/15 bg-[#1d2331] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
            <Trash2 size={21} />
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            disabled={removing}
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-500 hover:text-white disabled:opacity-40"
          >
            <X size={19} />
          </button>
        </div>

        <h2
          id={titleId}
          className="mt-5 text-xl font-semibold text-white"
        >
          ¿Eliminar de tu biblioteca?
        </h2>

        <p
          id={descriptionId}
          className="mt-3 text-sm leading-6 text-zinc-400"
        >
          Se eliminará{" "}
          <strong className="text-zinc-200">
            {item.title}
          </strong>{" "}
          de tu biblioteca.{" "}
          {progressWarning}{" "}
          Tus reviews se conservarán.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            ref={cancelButton}
            type="button"
            disabled={removing}
            onClick={onCancel}
            className="h-11 rounded-xl border border-white/10 px-5 text-sm font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={removing}
            onClick={onConfirm}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
          >
            {removing && (
              <Loader2
                size={16}
                className="animate-spin"
              />
            )}

            {removing
              ? "Eliminando..."
              : "Eliminar"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}