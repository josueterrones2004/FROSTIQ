import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Tv,
  type LucideIcon,
} from "lucide-react";

import type { SeasonSummary } from "@/app/series/[id]/Seasons";
import type { LibraryReview } from "@/components/media/LibraryReviewModalCard";
import type { BookReadingEdition } from "@/components/progress/BookProgressModal";

/* =========================================
   TIPOS DE MEDIO
========================================= */

export type LibraryMediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

export type LibraryStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DROPPED"
  | null;

export type QuickStatus = Exclude<
  LibraryStatus,
  null
>;

/* =========================================
   ENTRADAS DE BIBLIOTECA
========================================= */

export type LibraryEntry = {
  key: string;
  mediaType: LibraryMediaType;
  externalId: string;
  title: string;

  coverUrl: string | null;
  backdropUrl?: string | null;

  releaseYear: number | null;
  status: LibraryStatus;
  completedCount: number;

  updatedAt: string;
  addedAt: string;

  nextEpisode?: string | null;

  // Páginas cargadas desde el servidor.
  bookProgress?: {
    pagesRead: number;
    totalPages: number;
  } | null;

  posterPositionX?: number;
  posterPositionY?: number;
  posterZoom?: number;

  backdropPositionX?: number;
  backdropPositionY?: number;
  backdropZoom?: number;
};

export type CompletedReview = {
  id: string;
  mediaType: LibraryMediaType;
  createdAt: string;
  review: LibraryReview;
};

export type LibraryBrowserProps = {
  entries: LibraryEntry[];
  completedReviews: CompletedReview[];
};

export type Props = LibraryBrowserProps;

/* =========================================
   FILTROS Y ORDENAMIENTO
========================================= */

export type View =
  | "ALL"
  | "IN_PROGRESS"
  | "PENDING"
  | "COMPLETED"
  | "DROPPED";

export type Sort =
  | "TITLE_ASC"
  | "TITLE_DESC"
  | "RECENT"
  | "OLDEST";

export const VIEWS: {
  value: View;
  label: string;
}[] = [
  { value: "ALL", label: "Todo" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "PENDING", label: "Pendientes" },
  { value: "COMPLETED", label: "Completados" },
  { value: "DROPPED", label: "Abandonados" },
];

export const TYPES: {
  value: LibraryMediaType;
  label: string;
  icon: LucideIcon;
}[] = [
  {
    value: "MOVIE",
    label: "Películas",
    icon: Clapperboard,
  },
  {
    value: "SERIES",
    label: "Series",
    icon: Tv,
  },
  {
    value: "GAME",
    label: "Videojuegos",
    icon: Gamepad2,
  },
  {
    value: "BOOK",
    label: "Libros",
    icon: BookOpen,
  },
];

export const ALL_TYPES: LibraryMediaType[] =
  TYPES.map((type) => type.value);

export const SORTS: {
  value: Sort;
  label: string;
}[] = [
  { value: "TITLE_ASC", label: "Título A–Z" },
  { value: "TITLE_DESC", label: "Título Z–A" },
  { value: "RECENT", label: "Más recientes" },
  { value: "OLDEST", label: "Más antiguos" },
];

/* =========================================
   ACCIONES DE BIBLIOTECA
========================================= */

export type Actions = {
  rate: (item: LibraryEntry) => void;

  status: (
    item: LibraryEntry,
    status: QuickStatus,
  ) => void;

  progress: (item: LibraryEntry) => void;

  // Solo solicita la confirmación.
  // No elimina directamente.
  remove: (item: LibraryEntry) => void;
};

/* =========================================
   PROGRESO DE LIBROS
========================================= */

export type StoredBookProgress = {
  work_id: string;
  edition_id: string;
  pages_read: number;
  total_pages: number;
};

export type BookPagesResponse = {
  editions: BookReadingEdition[];
};

export type BookState = {
  editions: BookReadingEdition[];
  saved: StoredBookProgress | null;
};

/* =========================================
   PROGRESO DE SERIES
========================================= */

export type SeriesSeasonsResponse = {
  seriesId: number;
  title: string;
  posterUrl: string | null;
  seasons: SeasonSummary[];
};

/* =========================================
   RUTAS INDIVIDUALES
========================================= */

const ROUTES: Record<LibraryMediaType, string> = {
  MOVIE: "movies",
  SERIES: "series",
  GAME: "games",
  BOOK: "books",
};

export const keyOf = (
  kind: LibraryMediaType,
  id: string,
): string => `${kind}:${id}`;

export const hrefOf = (
  item: LibraryEntry,
): string =>
  `/${ROUTES[item.mediaType]}/${encodeURIComponent(
    item.externalId,
  )}`;

/* =========================================
   NORMALIZACIÓN Y FECHAS
========================================= */

export const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();

export function dateLabel(
  value?: string | null,
): string {
  if (!value) return "";

  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value,
  );

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

/* =========================================
   ETIQUETAS DE ESTADO
========================================= */

export function labelOf(
  item: LibraryEntry,
): string {
  if (item.status === "PENDING") {
    return "Pendiente";
  }

  if (item.status === "DROPPED") {
    return "Abandonado";
  }

  if (item.status === "IN_PROGRESS") {
    const labels: Record<
      LibraryMediaType,
      string
    > = {
      MOVIE: "Viendo",
      SERIES: "Viendo",
      GAME: "Jugando",
      BOOK: "Leyendo",
    };

    return labels[item.mediaType];
  }

  return item.completedCount > 0
    ? "Completado"
    : "En biblioteca";
}

export function resumeLabel(
  type: LibraryMediaType,
): string {
  const labels: Record<
    LibraryMediaType,
    string
  > = {
    MOVIE: "Volver a pendientes",
    SERIES: "Volver a ver",
    GAME: "Volver a jugar",
    BOOK: "Volver a leer",
  };

  return labels[type];
}

/* =========================================
   COINCIDENCIA DE FILTROS
========================================= */

export function matches(
  item: LibraryEntry,
  view: View,
): boolean {
  if (view === "DROPPED") {
    return item.status === "DROPPED";
  }

  if (item.status === "DROPPED") {
    return false;
  }

  if (view === "ALL") {
    return true;
  }

  if (view === "COMPLETED") {
    return item.completedCount > 0;
  }

  return item.status === view;
}

/* =========================================
   ORDENAMIENTO
========================================= */

type SortableItem = {
  title: string;
  date: string;
};

export function bySort(
  a: SortableItem,
  b: SortableItem,
  sort: Sort,
): number {
  if (sort === "TITLE_ASC") {
    return a.title.localeCompare(b.title, "es", {
      sensitivity: "base",
    });
  }

  if (sort === "TITLE_DESC") {
    return b.title.localeCompare(a.title, "es", {
      sensitivity: "base",
    });
  }

  return sort === "RECENT"
    ? b.date.localeCompare(a.date)
    : a.date.localeCompare(b.date);
}

/* =========================================
   CONTADOR DE ELEMENTOS
========================================= */

export function countLabel(
  count: number,
  view: View,
  types: LibraryMediaType[],
): string {
  const kind =
    types.length === 1
      ? types[0]
      : null;

  const singular = count === 1;

  const noun =
    kind === "MOVIE"
      ? singular
        ? "película"
        : "películas"
      : kind === "SERIES"
        ? singular
          ? "serie"
          : "series"
        : kind === "GAME"
          ? singular
            ? "videojuego"
            : "videojuegos"
          : kind === "BOOK"
            ? singular
              ? "libro"
              : "libros"
            : singular
              ? "obra"
              : "obras";

  const feminine =
    kind === null ||
    kind === "MOVIE" ||
    kind === "SERIES";

  if (view === "ALL") {
    return `${count} ${noun} en tu biblioteca`;
  }

  if (view === "IN_PROGRESS") {
    return `${count} ${noun} en progreso`;
  }

  if (view === "PENDING") {
    return `${count} ${noun} ${
      singular ? "pendiente" : "pendientes"
    }`;
  }

  const root =
    view === "COMPLETED"
      ? "completad"
      : "abandonad";

  const ending = feminine
    ? singular
      ? "a"
      : "as"
    : singular
      ? "o"
      : "os";

  return `${count} ${noun} ${root}${ending}`;
}