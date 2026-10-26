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
  danger?: boolean;
};

type NoticePhase =
  | "hidden"
  | "entering"
  | "visible"
  | "leaving";

const SHEET_DURATION = 320;
const DISMISS_DISTANCE = 95;
const NOTICE_DURATION = 2100;
const NOTICE_EXIT_DURATION = 240;

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

  const dragDistanceRef = useRef(0);
  const closingRef = useRef(false);

  const closeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const noticeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const noticeExitTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingActionRef =
    useRef<(() => void) | null>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const reducedMotionRef = useRef(false);

  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  const [noticePhase, setNoticePhase] =
    useState<NoticePhase>("hidden");

  const [noticeBuzz, setNoticeBuzz] =
    useState(0);

  const [noticeHasAppeared, setNoticeHasAppeared] =
    useState(false);

  const clearNoticeTimers = useCallback(() => {
    if (noticeTimerRef.current !== null) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }

    if (noticeExitTimerRef.current !== null) {
      clearTimeout(noticeExitTimerRef.current);
      noticeExitTimerRef.current = null;
    }
  }, []);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const pendingAction =
      pendingActionRef.current;

    pendingActionRef.current = null;

    onCloseRef.current();

    pendingAction?.();
  }, []);

  const requestClose = useCallback(
    (afterClose?: () => void) => {
      if (closingRef.current) return;

      closingRef.current = true;

      pendingActionRef.current =
        afterClose ?? null;

      touchStartPosition.current = null;
      dragDistanceRef.current = 0;

      setDragging(false);
      setDragY(0);
      setClosing(true);

      clearNoticeTimers();
      setNoticePhase("hidden");

      if (reducedMotionRef.current) {
        finishClose();
        return;
      }

      closeTimerRef.current = setTimeout(
        finishClose,
        SHEET_DURATION + 20,
      );
    },
    [clearNoticeTimers, finishClose],
  );

  const run = useCallback(
    (action: () => void) => {
      requestClose(action);
    },
    [requestClose],
  );

  const dismissNotice = useCallback(() => {
    if (
      noticeExitTimerRef.current !== null
    ) {
      clearTimeout(noticeExitTimerRef.current);
    }

    if (reducedMotionRef.current) {
      setNoticePhase("hidden");
      return;
    }

    setNoticePhase("leaving");

    noticeExitTimerRef.current = setTimeout(
      () => {
        setNoticePhase("hidden");
        noticeExitTimerRef.current = null;
      },
      NOTICE_EXIT_DURATION,
    );
  }, []);

  const showNotice = useCallback(() => {
    if (closingRef.current) return;

    clearNoticeTimers();

    if (noticeHasAppeared) {
      setNoticePhase("visible");
      setNoticeBuzz((current) => current + 1);
    } else {
      setNoticeHasAppeared(true);
      setNoticePhase("entering");
    }

    noticeTimerRef.current = setTimeout(
      dismissNotice,
      NOTICE_DURATION,
    );
  }, [
    clearNoticeTimers,
    dismissNotice,
    noticeHasAppeared,
  ]);

  useEffect(() => {
    reducedMotionRef.current =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

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

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    function handlePop() {
      requestClose();
    }

    function handleKey(
      event: KeyboardEvent,
    ) {
      const savedReviewOpen =
        document.querySelector(
          '[role="dialog"][aria-label^="Review de "]',
        );

      if (savedReviewOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;

      const buttons =
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href]',
        );

      if (!buttons?.length) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];

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
      cancelAnimationFrame(frame);

      window.removeEventListener(
        "popstate",
        handlePop,
      );

      document.removeEventListener(
        "keydown",
        handleKey,
      );

      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }

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
  }, [marker, requestClose]);

  useEffect(() => {
    return () => {
      clearNoticeTimers();
    };
  }, [clearNoticeTimers]);

  function handleTouchStart(
    event: TouchEvent<HTMLElement>,
  ) {
    if (closingRef.current) return;

    const touch = event.touches[0];

    if (!touch) return;

    touchStartPosition.current = {
      x: touch.clientX,
      y: touch.clientY,
      scroll: panelRef.current?.scrollTop ?? 0,
    };

    dragDistanceRef.current = 0;
  }

  function handleTouchMove(
    event: TouchEvent<HTMLElement>,
  ) {
    const start = touchStartPosition.current;

    if (
      !start ||
      closingRef.current ||
      start.scroll > 0
    ) {
      return;
    }

    const touch = event.touches[0];

    if (!touch) return;

    const dy = touch.clientY - start.y;
    const dx = touch.clientX - start.x;

    if (
      dy <= 0 ||
      dy <= Math.abs(dx) * 1.4
    ) {
      if (!dragging) {
        dragDistanceRef.current = 0;
      }

      return;
    }

    const distance = Math.max(0, dy);

    dragDistanceRef.current = distance;

    setDragging(true);
    setDragY(distance);
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLElement>,
  ) {
    const start = touchStartPosition.current;

    touchStartPosition.current = null;

    if (!start || closingRef.current) return;

    const touch = event.changedTouches[0];

    if (!touch) {
      setDragging(false);
      setDragY(0);
      return;
    }

    const dy = touch.clientY - start.y;
    const dx = touch.clientX - start.x;

    const shouldClose =
      dy >= DISMISS_DISTANCE &&
      dy > Math.abs(dx) * 1.4 &&
      start.scroll <= 0;

    dragDistanceRef.current = 0;

    if (shouldClose) {
      requestClose();
      return;
    }

    setDragging(false);
    setDragY(0);
  }

  function handleTouchCancel() {
    touchStartPosition.current = null;
    dragDistanceRef.current = 0;
    setDragging(false);
    setDragY(0);
  }

  const completed =
    item.status === null &&
    item.completedCount > 0;

  const dropped = item.status === "DROPPED";
  const pending = item.status === "PENDING";

  const canProgress =
    item.mediaType === "SERIES" ||
    item.mediaType === "BOOK";

  const customize: Option = {
    key: "customize",
    label: "Personalizar",
    icon: Paintbrush,
  };

  const writeReview: Option = {
    key: "review",
    label: "Registrar review",
    icon: Star,
  };

  const detail: Option = {
    key: "detail",
    label: "Abrir ficha",
    icon: ArrowUpRight,
  };

  const remove: Option = {
    key: "remove",
    label: "Eliminar de la biblioteca",
    icon: Trash2,
    danger: true,
  };

  let options: Option[];

  if (completed) {
    options = [
      {
        key: "view-review",
        label: "Ver review",
        icon: Star,
      },
      customize,
      {
        key: "again",
        label: repeatLabel(item.mediaType),
        icon: RotateCcw,
      },
      {
        key: "pending",
        label: "Marcar como pendiente",
        icon: Clock3,
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
      },
      {
        key: "start",
        label: startLabel(item.mediaType),
        icon: Play,
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
      },
      detail,
      remove,
    ];
  } else {
    options = [
      customize,
      writeReview,
      ...(canProgress
        ? [{
            key: "progress",
            label: "Registrar avance",
            icon: BookOpen,
          }]
        : []),
      detail,
      {
        key: "drop",
        label: "Marcar como abandonado",
        icon: CircleOff,
      },
      remove,
    ];
  }

  function handleOption(key: string) {
    switch (key) {
      case "customize":
        showNotice();
        return;
      case "review":
        run(() => actions.rate(item));
        return;
      case "detail":
        run(() => window.location.assign(hrefOf(item)));
        return;
      case "remove":
        run(() => {
          if (completed) {
            onRequestCompletedDelete(item);
          } else {
            actions.remove(item);
          }
        });
        return;
      case "again":
      case "start":
        run(() => actions.status(item, "IN_PROGRESS"));
        return;
      case "pending":
        run(() => actions.status(item, "PENDING"));
        return;
      case "drop":
        run(() => actions.status(item, "DROPPED"));
        return;
      case "progress":
        run(() => actions.progress(item));
        return;
    }
  }

  const panelTransform =
    closing || !visible
      ? "translateY(100%)"
      : `translateY(${dragY}px)`;

  const noticeVisible =
    noticePhase !== "hidden";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Gestionar ${item.title}`}
      className="fixed inset-0"
      style={{ zIndex: 8500 }}
    >
      <style>{`
        @keyframes frost-action-notice-enter {
          from {
            opacity: 0;
            transform: translate(-50%, -24px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes frost-action-notice-exit {
          from {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -24px);
          }
        }

        @keyframes frost-action-notice-buzz {
          0%, 100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-5px);
          }
          40% {
            transform: translateX(5px);
          }
          60% {
            transform: translateX(-3px);
          }
          80% {
            transform: translateX(3px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .frost-action-notice {
            animation-duration: 1ms !important;
          }
          .frost-action-sheet-panel,
          .frost-action-sheet-backdrop {
            transition: none !important;
          }
        }
      `}</style>

      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar al tocar fuera"
        onClick={() => requestClose()}
        className="frost-action-sheet-backdrop absolute inset-0 bg-black"
        style={{
          opacity:
            visible && !closing
              ? 0.75
              : 0,
          backdropFilter: "blur(2px)",
          transition: `opacity ${SHEET_DURATION}ms ease`,
        }}
      />

      {noticeVisible && (
        <div
          className="frost-action-notice pointer-events-none absolute left-1/2 rounded-xl border border-frost-accent/30 bg-frost-raised px-5 py-3 text-center text-sm font-semibold text-frost-accent shadow-xl"
          style={{
            top: "calc(14px + env(safe-area-inset-top))",
            zIndex: 8600,
            transform: "translateX(-50%)",
            animation:
              noticePhase === "leaving"
                ? `frost-action-notice-exit ${NOTICE_EXIT_DURATION}ms ease-in both`
                : noticePhase === "entering"
                  ? "frost-action-notice-enter 280ms ease-out both"
                  : "none",
          }}
        >
          <span
            key={noticeBuzz}
            role="status"
            className="block"
            style={{
              animation:
                noticeBuzz > 0
                  ? "frost-action-notice-buzz 280ms ease-in-out"
                  : undefined,
            }}
          >
            Próximamente
          </span>
        </div>
      )}

      <section
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="frost-action-sheet-panel absolute inset-x-0 bottom-0 overflow-y-auto overscroll-contain rounded-t-3xl bg-frost-surface shadow-2xl"
        style={{
          maxHeight: "89svh",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow:
            "0 -18px 50px rgba(0,0,0,0.6)",
          transform: panelTransform,
          transition:
            dragging
              ? "none"
              : `transform ${SHEET_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: "transform",
          touchAction: "pan-y",
        }}
      >
        <MobileLibraryHero
          item={item}
          review={review}
        />

        <div className="divide-y divide-frost-border/40">
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

            if (option.key === "view-review") {
              return null;
            }

            const Icon = option.icon;

            return (
              <button
                key={option.key}
                type="button"
                disabled={closing}
                onClick={() => handleOption(option.key)}
                className={`flex min-h-14.5 w-full items-center gap-3.5 px-5 text-left text-sm transition-colors active:bg-frost-raised disabled:opacity-50 ${
                  option.danger
                    ? "text-frost-danger"
                    : "text-frost-text"
                }`}
              >
                <Icon
                  size={19}
                  aria-hidden="true"
                  className={
                    option.danger
                      ? "text-frost-danger"
                      : "text-frost-muted"
                  }
                />

                <span className="min-w-0 flex-1">
                  {option.label}
                </span>

                <ChevronRight
                  size={16}
                  className="text-frost-muted"
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