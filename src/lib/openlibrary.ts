export type OpenLibrarySearchBook = {
  key:
    string;

  title:
    string;

  author_name?:
    string[];

  first_publish_year?:
    number;

  cover_i?:
    number;

  edition_count?:
    number;
};

export type OpenLibrarySearchResponse = {
  numFound:
    number;

  start:
    number;

  docs:
    OpenLibrarySearchBook[];
};

export type OpenLibraryWork = {
  key:
    string;

  title:
    string;

  description?:
    | string
    | {
        type?:
          string;

        value?:
          string;
      };

  covers?:
    number[];

  subjects?:
    string[];

  authors?: {
    author: {
      key:
        string;
    };

    type?: {
      key:
        string;
    };
  }[];
};

export type OpenLibraryAuthor = {
  key:
    string;

  name:
    string;
};

export function getOpenLibraryCoverUrl(
  coverId:
    | number
    | null
    | undefined,

  size:
    | "S"
    | "M"
    | "L" =
      "L"
) {
  if (
    !coverId
  ) {
    return null;
  }

  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function getWorkIdFromKey(
  key:
    string
) {
  return key.replace(
    "/works/",
    ""
  );
}

export async function searchBooks(
  query:
    string
): Promise<OpenLibrarySearchResponse> {
  const trimmed =
    query.trim();

  if (
    !trimmed
  ) {
    return {
      numFound:
        0,

      start:
        0,

      docs:
        [],
    };
  }

  const params =
    new URLSearchParams({
      /*
       * title= en lugar de q=
       * evita coincidencias por
       * materias, descripciones, etc.
       */

      title:
        trimmed,

      fields:
        [
          "key",
          "title",
          "author_name",
          "first_publish_year",
          "cover_i",
          "edition_count",
        ].join(
          ","
        ),

      limit:
        "40",
    });

  const response =
    await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`,
      {
        next: {
          revalidate:
            3600,
        },
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "No se pudieron buscar libros en Open Library."
    );
  }

  return response.json();
}

export async function getBookDetails(
  workId:
    string
): Promise<OpenLibraryWork> {
  const response =
    await fetch(
      `https://openlibrary.org/works/${encodeURIComponent(
        workId
      )}.json`,
      {
        next: {
          revalidate:
            3600,
        },
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "No se pudo cargar el libro desde Open Library."
    );
  }

  return response.json();
}

export async function getAuthorDetails(
  authorKey:
    string
): Promise<
  OpenLibraryAuthor |
  null
> {
  const key =
    authorKey.startsWith(
      "/"
    )
      ? authorKey
      : `/${authorKey}`;

  const response =
    await fetch(
      `https://openlibrary.org${key}.json`,
      {
        next: {
          revalidate:
            86400,
        },
      }
    );

  if (
    !response.ok
  ) {
    return null;
  }

  return response.json();
}

export function getBookDescription(
  description:
    OpenLibraryWork["description"]
) {
  if (
    !description
  ) {
    return null;
  }

  if (
    typeof description ===
    "string"
  ) {
    return description;
  }

  return (
    description.value ??
    null
  );
}

/*
 * DISCOVER / TRENDING BOOKS
 */

export async function getTrendingBooks(): Promise<
  OpenLibrarySearchBook[]
> {
  const params =
    new URLSearchParams({
      q:
        "trending_z_score:{0 TO *]",

      sort:
        "trending",

      fields:
        "key,title,author_name,first_publish_year,cover_i,edition_count",

      limit:
        "24",
    });

  const response =
    await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`,
      {
        next: {
          revalidate:
            3600,
        },
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "No se pudieron cargar los libros destacados de Open Library."
    );
  }

  const data =
    (
      await response.json()
    ) as OpenLibrarySearchResponse;

  return (
    data.docs ??
    []
  ).filter(
    (
      book
    ) =>
      Boolean(
        book.key?.startsWith(
          "/works/"
        ) &&
        book.cover_i
      )
  );
}