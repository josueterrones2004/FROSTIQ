"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { Filters } from "../LibraryFilters";

import type {
  CompletedReview,
  LibraryEntry,
  LibraryMediaType,
  View,
} from "../libraryShared";

type Props = {
  open: boolean;
  onClose: () => void;
  entries: LibraryEntry[];
  reviews: CompletedReview[];
  view: View;
  setView: (view: View) => void;
  types: LibraryMediaType[];
  setTypes: (types: LibraryMediaType[]) => void;
};

export default function MobileLibraryFilters({
  open,
  onClose,
  entries,
  reviews,
  view,
  setView,
  types,
  setTypes,
}: Props) {
  const [draftView, setDraftView] =
    useState<View>(view);

  const [draftTypes, setDraftTypes] =
    useState<LibraryMediaType[]>(
      () => [...types],
    );

  const panelRef =
    useRef<HTMLDivElement>(null);

  const applyRef =
    useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow =
      document.body.style.overflow;

    const previousRootOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow =
      "hidden";

    applyRef.current?.focus();

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable =
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
        );

      if (!focusable?.length) return;

      const first = focusable[0];
      const last =
        focusable[focusable.length - 1];

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
      document.body.style.overflow =
        previousBodyOverflow;

      document.documentElement.style.overflow =
        previousRootOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  function apply() {
    setView(draftView);
    setTypes([...draftTypes]);
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filtros de biblioteca"
      className="fixed inset-0 z-[8200] lg:hidden"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Descartar filtros"
        onClick={onClose}
        className="absolute inset-0 bg-black/75"
      />

      <div
        ref={panelRef}
        className="absolute inset-x-0 bottom-0 flex h-[85svh] flex-col overflow-hidden rounded-t-[24px] border-t border-white/15 bg-[#151820] shadow-2xl"
      >
        <div className="shrink-0 border-b border-white/10 px-5 py-4 text-center">
          <h2 className="text-base font-semibold text-white">
            Filtrar biblioteca
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <Filters
            entries={entries}
            reviews={reviews}
            view={draftView}
            setView={setDraftView}
            types={draftTypes}
            setTypes={setDraftTypes}
          />
        </div>

        <div className="shrink-0 border-t border-white/10 px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
          <button
            ref={applyRef}
            type="button"
            onClick={apply}
            className="h-12 w-full rounded-xl bg-violet-400 font-semibold text-zinc-950"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}