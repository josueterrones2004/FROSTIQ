"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { CircleCheck, X } from "lucide-react";
import Seasons from "@/app/series/[id]/Seasons";

import {
  type LibraryEntry,
  type SeriesSeasonsResponse,
} from "./libraryShared";

const EXIT_DURATION = 220;

function useProgressDialogClose(onClose: () => void) {
  const [closing, setClosing] = useState(false);

  const closingRef = useRef(false);
  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;

    closingRef.current = true;
    setClosing(true);

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      onCloseRef.current();
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onCloseRef.current();
    }, EXIT_DURATION);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    closing,
    requestClose,
  };
}

function ProgressDialogAnimation({
  closing,
}: {
  closing: boolean;
}) {
  return (
    <style>{`
      @keyframes frost-progress-enter {
        from {
          opacity: 0;
          transform: scale(0.92);
        }

        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes frost-progress-exit {
        from {
          opacity: 1;
          transform: scale(1);
        }

        to {
          opacity: 0;
          transform: scale(0.92);
        }
      }

      @keyframes frost-progress-backdrop-enter {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes frost-progress-backdrop-exit {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .frost-progress-panel {
        transform-origin: center;
        animation: ${
          closing
            ? "frost-progress-exit 220ms ease-in both"
            : "frost-progress-enter 280ms cubic-bezier(0.22, 1, 0.36, 1) both"
        };
      }

      .frost-progress-backdrop {
        animation: ${
          closing
            ? "frost-progress-backdrop-exit 220ms ease-in both"
            : "frost-progress-backdrop-enter 280ms ease-out both"
        };
      }

      @media (prefers-reduced-motion: reduce) {
        .frost-progress-panel,
        .frost-progress-backdrop {
          animation-duration: 1ms !important;
        }
      }
    `}</style>
  );
}

export function LoadingDialog({
  item,
  error,
  onClose,
}: {
  item: LibraryEntry;
  error: string | null;
  onClose: () => void;
}) {
  const book = item.mediaType === "BOOK";

  const { closing, requestClose } =
    useProgressDialogClose(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        book ? "Actualizar lectura" : "Registrar avance"
      }
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 300 }}
    >
      <ProgressDialogAnimation closing={closing} />

      <button
        type="button"
        aria-label="Cerrar"
        onClick={requestClose}
        disabled={closing}
        className="frost-progress-backdrop absolute inset-0 bg-black/75"
        style={{
          backdropFilter: "blur(3px)",
        }}
      />

      <div
        className="frost-progress-panel relative z-10 w-full overflow-hidden rounded-2xl border border-frost-border bg-frost-surface shadow-2xl"
        style={{ maxWidth: book ? 520 : 950 }}
      >
        <header className="flex items-center justify-between border-b border-frost-border px-6 py-5">
          <h2 className="text-lg font-semibold text-frost-text">
            {book ? "Actualizar lectura" : "Registrar avance"}
          </h2>

          <button
            type="button"
            onClick={requestClose}
            disabled={closing}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-frost-muted transition-colors hover:bg-frost-raised hover:text-frost-text disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </header>

        <div className="px-6 py-8">
          <h3 className="mb-7 text-center text-xl font-semibold text-frost-text">
            {item.title}
          </h3>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-frost-danger/20 bg-frost-danger/5 p-4 text-sm leading-6 text-frost-danger"
            >
              {error}
            </p>
          ) : (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center gap-4"
              style={{ minHeight: 85 }}
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 animate-spin rounded-full border-2 border-frost-border border-t-frost-accent motion-reduce:animate-none"
              />

              <p className="text-xs font-medium text-frost-muted">
                {book
                  ? "Cargando progreso de lectura..."
                  : "Cargando temporadas..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SeriesProgressDialog({
  item,
  data,
  onClose,
}: {
  item: LibraryEntry;
  data: SeriesSeasonsResponse;
  onClose: () => void;
}) {
  const { closing, requestClose } =
    useProgressDialogClose(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Avance de ${item.title}`}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
      style={{ zIndex: 300 }}
    >
      <ProgressDialogAnimation closing={closing} />

      <button
        type="button"
        aria-label="Cerrar seguimiento de serie"
        onClick={requestClose}
        disabled={closing}
        className="frost-progress-backdrop absolute inset-0 bg-black/80"
        style={{
          backdropFilter: "blur(3px)",
        }}
      />

      <div
        className="frost-progress-panel relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border border-frost-border bg-frost-surface shadow-2xl"
        style={{
          maxHeight: "92dvh",
          maxWidth: 950,
        }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-frost-border px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p
              className="font-semibold uppercase text-frost-accent"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
              }}
            >
              Registrar avance
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold text-frost-text">
              {item.title}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={requestClose}
            disabled={closing}
            className="ml-4 rounded-lg p-2 text-frost-muted transition-colors hover:bg-frost-raised hover:text-frost-text disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-7 sm:px-7">
          {data.seasons.length > 0 ? (
            <Seasons
              key={item.externalId}
              embedded
              seriesId={data.seriesId}
              seriesTitle={data.title}
              posterUrl={data.posterUrl}
              seasons={data.seasons}
            />
          ) : (
            <div className="py-16 text-center">
              <CircleCheck
                size={28}
                className="mx-auto text-frost-muted"
              />

              <p className="mt-4 text-sm text-frost-muted">
                Esta serie no tiene temporadas disponibles
                para registrar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}