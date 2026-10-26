"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { LibraryEntry } from "../libraryShared";

type Props = {
  item: LibraryEntry;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function MobileCompletedDeleteDialog({
  item,
  busy,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const lastFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    cancelRef.current?.focus();

    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
      lastFocus?.focus();
    };
  }, [busy, onCancel]);

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`Eliminar ${item.title} y sus reviews`}
      className="fixed inset-0 flex items-center justify-center p-5"
      style={{ zIndex: 9500 }}
    >
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancel}
        disabled={busy}
        className="absolute inset-0 bg-black/85"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-frost-border bg-frost-surface p-5 shadow-2xl">
        <Trash2
          size={23}
          className="text-frost-danger"
          aria-hidden="true"
        />

        <h2 className="mt-4 text-lg font-bold text-frost-text">
          ¿Eliminar de tu biblioteca?
        </h2>

        <p className="mt-2 text-sm leading-6 text-frost-muted">
          También se eliminarán las reviews guardadas de{" "}
          <strong className="text-frost-text">
            {item.title}
          </strong>
          . Esta acción no se puede deshacer.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-frost-danger/10 p-3 text-xs text-frost-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-11 rounded-lg border border-frost-border px-4 text-sm font-medium text-frost-text transition-colors hover:bg-frost-raised disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            {busy && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            {busy ? "Eliminando..." : "Eliminar todo"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}