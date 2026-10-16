import Image from "next/image";
import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import LibraryReviewModalCard, {
  type LibraryReview,
} from "@/components/media/LibraryReviewModalCard";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  getMediaArtworkOverrides,
  type MediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  createClient,
} from "@/lib/supabase/server";

type LibraryBook = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;

  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "DROPPED";
};

type ArtworkProps = {
  coverUrl:
    | string
    | null;

  positionX:
    number;

  positionY:
    number;

  zoom:
    number;
};

function getArtwork(
  original:
    string |
    null,

  override:
    MediaArtworkOverride |
    undefined
): ArtworkProps {
  return {
    coverUrl:
      override
        ?.poster_url ??
      original,

    positionX:
      override
        ?.poster_position_x ??
      50,

    positionY:
      override
        ?.poster_position_y ??
      50,

    zoom:
      override
        ?.poster_zoom ??
      1,
  };
}

export default async function BooksPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth"
    );
  }

  const [
    libraryResult,
    reviewsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "library_items"
        )
        .select(`
          id,
          external_id,
          title,
          cover_url,
          release_year,
          status
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "BOOK"
        )
        .in(
          "status",
          [
            "PENDING",
            "IN_PROGRESS",
            "DROPPED",
          ]
        )
        .order(
          "updated_at",
          {
            ascending:
              false,
          }
        ),

      supabase
        .from(
          "reviews"
        )
        .select(`
          id,
          external_id,
          title,
          cover_url,
          release_year,
          rating,
          liked,
          is_rewatch,
          contains_spoilers,
          consumed_at,
          review_text
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "BOOK"
        )
        .order(
          "consumed_at",
          {
            ascending:
              false,
          }
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        ),
    ]);

  if (
    libraryResult.error ||
    reviewsResult.error
  ) {
    console.error(
      "Error loading books:",
      libraryResult.error,
      reviewsResult.error
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Libros
        </h1>

        <p className="mt-4 text-red-400">
          No se pudieron cargar tus libros.
        </p>
      </main>
    );
  }

  const books =
    (
      libraryResult.data ??
      []
    ) as LibraryBook[];

  const readBooks =
    (
      reviewsResult.data ??
      []
    ) as LibraryReview[];

  const overrides =
    await getMediaArtworkOverrides(
      "book",
      [
        ...books.map(
          (
            book
          ) =>
            book.external_id
        ),

        ...readBooks.map(
          (
            review
          ) =>
            review.external_id
        ),
      ]
    );

  const readBooksWithArtwork =
    readBooks.map(
      (
        review
      ) => {
        const override =
          overrides.get(
            review.external_id
          );

        return {
          ...review,

          cover_url:
            override
              ?.poster_url ??
            review.cover_url,

          cover_position_x:
            override
              ?.poster_position_x ??
            50,

          cover_position_y:
            override
              ?.poster_position_y ??
            50,

          cover_zoom:
            override
              ?.poster_zoom ??
            1,
        };
      }
    );

  const reading =
    books.filter(
      (
        book
      ) =>
        book.status ===
        "IN_PROGRESS"
    );

  const pending =
    books.filter(
      (
        book
      ) =>
        book.status ===
        "PENDING"
    );

  const dropped =
    books.filter(
      (
        book
      ) =>
        book.status ===
        "DROPPED"
    );

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Libros
        </h1>

        <p className="mt-2 text-zinc-400">
          Mis libros leyendo, leídos, pendientes y abandonados
        </p>
      </div>

      <LibrarySection
        title="Leyendo"
        books={
          reading
        }
        overrides={
          overrides
        }
        emptyText="No estás leyendo ningún libro actualmente."
        label="Leyendo"
      />

      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Leídos
        </h2>

        {readBooksWithArtwork.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has marcado ningún libro como leído.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {readBooksWithArtwork.map(
              (
                review
              ) => (
                <LibraryReviewModalCard
                  key={
                    review.id
                  }
                  review={
                    review
                  }
                  mediaType="BOOK"
                />
              )
            )}
          </div>
        )}
      </section>

      <LibrarySection
        title="Pendientes"
        books={
          pending
        }
        overrides={
          overrides
        }
        emptyText="No tienes libros pendientes."
        label="Pendiente"
      />

      <LibrarySection
        title="Abandonados"
        books={
          dropped
        }
        overrides={
          overrides
        }
        emptyText="No tienes libros abandonados."
        label="Abandonado"
      />
    </main>
  );
}

function LibrarySection({
  title,
  books,
  overrides,
  emptyText,
  label,
}: {
  title:
    string;

  books:
    LibraryBook[];

  overrides:
    Map<
      string,
      MediaArtworkOverride
    >;

  emptyText:
    string;

  label:
    string;
}) {
  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold">
        {
          title
        }
      </h2>

      {books.length ===
      0 ? (
        <p className="mt-4 text-zinc-500">
          {
            emptyText
          }
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {books.map(
            (
              book
            ) => (
              <BookLibraryCard
                key={
                  book.id
                }
                book={
                  book
                }
                artwork={
                  getArtwork(
                    book.cover_url,
                    overrides.get(
                      book.external_id
                    )
                  )
                }
                label={
                  label
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function BookLibraryCard({
  book,
  artwork,
  label,
}: {
  book:
    LibraryBook;

  artwork:
    ArtworkProps;

  label:
    string;
}) {
  return (
    <Link
      href={`/books/${book.external_id}`}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition group-hover:border-zinc-400">
        {artwork.coverUrl ? (
          <Image
            src={
              artwork.coverUrl
            }
            alt={
              book.title
            }
            fill
            sizes="250px"
            unoptimized={
              shouldUseOriginalImage(
                artwork.coverUrl
              )
            }
            className="object-cover"
            style={{
              objectPosition:
                `${artwork.positionX}% ${artwork.positionY}%`,

              transform:
                `scale(${artwork.zoom})`,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800 px-4 text-center text-zinc-500">
            Sin imagen
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-zinc-100">
          {
            book.title
          }
        </h3>

        <div className="mt-1 flex gap-2 text-sm text-zinc-500">
          {book.release_year && (
            <>
              <span>
                {
                  book.release_year
                }
              </span>

              <span>
                ·
              </span>
            </>
          )}

          <span>
            {
              label
            }
          </span>
        </div>
      </div>
    </Link>
  );
}