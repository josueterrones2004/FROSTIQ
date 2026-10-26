"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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

const ANIMATION_MS = 320;
const CLOSE_THRESHOLD = 95;

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
    useState<LibraryMediaType[]>(() => [...types]);

  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const applyRef = useRef<HTMLButtonElement>(null);

  const closingRef = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragDistanceRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);

  const finishCloseRef = useRef(onClose);
  useEffect(() => {
    finishCloseRef.current = onClose;
  }, [onClose]);

  const reducedMotionRef = useRef(false);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    finishCloseRef.current();
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;

    closingRef.current = true;
    setClosing(true);
    setDragging(false);
    setDragY(0);

    if (reducedMotionRef.current) {
      finishClose();
      return;
    }

    closeTimerRef.current = window.setTimeout(
      finishClose,
      ANIMATION_MS + 30,
    );
  }, [finishClose]);

  useEffect(() => {
    if (!open) return;

    reducedMotionRef.current =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

    const previousBodyOverflow =
      document.body.style.overflow;

    const previousRootOverflow =
      document.documentElement.style.overflow;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    let innerFrame = 0;
    const animationFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    applyRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable =
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),[tabindex]:not([tabindex="-1"])',
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
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(innerFrame);

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }

      document.body.style.overflow =
        previousBodyOverflow;

      document.documentElement.style.overflow =
        previousRootOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      previousFocus?.focus();
    };
  }, [open, requestClose]);

  function apply() {
    if (closingRef.current) return;

    setView(draftView);
    setTypes([...draftTypes]);

    requestClose();
  }

  function startDrag(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      closingRef.current ||
      event.pointerType === "mouse"
    ) {
      return;
    }

    const content = contentRef.current;

    if (
      content?.contains(event.target as Node) &&
      content.scrollTop > 0
    ) {
      return;
    }

    dragStartRef.current = event.clientY;
    dragDistanceRef.current = 0;
    setDragging(true);
  }

  function moveDrag(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      dragStartRef.current === null ||
      closingRef.current
    ) {
      return;
    }

    const distance = Math.max(
      0,
      event.clientY - dragStartRef.current,
    );

    dragDistanceRef.current = distance;
    setDragY(distance);
  }

  function endDrag() {
    if (dragStartRef.current === null) return;

    const distance = dragDistanceRef.current;

    dragStartRef.current = null;
    dragDistanceRef.current = 0;
    setDragging(false);

    if (distance >= CLOSE_THRESHOLD) {
      requestClose();
    } else {
      setDragY(0);
    }
  }

  if (!open) return null;

  const translate =
    closing
      ? "translateY(100%)"
      : !visible
        ? "translateY(100%)"
        : `translateY(${dragY}px)`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filtros de biblioteca"
      className="fixed inset-0"
      style={{ zIndex: 8200 }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .frost-filters-backdrop,
          .frost-filters-panel {
            transition: none !important;
          }
        }
      `}</style>

      <button
        type="button"
        tabIndex={-1}
        aria-label="Descartar filtros"
        onClick={requestClose}
        className="frost-filters-backdrop absolute inset-0 bg-black"
        style={{
          opacity: visible && !closing ? 0.75 : 0,
          transition: `opacity ${ANIMATION_MS}ms ease`,
        }}
      />

      <div
        ref={panelRef}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="frost-filters-panel absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-3xl border-t border-frost-border bg-frost-surface shadow-2xl"
        style={{
          height: "85svh",
          transform: translate,
          transition:
            dragging
              ? "none"
              : `transform ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: "transform",
        }}
      >
        <div
          className="shrink-0 border-b border-frost-border px-5 py-4 text-center"
          style={{
            touchAction: "none",
            cursor: dragging ? "grabbing" : "grab",
          }}
        >

          <h2 className="text-base font-semibold text-frost-text">
            Filtrar biblioteca
          </h2>
        </div>

        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5"
        >
          <Filters
            entries={entries}
            reviews={reviews}
            view={draftView}
            setView={setDraftView}
            types={draftTypes}
            setTypes={setDraftTypes}
          />
        </div>

        <div
          className="shrink-0 border-t border-frost-border px-5 pt-3"
          style={{
            paddingBottom:
              "calc(14px + env(safe-area-inset-bottom))",
          }}
        >
          <button
            ref={applyRef}
            type="button"
            onClick={apply}
            disabled={closing}
            className="h-12 w-full rounded-xl bg-frost-accent font-semibold text-frost-bg transition-colors hover:bg-frost-accent-hover disabled:opacity-50"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
