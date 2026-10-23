export type BookFormat = "BOOK" | "MANGA" | "COMIC";

export type BookFormatSource =
  | "MANUAL"
  | "METADATA"
  | "UNKNOWN";

export type BookFormatMetadata = {
  subject?: readonly string[] | null;
  subject_key?: readonly string[] | null;
  subjects?: readonly string[] | null;
  publisher?: readonly string[] | null;
};

export type BookSearchCandidate = BookFormatMetadata & {
  key: string;
  title: string;
  author_key?: readonly string[] | null;
  author_name?: readonly string[] | null;
};

export type BookFormatClassification = {
  format: BookFormat | null;
  source: BookFormatSource;
};

export const BOOK_FORMAT_LABELS: Record<
  BookFormat,
  string
> = {
  BOOK: "Libro",
  MANGA: "Manga",
  COMIC: "Cómic",
};

export const BOOK_FORMAT_PLURALS: Record<
  BookFormat,
  string
> = {
  BOOK: "Libros",
  MANGA: "Mangas",
  COMIC: "Cómics",
};

export function isBookFormat(
  value: unknown,
): value is BookFormat {
  return (
    value === "BOOK" ||
    value === "MANGA" ||
    value === "COMIC"
  );
}

export function bookFormatLabel(
  format: BookFormat | null,
): string {
  return format === null
    ? "Lectura"
    : BOOK_FORMAT_LABELS[format];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function describesMedium(subject: string): boolean {
  return /\b(history and criticism|bibliograph(?:y|ies)|study and teaching|how to draw|drawing techniques?|criticism and interpretation)\b/.test(
    subject,
  );
}

/* =========================================
   CLASIFICACIÓN POR METADATOS
========================================= */

export function detectBookFormat(
  metadata: BookFormatMetadata,
): BookFormat | null {
  const subjects = [
    ...(metadata.subject ?? []),
    ...(metadata.subject_key ?? []),
    ...(metadata.subjects ?? []),
  ]
    .filter(
      (subject): subject is string =>
        typeof subject === "string",
    )
    .map(normalize)
    .filter(
      (subject) =>
        subject.length > 0 &&
        !describesMedium(subject),
    );

  // Manga tiene prioridad porque también
  // puede estar etiquetado como novela gráfica.

  if (
    subjects.some((subject) =>
      /\bmanga\b|\bjapanese (?:comic books?|comics?|graphic novels?)\b|\b(?:comic books?|comics?|graphic novels?) japanese\b/.test(
        subject,
      ),
    )
  ) {
    return "MANGA";
  }

  // Algunas obras no tienen materias, pero
  // sí aparecen publicadas por un sello
  // identificado expresamente como manga.

  if (
    (metadata.publisher ?? []).some((publisher) =>
      /\bmanga\b/i.test(publisher),
    )
  ) {
    return "MANGA";
  }

  if (
    subjects.some((subject) =>
      /\bcomic books?\b|\bcomics\b|\bcomic strips?\b|\bgraphic novels?\b|\bsequential art\b/.test(
        subject,
      ),
    )
  ) {
    return "COMIC";
  }

  if (
    subjects.some((subject) =>
      /\bnovels?\b|\bshort stories\b|\bessays\b|\bpoetry\b|\bpoems\b|\bbiograph(?:y|ies)\b|\bautobiograph(?:y|ies)\b|\bmemoirs?\b|\bprose fiction\b/.test(
        subject,
      ),
    )
  ) {
    return "BOOK";
  }

  return null;
}

/* =========================================
   IDENTIFICAR TÍTULO BASE DE UNA SERIE

   Berserk Deluxe Volume 4 -> berserk
   Berserk Volume 42       -> berserk

   Le bizzarre avventure di Jojo n. 17
     -> le bizzarre avventure di jojo
========================================= */

function seriesTitle(title: string): string {
  return normalize(title)
    .replace(
      /\s+(?:vol(?:ume)?|tomo|tome|issue|book|part|parte|n|no|num|numero)\s+\d+\b.*$/,
      "",
    )
    .replace(
      /\s+(?:deluxe|special|ultimate|complete|collector s|collector|omnibus|edition|edicion)+$/,
      "",
    )
    .replace(/\s+\d+$/, "")
    .trim();
}

/* =========================================
   COINCIDENCIA DE AUTORES

   Se priorizan los IDs de Open Library.
   Si no coinciden, se comprueban los nombres.
========================================= */

function authorsMatch(
  first: BookSearchCandidate,
  second: BookSearchCandidate,
): boolean {
  const firstKeys = new Set(
    (first.author_key ?? [])
      .map((key) => key.trim())
      .filter(Boolean),
  );

  if (
    firstKeys.size > 0 &&
    (second.author_key ?? []).some((key) =>
      firstKeys.has(key.trim()),
    )
  ) {
    return true;
  }

  const firstNames = new Set(
    (first.author_name ?? [])
      .map(normalize)
      .filter(Boolean),
  );

  return (
    firstNames.size > 0 &&
    (second.author_name ?? []).some((name) =>
      firstNames.has(normalize(name)),
    )
  );
}

/* =========================================
   CLASIFICACIÓN ENTRE VOLÚMENES

   Un volumen sin materias puede heredar
   Manga/Cómic si:

   1. Otro volumen tiene clasificación.
   2. Coincide el título base de la serie.
   3. Comparten al menos un autor.

   No se clasifica únicamente por título.
========================================= */

export function classifyBookSearchResults<
  T extends BookSearchCandidate,
>(
  books: readonly T[],
): Map<string, BookFormat | null> {
  const indexed = books.map((book) => ({
    book,
    format: detectBookFormat(book),
    base: seriesTitle(book.title),
  }));

  const classified = new Map<
    string,
    BookFormat | null
  >();

  for (const candidate of indexed) {
    if (
      candidate.format === "MANGA" ||
      candidate.format === "BOOK"
    ) {
      classified.set(
        candidate.book.key,
        candidate.format,
      );
      continue;
    }

    if (candidate.base.length < 6) {
      classified.set(
        candidate.book.key,
        candidate.format,
      );
      continue;
    }

    const related = indexed.filter(
      (known) =>
        known.book.key !== candidate.book.key &&
        known.base === candidate.base &&
        (known.format === "MANGA" ||
          known.format === "COMIC") &&
        authorsMatch(
          candidate.book,
          known.book,
        ),
    );

    const formats = new Set(
      related.map((known) => known.format),
    );

    // Si un tomo solo tiene la materia genérica
    // "graphic novels", pero otro del mismo
    // autor y serie es manga, usamos Manga.

    if (formats.has("MANGA")) {
      classified.set(
        candidate.book.key,
        "MANGA",
      );
    } else if (candidate.format === "COMIC") {
      classified.set(
        candidate.book.key,
        "COMIC",
      );
    } else if (formats.size === 1) {
      classified.set(
        candidate.book.key,
        "COMIC",
      );
    } else {
      classified.set(
        candidate.book.key,
        null,
      );
    }
  }

  return classified;
}

/* =========================================
   CORRECCIONES MANUALES

   La elección del usuario siempre gana
   frente a la clasificación automática.
========================================= */

export function resolveBookFormat(
  detected: BookFormat | null,
  manual: BookFormat | null = null,
): BookFormatClassification {
  if (manual !== null) {
    return {
      format: manual,
      source: "MANUAL",
    };
  }

  if (detected !== null) {
    return {
      format: detected,
      source: "METADATA",
    };
  }

  return {
    format: null,
    source: "UNKNOWN",
  };
}