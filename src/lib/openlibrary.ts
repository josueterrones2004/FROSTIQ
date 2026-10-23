
export type OpenLibrarySearchBook = {
  key: string;
  title: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  cover_i?: number;
  cover_width?: number;
  cover_height?: number;
  edition_count?: number;
  subject?: string[];
  subject_key?: string[];
  publisher?: string[];
};

export type OpenLibrarySearchResponse = {
    numFound: number;
    start: number;
    docs: OpenLibrarySearchBook[];
};
export type OpenLibraryWork = {
    key: string;
    title: string;
    first_publish_date?: string;
    description?: string | {
        type?: string;
        value?: string;
    };
    covers?: number[];
    subjects?: string[];
    authors?: {
        author: {
            key: string;
        };
        type?: {
            key: string;
        };
    }[];
};
export type OpenLibraryAuthor = {
    key: string;
    name: string;
};
export type OpenLibraryEditionCover = {
    coverId: number;
    label: string;
};
type Edition = {
    title?: string;
    covers?: number[];
    publish_date?: string;
    languages?: {
        key?: string;
    }[];
};
type EditionsResponse = {
    entries?: Edition[];
};
const BASIC_FIELDS = [
    "key",
    "title",
    "author_name",
    "author_key",
    "publisher",
    "first_publish_year",
    "cover_i",
    "edition_count",
    "subject",
    "subject_key",
].join(",");
/*
 * Recopilaciones y paquetes de libros.
 *
 * Se ocultan en búsquedas generales.
 * Si se buscan expresamente, sí aparecen.
 */
const COLLECTION_TITLE = /\b(?:box(?:ed)?\s*set|boxset|omnibus|bundle|collection\s+set|complete\s+(?:series|saga|collection|works)|collected\s+(?:works|novels)|(?:books?|volumes?)\s*\d+\s*[-–&]\s*\d+)\b/i;
/*
 * Títulos académicos o educativos.
 *
 * Este filtro se utiliza exclusivamente
 * en tendencias, nunca en la búsqueda general.
 */
const ACADEMIC_TITLE = /\b(?:textbook|workbook|study\s+guide|exam\s+prep|test\s+prep|teacher'?s?\s+(?:guide|manual|edition)|coursebook|grammar\s+workbook|laboratory\s+manual|problem\s+sets?|physics|chemistry|biochemistry|mathematics|calculus|statistics|learn\s+english|english\s+grammar|english\s+language\s+course|learn\s+spanish)\b/i;
const FICTION_KEYS = new Set([
    "fiction",
    "fantasy",
    "fantasy_fiction",
    "science_fiction",
    "romance",
    "romance_fiction",
    "mystery",
    "mystery_and_detective_stories",
    "detective_and_mystery_stories",
    "thrillers",
    "thriller",
    "horror",
    "horror_fiction",
    "young_adult_fiction",
    "historical_fiction",
    "adventure_fiction",
    "literary_fiction",
    "short_stories",
]);
const ACADEMIC_KEYS = /^(?:physics|chemistry|biochemistry|mathematics|calculus|statistics|engineering|computer_science|programming|textbooks?|school_books?|study_guides?|exam_preparation|education|curriculum|medicine|medical_sciences?|biology|dictionaries|encyclopedias|english_language|english_grammar|language_learning|nonfiction|non_fiction)(?:_|$)/;
function normalized(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}
function isWork(book: OpenLibrarySearchBook) {
    return (/^\/works\/OL\d+W$/.test(book.key) &&
        Boolean(book.title?.trim()));
}
/*
 * Si conocemos las dimensiones originales
 * y son demasiado pequeñas, no utilizamos
 * la imagen como portada.
 *
 * Si Open Library no devuelve dimensiones,
 * no suponemos que la imagen sea mala.
 */
function hasCover(book: OpenLibrarySearchBook) {
    if (!Number.isSafeInteger(book.cover_i) ||
        (book.cover_i ?? 0) <= 0) {
        return false;
    }
    if (typeof book.cover_width === "number" &&
        book.cover_width > 0 &&
        book.cover_width < 240) {
        return false;
    }
    if (typeof book.cover_height === "number" &&
        book.cover_height > 0 &&
        book.cover_height < 300) {
        return false;
    }
    return true;
}
/*
 * Elegir la ficha preferida entre dos obras
 * de igual título y autor principal.
 *
 * 1. Portada válida.
 * 2. Primera publicación más antigua.
 * 3. Mayor cantidad de ediciones.
 */
function bestWork(first: OpenLibrarySearchBook, second: OpenLibrarySearchBook) {
    const coverDifference = Number(hasCover(first)) -
        Number(hasCover(second));
    if (coverDifference !== 0) {
        return coverDifference >= 0
            ? first
            : second;
    }
    const aYear = first.first_publish_year;
    const bYear = second.first_publish_year;
    if (typeof aYear === "number" &&
        typeof bYear === "number" &&
        aYear !== bYear) {
        return aYear < bYear ? first : second;
    }
    if (typeof aYear === "number" &&
        typeof bYear !== "number") {
        return first;
    }
    if (typeof bYear === "number" &&
        typeof aYear !== "number") {
        return second;
    }
    return (first.edition_count ?? 0) >=
        (second.edition_count ?? 0)
        ? first
        : second;
}

function dedupeWorks(
  books: OpenLibrarySearchBook[],
): OpenLibrarySearchBook[] {
  const groups = new Map<
    string,
    OpenLibrarySearchBook
  >();

  for (const book of books) {
    if (!isWork(book)) {
      continue;
    }

    const author =
      book.author_name?.[0] ??
      book.author_key?.[0] ??
      "";

    const key =
      `${normalized(book.title)}:` +
      normalized(author);

    const previous = groups.get(key);

    if (!previous) {
      groups.set(key, book);
      continue;
    }

    const preferred = bestWork(
      previous,
      book,
    );

    groups.set(key, {
      ...preferred,

      subject: [
        ...new Set([
          ...(previous.subject ?? []),
          ...(book.subject ?? []),
        ]),
      ],

      subject_key: [
        ...new Set([
          ...(previous.subject_key ?? []),
          ...(book.subject_key ?? []),
        ]),
      ],

      author_key: [
        ...new Set([
          ...(previous.author_key ?? []),
          ...(book.author_key ?? []),
        ]),
      ],

      publisher: [
        ...new Set([
          ...(previous.publisher ?? []),
          ...(book.publisher ?? []),
        ]),
      ],
    });
  }

  return [...groups.values()];
}
function readableBook(book: OpenLibrarySearchBook) {
    return hasCover(book)
        ? book
        : {
            ...book,
            cover_i: undefined,
        };
}
function wantedCollection(query: string) {
    return (COLLECTION_TITLE.test(query) ||
        /\b(?:collection|collected|complete|all\s+books)\b/i.test(query));
}
export function getOpenLibraryCoverUrl(coverId: number | null | undefined, size: "S" | "M" | "L" = "L") {
    if (!Number.isSafeInteger(coverId) ||
        (coverId ?? 0) <= 0) {
        return null;
    }
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
export function getWorkIdFromKey(key: string) {
    return key.replace(/^\/works\//, "");
}
/*
 * BÚSQUEDA GENERAL
 *
 * No bloquea libros científicos ni educativos.
 * Solo mejora la calidad de los resultados.
 */
export async function searchBooks(query: string): Promise<OpenLibrarySearchResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
        return {
            numFound: 0,
            start: 0,
            docs: [],
        };
    }
    const params = new URLSearchParams({
        title: trimmed,
        fields: BASIC_FIELDS,
        limit: "80",
    });
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
        next: {
            revalidate: 3600,
        },
    });
    if (!response.ok) {
        throw new Error("No se pudieron buscar libros en Open Library.");
    }
    const data = (await response.json()) as OpenLibrarySearchResponse;
    const candidates = (data.docs ?? []).filter((book) => wantedCollection(trimmed) ||
        !COLLECTION_TITLE.test(book.title));
    const docs = dedupeWorks(candidates)
        .map(readableBook)
        .slice(0, 40);
    return {
        numFound: docs.length,
        start: 0,
        docs,
    };
}
/*
 * DETALLES DE LIBROS
 */
export async function getBookDetails(workId: string): Promise<OpenLibraryWork> {
    const response = await fetch(`https://openlibrary.org/works/${encodeURIComponent(workId)}.json`, {
        next: {
            revalidate: 86400,
        },
    });
    if (!response.ok) {
        throw new Error("No se pudo cargar el libro desde Open Library.");
    }
    return (await response.json()) as OpenLibraryWork;
}
/*
 * AUTORES
 */
export async function getAuthorDetails(authorKey: string): Promise<OpenLibraryAuthor | null> {
    const key = authorKey.startsWith("/")
        ? authorKey
        : `/${authorKey}`;
    const response = await fetch(`https://openlibrary.org${key}.json`, {
        next: {
            revalidate: 86400,
        },
    });
    return response.ok
        ? ((await response.json()) as OpenLibraryAuthor)
        : null;
}
export function getBookDescription(description: OpenLibraryWork["description"]) {
    return typeof description === "string"
        ? description
        : description?.value ?? null;
}
/*
 * FILTRO DE TENDENCIAS Y POPULARES
 *
 * Solo se admiten obras con categorías
 * narrativas reconocidas.
 *
 * Un libro sin materias clasificadas
 * no entra automáticamente.
 */
function narrativeBook(book: OpenLibrarySearchBook) {
    if (COLLECTION_TITLE.test(book.title) ||
        ACADEMIC_TITLE.test(book.title)) {
        return false;
    }
    const subjects = book.subject_key ?? [];
    if (subjects.length === 0) {
        return false;
    }
    if (subjects.some((subject) => ACADEMIC_KEYS.test(subject.toLowerCase()))) {
        return false;
    }
    return subjects.some((subject) => FICTION_KEYS.has(subject.toLowerCase()));
}
/*
 * TENDENCIAS
 *
 * Conservamos el orden de popularidad de
 * Open Library, pero seleccionamos solo
 * categorías narrativas.
 */
export async function getTrendingBooks(): Promise<OpenLibrarySearchBook[]> {
    const params = new URLSearchParams({
        q: [
            "trending_z_score:{0 TO *]",
            "AND",
            "(subject_key:fiction OR subject_key:fantasy OR subject_key:science_fiction OR subject_key:mystery_and_detective_stories OR subject_key:romance OR subject_key:young_adult_fiction OR subject_key:historical_fiction OR subject_key:horror)",
        ].join(" "),
        sort: "trending",
        fields: `${BASIC_FIELDS},subject_key`,
        limit: "100",
    });
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
        next: {
            revalidate: 21600,
        },
    });
    if (!response.ok) {
        throw new Error("No se pudieron cargar los libros destacados de Open Library.");
    }
    const data = (await response.json()) as OpenLibrarySearchResponse;
    return dedupeWorks((data.docs ?? []).filter((book) => narrativeBook(book) &&
        hasCover(book))).slice(0, 24);
}
/*
 * PORTADAS DE EDICIONES
 *
 * Se utiliza en el administrador para
 * disponer de alternativas a una imagen mala.
 */
export async function getBookEditionCovers(workId: string, workTitle: string): Promise<OpenLibraryEditionCover[]> {
    if (!/^OL\d+W$/.test(workId)) {
        return [];
    }
    const response = await fetch(`https://openlibrary.org/works/${encodeURIComponent(workId)}/editions.json?limit=100`, {
        next: {
            revalidate: 86400,
        },
    });
    if (!response.ok) {
        return [];
    }
    const data = (await response.json()) as EditionsResponse;
    const title = normalized(workTitle);
    const matches: {
        id: number;
        label: string;
        priority: number;
    }[] = [];
    for (const edition of data.entries ?? []) {
        const editionTitle = edition.title?.trim() || workTitle;
        const editionNormalized = normalized(editionTitle);
        const isCollection = COLLECTION_TITLE.test(editionTitle);
        const similarity = editionNormalized === title
            ? 3
            : editionNormalized.startsWith(`${title} `)
                ? 1
                : 0;
        const language = edition.languages?.[0]?.key
            ?.split("/")
            .pop();
        for (const coverId of edition.covers ?? []) {
            if (!Number.isSafeInteger(coverId) ||
                coverId <= 0) {
                continue;
            }
            matches.push({
                id: coverId,
                label: `Edición: ${editionTitle}${edition.publish_date
                    ? ` · ${edition.publish_date}`
                    : ""}${language
                    ? ` · ${language}`
                    : ""}`,
                priority: similarity * 3 +
                    (isCollection ? -10 : 2),
            });
        }
    }
    matches.sort((a, b) => b.priority - a.priority);
    const seen = new Set<number>();
    return matches
        .filter((item) => {
        if (seen.has(item.id)) {
            return false;
        }
        seen.add(item.id);
        return true;
    })
        .slice(0, 40)
        .map((item) => ({
        coverId: item.id,
        label: item.label,
    }));
}
