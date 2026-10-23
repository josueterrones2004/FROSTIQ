"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type TouchEvent,
} from "react";

import { createPortal } from "react-dom";

import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  CircleOff,
  Clock3,
  Paintbrush,
  Play,
  RotateCcw,
  Star,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  hrefOf,
  type Actions,
  type CompletedReview,
  type LibraryEntry,
} from "../libraryShared";

import MobileLibraryHero from "./MobileLibraryHero";
import MobileSavedReviewAction from "./MobileSavedReviewAction";

type Props = {
  item: LibraryEntry;
  review?: CompletedReview;
  actions: Actions;
  onClose: () => void;
  onRequestCompletedDelete: (
    item: LibraryEntry,
  ) => void;
};

type Option = {
  key: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  danger?: boolean;
  customize?: boolean;
};

function startLabel(
  type: LibraryEntry["mediaType"],
): string {
  if (type === "GAME") {
    return "Marcar como jugando";
  }

  if (type === "BOOK") {
    return "Marcar como leyendo";
  }

  return "Marcar como viendo";
}

function repeatLabel(
  type: LibraryEntry["mediaType"],
): string {
  if (type === "GAME") {
    return "Iniciar otra partida";
  }

  if (type === "BOOK") {
    return "Comenzar relectura";
  }

  return "Volver a verla";
}

export default function MobileLibraryActionSheet({
  item,
  review,
  actions,
  onClose,
  onRequestCompletedDelete,
}: Props) {
  const marker = useId();

  const panelRef =
    useRef<HTMLElement>(null);

  const touchStartPosition =
    useRef<{
      y: number;
      x: number;
      scroll: number;
    } | null>(null);

  const [notice, setNotice] =
    useState(false);

  /* =========================================
     HISTORIAL Y TECLADO
  ========================================= */

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = "hidden";

    window.history.pushState(
      {
        ...window.history.state,
        frostiqSheet: marker,
      },
      "",
      window.location.href,
    );

    function handlePop() {
      onClose();
    }

    function handleKey(
      event: KeyboardEvent,
    ) {
      // Si la review original está abierta,
      // dejamos que maneje su propio Escape.
      const savedReviewOpen =
        document.querySelector(
          '[role="dialog"][aria-label^="Review de "]',
        );

      if (savedReviewOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const buttons =
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href]',
        );

      if (!buttons?.length) return;

      const first = buttons[0];
      const last =
        buttons[buttons.length - 1];

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

    window.addEventListener(
      "popstate",
      handlePop,
    );

    document.addEventListener(
      "keydown",
      handleKey,
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePop,
      );

      document.removeEventListener(
        "keydown",
        handleKey,
      );

      document.body.style.overflow =
        previousOverflow;

      if (
        window.history.state?.frostiqSheet ===
        marker
      ) {
        window.history.back();
      }

      previousFocus?.focus();
    };
  }, [marker, onClose]);

  /* =========================================
     AVISO DE PERSONALIZACIÓN
  ========================================= */

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(
      () => setNotice(false),
      2700,
    );

    return () =>
      window.clearTimeout(timeout);
  }, [notice]);

  const run = useCallback(
    (action: () => void) => {
      onClose();
      action();
    },
    [onClose],
  );

  /* =========================================
     DESLIZAR PARA CERRAR
  ========================================= */

  function handleTouchStart(
    event: TouchEvent<HTMLElement>,
  ) {
    const touch = event.touches[0];

    touchStartPosition.current = {
      x: touch.clientX,
      y: touch.clientY,
      scroll:
        panelRef.current?.scrollTop ?? 0,
    };
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLElement>,
  ) {
    const start =
      touchStartPosition.current;

    touchStartPosition.current = null;

    if (!start) return;

    const touch =
      event.changedTouches[0];

    const dy =
      touch.clientY - start.y;

    const dx =
      touch.clientX - start.x;

    if (
      dy > 90 &&
      dy > Math.abs(dx) * 1.4 &&
      start.scroll <= 0
    ) {
      onClose();
    }
  }

  /* =========================================
     OPCIONES POR ESTADO
  ========================================= */

  const completed =
    item.status === null &&
    item.completedCount > 0;

  const dropped =
    item.status === "DROPPED";

  const pending =
    item.status === "PENDING";

  const canProgress =
    item.mediaType === "SERIES" ||
    item.mediaType === "BOOK";

  const customize: Option = {
    key: "customize",
    label: "Personalizar",
    icon: Paintbrush,
    customize: true,
    action: () => setNotice(true),
  };

  const writeReview: Option = {
    key: "review",
    label: "Registrar review",
    icon: Star,
    action: () =>
      run(() => actions.rate(item)),
  };

  const detail: Option = {
    key: "detail",
    label: "Abrir ficha",
    icon: ArrowUpRight,
    action: () =>
      window.location.assign(hrefOf(item)),
  };

  const remove: Option = {
    key: "remove",
    label: "Eliminar de la biblioteca",
    icon: Trash2,
    danger: true,
    action: () =>
      run(() =>
        completed
          ? onRequestCompletedDelete(item)
          : actions.remove(item),
      ),
  };

  let options: Option[];

  if (completed) {
    options = [
      {
        key: "view-review",
        label: "Ver review",
        icon: Star,
        action: () => {},
      },
      customize,
      {
        key: "again",
        label: repeatLabel(item.mediaType),
        icon: RotateCcw,
        action: () =>
          run(() =>
            actions.status(
              item,
              "IN_PROGRESS",
            ),
          ),
      },
      {
        key: "pending",
        label: "Marcar como pendiente",
        icon: Clock3,
        action: () =>
          run(() =>
            actions.status(
              item,
              "PENDING",
            ),
          ),
      },
      detail,
      remove,
    ];
  } else if (dropped) {
    options = [
      {
        key: "pending",
        label: "Marcar como pendiente",
        icon: Clock3,
        action: () =>
          run(() =>
            actions.status(
              item,
              "PENDING",
            ),
          ),
      },
      {
        key: "start",
        label: startLabel(item.mediaType),
        icon: Play,
        action: () =>
          run(() =>
            actions.status(
              item,
              "IN_PROGRESS",
            ),
          ),
      },
      writeReview,
      detail,
      remove,
    ];
  } else if (pending) {
    options = [
      customize,
      writeReview,
      {
        key: "start",
        label: startLabel(item.mediaType),
        icon: Play,
        action: () =>
          run(() =>
            actions.status(
              item,
              "IN_PROGRESS",
            ),
          ),
      },
      detail,
      remove,
    ];
  } else {
    options = [
      customize,
      writeReview,
      ...(canProgress
        ? [
            {
              key: "progress",
              label: "Registrar avance",
              icon: BookOpen,
              action: () =>
                run(() =>
                  actions.progress(item),
                ),
            },
          ]
        : []),
      detail,
      {
        key: "drop",
        label: "Marcar como abandonado",
        icon: CircleOff,
        action: () =>
          run(() =>
            actions.status(
              item,
              "DROPPED",
            ),
          ),
      },
      remove,
    ];
  }

  /* =========================================
     MODAL
  ========================================= */

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Gestionar ${item.title}`}
      className="fixed inset-0 z-[8500] lg:hidden"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar al tocar fuera"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
      />

      {notice && (
        <p
          role="status"
          className="absolute left-1/2 top-[calc(14px+env(safe-area-inset-top))] z-[8600] -translate-x-1/2 rounded-xl border border-violet-400/30 bg-[#25253d] px-5 py-3 text-center text-sm font-semibold text-violet-200 shadow-xl"
        >
          Próximamente
        </p>
      )}

      <section
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-x-0 bottom-0 max-h-[89svh] overflow-y-auto overscroll-contain rounded-t-[24px] bg-[#1a1e29] pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_50px_rgba(0,0,0,.6)]"
      >
        <MobileLibraryHero
          item={item}
          review={review}
        />

        {/* SEPARADORES A TODO EL ANCHO */}

        <div className="divide-y divide-white/10">
          {options.map((option) => {
            if (
              option.key === "view-review" &&
              review
            ) {
              return (
                <MobileSavedReviewAction
                  key={option.key}
                  review={review}
                />
              );
            }

            if (
              option.key === "view-review"
            ) {
              return null;
            }

            const Icon = option.icon;

            return (
              <button
                key={option.key}
                type="button"
                onClick={option.action}
                className={`flex min-h-[58px] w-full items-center gap-3.5 px-5 text-left text-[14px] transition-colors active:bg-white/[0.06] ${
                  option.danger
                    ? "text-rose-300"
                    : "text-zinc-100"
                }`}
              >
                <Icon
                  size={19}
                  aria-hidden="true"
                  className={
                    option.danger
                      ? "text-rose-400"
                      : "text-zinc-400"
                  }
                />

                <span className="min-w-0 flex-1">
                  <span className="min-w-0 flex-1">
                   {option.label}
                 </span>
                </span>

                <ChevronRight
                  size={16}
                  className="text-zinc-500"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>,
    document.body,
  );
}