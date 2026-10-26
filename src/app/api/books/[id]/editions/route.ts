import { NextResponse } from "next/server";

type SearchResponse = {
  docs?: {
    key?: string;
    title?: string;
    number_of_pages_median?: number;
  }[];
};

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: Context,
) {
  const { id } = await params;

  if (!/^OL\d+W$/.test(id)) {
    return NextResponse.json(
      { error: "ID de libro inválido." },
      { status: 400 },
    );
  }

  try {
    const params = new URLSearchParams({
      q: `key:/works/${id}`,
      fields: "key,title,number_of_pages_median",
      limit: "1",
    });

    const response = await fetch(
      `https://openlibrary.org/search.json?${params}`,
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 86400,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Open Library respondió con HTTP ${response.status}.`,
        },
        { status: 502 },
      );
    }

    const data =
      (await response.json()) as SearchResponse;

    const book = data.docs?.find(
      (item) =>
        item.key === `/works/${id}` ||
        item.key === id,
    );

    const pages = book?.number_of_pages_median;

    if (
      typeof pages !== "number" ||
      !Number.isFinite(pages) ||
      pages <= 0
    ) {
      return NextResponse.json({
        editions: [],
      });
    }

    const totalPages = Math.round(pages);

    return NextResponse.json({
      editions: [
        {
          id,
          title: "Páginas de referencia",
          pageCount: totalPages,
          language: null,
          published: null,
        },
      ],
    });
  } catch (error) {
    console.error(
      "Error consulting book pages:",
      error,
    );

    return NextResponse.json(
      {
        error: "No se pudo consultar el número de páginas.",
      },
      { status: 502 },
    );
  }
}