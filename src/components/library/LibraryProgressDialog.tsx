"use client";

import { CircleCheck, X } from "lucide-react";
import Seasons from "@/app/series/[id]/Seasons";
import {
  type LibraryEntry,
  type SeriesSeasonsResponse,
} from "./libraryShared";

export function LoadingDialog({ item, error, onClose }: {
  item: LibraryEntry;
  error: string | null;
  onClose: () => void;
}) {
  const book = item.mediaType === "BOOK";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        book ? "Actualizar lectura" : "Registrar avance"
      }
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-[3px]"
      />

      <div
        className={`relative z-10 w-full overflow-hidden rounded-2xl border border-white/15 bg-[#1b2030] shadow-2xl ${
          book ? "max-w-[520px]" : "max-w-[950px]"
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">
            {book ? "Actualizar lectura" : "Registrar avance"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white"
          >
            <X size={19} />
          </button>
        </header>

        <div className="px-6 py-8">
          <h3 className="mb-7 text-center text-xl font-semibold text-white">
            {item.title}
          </h3>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm leading-6 text-red-200"
            >
              {error}
            </p>
          ) : (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[85px] flex-col items-center justify-center gap-4"
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-violet-400 motion-reduce:animate-none"
              />

              <p className="text-xs font-medium text-zinc-500">
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

export function SeriesProgressDialog({ item, data, onClose }: {
  item: LibraryEntry;
  data: SeriesSeasonsResponse;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Avance de ${item.title}`}
      className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6"
    >
      <button
        type="button"
        aria-label="Cerrar seguimiento de serie"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-[3px]"
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-[950px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#171b27] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Registrar avance
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold text-white">
              {item.title}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="ml-4 rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-7 pt-2 sm:px-7">
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
                className="mx-auto text-zinc-500"
              />

              <p className="mt-4 text-sm text-zinc-400">
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