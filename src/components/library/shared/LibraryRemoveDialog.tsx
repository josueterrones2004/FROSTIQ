"use client";

import { Loader2 } from "lucide-react";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
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

const EXIT_DURATION = 220;

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

  const dialogRef =
    useRef<HTMLDivElement>(null);

  const closeTimer = useRef<number | null>(null);

  const closingRef = useRef(false);
  const removingRef = useRef(removing);
  const onCancelRef = useRef(onCancel);

  const [closing, setClosing] = useState(false);

  useEffect(() => {
    removingRef.current = removing;
    onCancelRef.current = onCancel;
  }, [removing, onCancel]);

  const requestClose = useCallback(() => {
    if (removingRef.current || closingRef.current) {
      return;
    }

    closingRef.current = true;
    setClosing(true);

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      onCancelRef.current();
      return;
    }

    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      onCancelRef.current();
    }, EXIT_DURATION);
  }, []);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    cancelButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled)',
        );

      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
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

      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }

      previousFocus?.focus();
    };
  }, [requestClose]);

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
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <style>{`
        @keyframes frost-remove-enter {
          from {
            opacity: 0;
            transform: scale(0.92);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes frost-remove-exit {
          from {
            opacity: 1;
            transform: scale(1);
          }

          to {
            opacity: 0;
            transform: scale(0.92);
          }
        }

        @keyframes frost-remove-backdrop-enter {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes frost-remove-backdrop-exit {
          from {
            opacity: 1;
          }

          to {
            opacity: 0;
          }
        }

        .frost-remove-panel {
          transform-origin: center;
          animation: frost-remove-enter 280ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .frost-remove-panel[data-closing="true"] {
          animation: frost-remove-exit 220ms
            ease-in both;
        }

        .frost-remove-backdrop {
          animation: frost-remove-backdrop-enter 280ms
            ease-out both;
        }

        .frost-remove-backdrop[data-closing="true"] {
          animation: frost-remove-backdrop-exit 220ms
            ease-in both;
        }

        @media (prefers-reduced-motion: reduce) {
          .frost-remove-panel,
          .frost-remove-backdrop {
            animation-duration: 1ms !important;
          }
        }
      `}</style>

      <button
        type="button"
        aria-label="Cancelar eliminación"
        disabled={removing || closing}
        onClick={requestClose}
        data-closing={closing}
        className="frost-remove-backdrop absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        data-closing={closing}
        className="frost-remove-panel relative z-10 w-full max-w-sm rounded-2xl border border-frost-border bg-frost-bg p-6 shadow-2xl"
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-frost-text"
        >
          ¿Eliminar de tu biblioteca?
        </h2>

        <p
          id={descriptionId}
          className="mt-2 text-sm leading-6 text-frost-muted"
        >
          Se eliminará{" "}
          <strong className="font-semibold text-frost-text">
            {item.title}
          </strong>{" "}
          de tu biblioteca. {progressWarning} Tus reviews
          se conservarán.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-frost-danger/20 bg-frost-danger/5 p-3 text-sm text-frost-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButton}
            type="button"
            disabled={removing || closing}
            onClick={requestClose}
            className="h-10 rounded-xl border border-frost-border px-4 text-sm font-medium text-frost-text transition-colors hover:bg-frost-raised disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={removing || closing}
            onClick={onConfirm}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-frost-danger/30 bg-frost-danger/10 px-4 text-sm font-semibold text-frost-danger transition-colors hover:bg-frost-danger/20 disabled:opacity-40"
          >
            {removing && (
              <Loader2
                size={16}
                className="animate-spin"
                aria-hidden="true"
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