"use client";

import Image from "next/image";
import Link from "next/link";

import {
  BookOpen,
  Check,
  CircleOff,
  Clock3,
  Eye,
  FilePenLine,
  Gamepad2,
  Library,
  ListTodo,
  RotateCcw,
  Star,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import StarRating from "@/components/media/StarRating";

import {
  getPosterImageConfig,
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  LIBRARY_PROGRESS_EVENT,
  type LibraryProgressChange,
} from "@/lib/library-progress-events";

import {
  dateLabel,
  hrefOf,
  labelOf,
  resumeLabel,
  type Actions,
  type CompletedReview,
  type LibraryEntry,
} from "./libraryShared";

function getCarouselBackdropImageConfig(
  source: string,
) {
  try {
    const url = new URL(source);

    if (
      url.protocol === "https:" &&
      url.hostname === "image.tmdb.org" &&
      /^\/t\/p\/(original|w\d+)\//.test(
        url.pathname,
      )
    ) {
      url.pathname = url.pathname.replace(
        /^\/t\/p\/(original|w\d+)\//,
        "/t/p/w780/",
      );

      return {
        src: url.toString(),
        unoptimized: true,
      };
    }
  } catch {
    // Conservar la URL original.
  }

  return {
    src: source,
    unoptimized: shouldUseOriginalImage(source),
  };
}

type CarouselProps = {
  entries: LibraryEntry[];
  reviews: Map<string, CompletedReview>;
  busy: boolean;
  actions: Actions;
};

type BookProgress = {
  pagesRead: number;
  totalPages: number;
};

type CardProps = {
  item: LibraryEntry;
  review?: CompletedReview;
  bookProgress?: BookProgress;
  busy: boolean;
  actions: Actions;
  eager?: boolean;
};

type CardMenuProps = {
  item: LibraryEntry;
  actions: Actions;
  busy: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
};

type MenuAction = {
  label: string;
  icon: LucideIcon;
  run: () => void;
  destructive?: boolean;
};

/* =========================================
   SKELETONS
========================================= */

function ProgressSkeleton() {
  return (
    <span
      role="status"
      aria-label="Cargando siguiente episodio"
      className="flex min-w-0 items-center gap-1.5 overflow-hidden"
    >
      <span className="shrink-0 frost-text-11 text-frost-muted">
        Siguiente:
      </span>

      <span
        aria-hidden="true"
        className="h-2.25 w-12 shrink-0 animate-pulse rounded-sm bg-frost-border motion-reduce:animate-none"
      />

      <span
        aria-hidden="true"
        className="h-2.25 w-7 shrink-0 animate-pulse rounded-sm bg-frost-border/70 motion-reduce:animate-none"
      />
    </span>
  );
}

/* =========================================
   INFORMACIÓN CONTEXTUAL
========================================= */

function contextLabel(
  item: LibraryEntry,
  bookProgress?: BookProgress,
): string {
  if (item.mediaType === "SERIES") {
    if (item.status === "IN_PROGRESS") {
      if (item.nextEpisode) {
        return `Siguiente: ${item.nextEpisode}`;
      }

      return "Todos los episodios vistos";
    }

    if (item.status === "PENDING") {
      return "Pendiente por ver";
    }

    if (item.status === "DROPPED") {
      return "Serie abandonada";
    }

    return "¿Quieres volver a verla?";
  }

  if (item.mediaType === "BOOK") {
    if (
      bookProgress &&
      bookProgress.totalPages > 0
    ) {
      const pages = Math.max(
        0,
        Math.min(
          bookProgress.pagesRead,
          bookProgress.totalPages,
        ),
      );

      return `Página ${pages} de ${bookProgress.totalPages}`;
    }

    if (item.status === "PENDING") {
      return "Pendiente por leer";
    }

    if (item.status === "DROPPED") {
      return "Lectura abandonada";
    }

    return "Página sin registrar";
  }

  if (item.mediaType === "GAME") {
    if (item.status === "PENDING") {
      return "Pendiente por jugar";
    }

    if (item.status === "DROPPED") {
      return "Juego abandonado";
    }

    if (item.status === "IN_PROGRESS") {
      return "¿Alguna novedad?";
    }

    return "¿Otra partida?";
  }

  if (item.status === "PENDING") {
    return "Pendiente por ver";
  }

  if (item.status === "DROPPED") {
    return "Película abandonada";
  }

  return "¿Alguna novedad?";
}

/* =========================================
   MENÚ DE GESTIÓN
========================================= */

function CardMenu({
  item,
  actions,
  busy,
  open,
  setOpen,
}: CardMenuProps) {
  const trigger =
    useRef<HTMLButtonElement>(null);

  const menu =
    useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  const dropped =
    item.status === "DROPPED";

  const menuItems: MenuAction[] = [
    {
      label: "Ratear",
      icon: Star,
      run: () => actions.rate(item),
    },
    {
      label: dropped
        ? resumeLabel(item.mediaType)
        : "Marcar como abandonado",
      icon: dropped
        ? RotateCcw
        : CircleOff,
      run: () =>
        actions.status(
          item,
          dropped
            ? "IN_PROGRESS"
            : "DROPPED",
        ),
    },
  ];

  if (dropped) {
    menuItems.push({
      label: "Mover a pendientes",
      icon: Clock3,
      run: () =>
        actions.status(item, "PENDING"),
    });
  }

  if (
    item.mediaType === "SERIES" ||
    item.mediaType === "BOOK"
  ) {
    menuItems.push({
      label: "Registrar avance",
      icon: Clock3,
      run: () => actions.progress(item),
    });
  }

  menuItems.push({
    label: "Eliminar de la biblioteca",
    icon: Trash2,
    destructive: true,
    run: () => actions.remove(item),
  });

  useEffect(() => {
    if (!open) return;

    function outside(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !trigger.current?.contains(target) &&
        !menu.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }

    function handleScroll(event: Event) {
      if (
        event.target instanceof Node &&
        menu.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener(
      "pointerdown",
      outside,
    );

    document.addEventListener(
      "keydown",
      escape,
    );

    window.addEventListener(
      "scroll",
      handleScroll,
      true,
    );

    window.addEventListener(
      "resize",
      handleScroll,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        outside,
      );

      document.removeEventListener(
        "keydown",
        escape,
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
        true,
      );

      window.removeEventListener(
        "resize",
        handleScroll,
      );
    };
  }, [open, setOpen]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }

    const rect =
      trigger.current?.getBoundingClientRect();

    if (!rect) return;

    const width = 240;
    const height =
      menuItems.length * 43 + 14;

    const gap = 8;
    const margin = 8;

    const roomBelow =
      window.innerHeight - rect.bottom;

    const preferredTop =
      roomBelow >= height + gap + margin
        ? rect.bottom + gap
        : rect.top - height - gap;

    setPosition({
      top: Math.max(
        margin,
        Math.min(
          preferredTop,
          window.innerHeight - height - margin,
        ),
      ),
      left: Math.max(
        margin,
        Math.min(
          rect.right - width,
          window.innerWidth - width - margin,
        ),
      ),
    });

    setOpen(true);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        title="Gestionar obra"
        aria-label={`Gestionar ${item.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
        className="group/manage relative z-30 flex h-full min-h-15.5 w-16 shrink-0 items-center justify-center rounded-lg border border-frost-accent bg-frost-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frost-accent disabled:opacity-50"
      >
        <ListTodo
          size={27}
          strokeWidth={1.8}
          aria-hidden="true"
          className={`transition-all duration-300 ease-out group-hover/manage:scale-110 group-hover/manage:text-frost-accent-hover group-focus-visible/manage:scale-110 group-focus-visible/manage:text-frost-accent-hover ${
            open
              ? "scale-110 text-frost-accent-hover"
              : "text-frost-text"
          }`}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={`Gestionar ${item.title}`}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: 240,
              zIndex: 9998,
            }}
            className="rounded-xl border border-frost-accent/35 bg-frost-raised p-1.5 shadow-2xl"
          >
            {menuItems.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => {
                    setOpen(false);
                    action.run();
                  }}
                  className={`flex min-h-10.75 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition disabled:opacity-40 ${
                    action.destructive
                      ? "text-red-300 hover:bg-red-400/10"
                      : "text-frost-text hover:bg-frost-raised"
                  }`}
                >
                  <Icon size={17} />

                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

/* =========================================
   TARJETA RECIENTE
========================================= */

function RecentCard({
  item,
  review,
  bookProgress,
  busy,
  actions,
  eager = false,
}: CardProps) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const image =
    item.backdropUrl || item.coverUrl;

  const imageConfig = image
    ? item.backdropUrl
      ? getCarouselBackdropImageConfig(image)
      : getPosterImageConfig(image)
    : null;

  const rating =
    review?.review.rating ?? null;

  const completed =
    item.status === null &&
    item.completedCount > 0;

  const date =
    review &&
    review.createdAt > item.updatedAt
      ? review.createdAt
      : item.updatedAt || item.addedAt;

  const TagIcon =
    item.status === "PENDING"
      ? Clock3
      : item.status === "DROPPED"
        ? CircleOff
        : item.status === "IN_PROGRESS"
          ? ({
              MOVIE: Eye,
              SERIES: Eye,
              GAME: Gamepad2,
              BOOK: BookOpen,
            } as const)[item.mediaType]
          : Check;

  const showSeriesSkeleton =
    item.mediaType === "SERIES" &&
    item.status === "IN_PROGRESS" &&
    item.nextEpisode === undefined;

  return (
    <article className="group relative w-75 shrink-0 overflow-hidden rounded-xl border border-frost-border/60 bg-frost-surface transition-colors hover:border-frost-accent/35">
      {/* IMAGEN PANORÁMICA */}

      <div className="relative h-42.5 overflow-hidden rounded-t-xl bg-frost-bg">
        {imageConfig ? (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`relative h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none ${
                menuOpen
                  ? "scale-105"
                  : "group-hover:scale-105"
              }`}
            >
              <Image
                src={imageConfig.src}
                alt={item.title}
                fill
                sizes="300px"
                draggable={false}
                loading={eager ? "eager" : "lazy"}
                unoptimized={
                  imageConfig.unoptimized
                }
                className="pointer-events-none select-none object-cover"
                style={
                  item.backdropUrl
                    ? {
                        objectPosition:
                          `${item.backdropPositionX ?? 50}% ` +
                          `${item.backdropPositionY ?? 50}%`,
                        transform:
                          `scale(${item.backdropZoom ?? 1})`,
                      }
                    : {
                        objectPosition:
                          `${item.posterPositionX ?? 50}% ` +
                          `${item.posterPositionY ?? 50}%`,
                        transform:
                          `scale(${item.posterZoom ?? 1})`,
                      }
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-frost-muted">
            <Library size={30} />
          </div>
        )}

        <Link
          href={hrefOf(item)}
          draggable={false}
          aria-label={`Abrir ${item.title}`}
          className="absolute inset-0 z-10"
        />

        <div className="pointer-events-none absolute left-0 top-3 z-20 flex h-7 frost-carousel-tag-width items-center gap-1.5 bg-frost-accent px-3 frost-text-11 font-semibold uppercase text-frost-bg">
          <TagIcon size={13} />

          <span className="truncate">
            {labelOf(item)}
          </span>
        </div>
      </div>

      {/* TRES RENGLONES + BOTÓN */}

      <div className="grid frost-carousel-cols gap-3 rounded-b-xl bg-frost-surface px-4 py-3">
        <div className="grid min-w-0 frost-carousel-rows gap-1">
          {/* RENGLÓN 1 */}

          <Link
            href={hrefOf(item)}
            title={item.title}
            draggable={false}
            className="block min-w-0 truncate text-sm font-semibold leading-5 text-frost-text transition hover:text-frost-accent-hover"
          >
            {item.title}
          </Link>

          {/* RENGLÓN 2 */}

          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            {completed &&
            rating !== null &&
            rating > 0 ? (
              <StarRating
                value={rating}
                readonly
                size={15}
                showLabel={false}
              />
            ) : showSeriesSkeleton ? (
              <ProgressSkeleton />
            ) : (
              <span
                title={contextLabel(
                  item,
                  bookProgress,
                )}
                className="min-w-0 flex-1 truncate frost-text-11 leading-4.5 text-frost-muted"
              >
                {contextLabel(
                  item,
                  bookProgress,
                )}
              </span>
            )}

            {review && (
              <FilePenLine
                size={13}
                aria-label="Review registrada"
                className="shrink-0 text-frost-accent/70"
              />
            )}
          </div>

          {/* RENGLÓN 3 */}

          <time
            dateTime={date}
            className="frost-text-11 leading-4 tabular-nums text-frost-muted"
          >
            {dateLabel(date)}
          </time>
        </div>

        <CardMenu
          item={item}
          actions={actions}
          busy={busy}
          open={menuOpen}
          setOpen={setMenuOpen}
        />
      </div>
    </article>
  );
}

/* =========================================
   CARRUSEL
========================================= */

export default function LibraryRecentCarousel({
  entries,
  reviews,
  busy,
  actions,
}: CarouselProps) {
  const viewport =
    useRef<HTMLDivElement>(null);

  const track =
    useRef<HTMLDivElement>(null);

  const [bookProgress, setBookProgress] =
    useState<Record<string, BookProgress>>({});

  const [changes, setChanges] =
    useState<
      Record<string, LibraryProgressChange>
    >({});

  /* =========================================
     EVENTOS DE PROGRESO INMEDIATOS
  ========================================= */

  useEffect(() => {
    function handleUpdate(event: Event) {
      const detail = (
        event as CustomEvent<LibraryProgressChange>
      ).detail;

      if (
        !detail?.externalId ||
        !detail.updatedAt
      ) {
        return;
      }

      const key =
        `${detail.mediaType}:${detail.externalId}`;

      setChanges((current) => ({
        ...current,
        [key]: detail,
      }));

      if (
        detail.mediaType === "BOOK" &&
        detail.pagesRead !== undefined &&
        detail.totalPages !== undefined
      ) {
        setBookProgress((current) => ({
          ...current,
          [detail.externalId]: {
            pagesRead: detail.pagesRead!,
            totalPages: detail.totalPages!,
          },
        }));
      }
    }

    window.addEventListener(
      LIBRARY_PROGRESS_EVENT,
      handleUpdate,
    );

    return () => {
      window.removeEventListener(
        LIBRARY_PROGRESS_EVENT,
        handleUpdate,
      );
    };
  }, []);

  /* =========================================
     ORDENAR ÚLTIMAS DIEZ ACTUALIZACIONES
  ========================================= */

  const visibleEntries = useMemo(() => {
    const updated = entries.map((item) => {
      const change = changes[item.key];

      if (!change) return item;

      return {
        ...item,

        updatedAt:
          change.updatedAt > item.updatedAt
            ? change.updatedAt
            : item.updatedAt,

        nextEpisode:
          change.nextEpisode !== undefined
            ? change.nextEpisode
            : item.nextEpisode,
      };
    });

    updated.sort((a, b) => {
      const aReview = reviews.get(a.key);
      const bReview = reviews.get(b.key);

      const aDate =
        aReview &&
        aReview.createdAt > a.updatedAt
          ? aReview.createdAt
          : a.updatedAt;

      const bDate =
        bReview &&
        bReview.createdAt > b.updatedAt
          ? bReview.createdAt
          : b.updatedAt;

      return bDate.localeCompare(aDate);
    });

    return updated.slice(0, 10);
  }, [
    entries,
    changes,
    reviews,
  ]);

  /* =========================================
     FLECHAS Y ARRASTRE
  ========================================= */

  const drag = useRef({
    active: false,
    moved: false,
    x: 0,
    scroll: 0,
  });

  const suppressClick =
    useRef(false);

  const [edges, setEdges] = useState(() => ({
    left: false,
    right: entries.length >= 3,
  }));

  const updateEdges = useCallback(() => {
    const element = viewport.current;

    if (!element) return;

    const maximum =
      element.scrollWidth -
      element.clientWidth;

    const left =
      element.scrollLeft > 2;

    const right =
      maximum > 2 &&
      element.scrollLeft <
        maximum - 2;

    setEdges((current) => {
      if (
        current.left === left &&
        current.right === right
      ) {
        return current;
      }

      return { left, right };
    });
  }, []);

  useEffect(() => {
    if (
      !viewport.current ||
      !track.current
    ) {
      return;
    }

    const observer =
      new ResizeObserver(updateEdges);

    observer.observe(viewport.current);
    observer.observe(track.current);

    const frame =
      window.requestAnimationFrame(
        updateEdges,
      );

    return () => {
      observer.disconnect();

      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    visibleEntries.length,
    updateEdges,
  ]);

  function pointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      (event.target instanceof Element &&
        event.target.closest("button"))
    ) {
      return;
    }

    drag.current = {
      active: true,
      moved: false,
      x: event.clientX,
      scroll:
        viewport.current?.scrollLeft ?? 0,
    };
  }

  function pointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      !drag.current.active ||
      !viewport.current
    ) {
      return;
    }

    const distance =
      event.clientX -
      drag.current.x;

    if (
      Math.abs(distance) > 7 &&
      !drag.current.moved
    ) {
      drag.current.moved = true;

      try {
        viewport.current.setPointerCapture(
          event.pointerId,
        );
      } catch {
        // Captura opcional.
      }
    }

    if (drag.current.moved) {
      event.preventDefault();

      viewport.current.scrollLeft =
        drag.current.scroll -
        distance;
    }
  }

  function pointerEnd(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (drag.current.moved) {
      suppressClick.current = true;

      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }

    drag.current.active = false;
    drag.current.moved = false;

    if (
      viewport.current?.hasPointerCapture(
        event.pointerId,
      )
    ) {
      viewport.current.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  function move(direction: number) {
    viewport.current?.scrollBy({
      left: direction * 316,
      behavior: "smooth",
    });
  }

  return (
    <>
      <style>{`
        .frost-text-11 {
          font-size: 11px;
        }

        .frost-carousel-tag-width {
          max-width: calc(100% - 20px);
        }

        .frost-carousel-cols {
          grid-template-columns: minmax(0, 1fr) 64px;
        }

        .frost-carousel-rows {
          grid-template-rows: 20px 18px 16px;
        }

        .frost-carousel-hide-scrollbar {
          scrollbar-width: none;
        }

        .frost-carousel-hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {visibleEntries.length > 0 && (
        <section className="mb-10 hidden lg:block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-frost-text sm:text-2xl">
              Actualizados recientemente
            </h2>

            <div className="flex items-center gap-3">
              {([-1, 1] as const).map(
                (direction) => (
                  <button
                    key={direction}
                    type="button"
                    aria-label={
                      direction === -1
                        ? "Deslizar a la izquierda"
                        : "Deslizar a la derecha"
                    }
                    disabled={
                      direction === -1
                        ? !edges.left
                        : !edges.right
                    }
                    onClick={() =>
                      move(direction)
                    }
                    className="flex h-7 w-7 items-center justify-center disabled:opacity-30"
                  >
                    <span
                      aria-hidden="true"
                      className={`block size-3.5 bg-contain bg-center bg-no-repeat ${
                        direction === -1
                          ? "rotate-180"
                          : ""
                      }`}
                      style={{
                        backgroundImage:
                          "url('/icons/library-carousel-arrow.svg')",
                      }}
                    />
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="relative">
            <div
              ref={viewport}
              onScroll={updateEdges}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerEnd}
              onPointerCancel={pointerEnd}
              onLostPointerCapture={pointerEnd}
              onDragStart={(event) =>
                event.preventDefault()
              }
              onClickCapture={(event) => {
                if (suppressClick.current) {
                  event.preventDefault();
                  event.stopPropagation();

                  suppressClick.current = false;
                }
              }}
              className="overflow-x-auto pb-3 frost-carousel-hide-scrollbar"
              style={{
                touchAction: "pan-y",
              }}
            >
              <div
                ref={track}
                className="flex w-max gap-4"
              >
                {visibleEntries.map(
                  (entry, index) => (
                    <RecentCard
                      key={entry.key}
                      item={entry}
                      review={reviews.get(
                        entry.key,
                      )}
                      bookProgress={
                        bookProgress[entry.externalId] ??
                        entry.bookProgress ??
                        undefined
                      }
                      actions={actions}
                      busy={busy}
                      eager={index < 3}
                    />
                  ),
                )}
              </div>
            </div>

            {edges.right && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 z-40 w-20 bg-linear-to-l from-frost-bg via-frost-bg/75 to-transparent"
              />
            )}
          </div>
        </section>
      )}
    </>
  );
}