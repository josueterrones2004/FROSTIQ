"use client";

import {
  Filter,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

export type MediaFilter =
  | "all"
  | "game"
  | "movie"
  | "series"
  | "book";

export type SortMode =
  | "relevance"
  | "newest"
  | "oldest"
  | "az";

type SearchCounts = {
  all: number;
  game: number;
  movie: number;
  series: number;
  book: number;
};

interface SearchFiltersProps {
  query: string;

  type:
    MediaFilter;

  sort:
    SortMode;

  onlyWithImage:
    boolean;

  counts:
    SearchCounts;
}

export default function SearchFilters({
  query,
  type,
  sort,
  onlyWithImage,
  counts,
}: SearchFiltersProps) {
  const router =
    useRouter();

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    pending,
    startTransition,
  ] =
    useTransition();

  const hasCustomFilters =
    type !==
      "all" ||
    sort !==
      "relevance" ||
    onlyWithImage;

  function navigate({
    type:
      nextType =
        type,

    sort:
      nextSort =
        sort,

    onlyWithImage:
      nextOnlyWithImage =
        onlyWithImage,
  }: {
    type?:
      MediaFilter;

    sort?:
      SortMode;

    onlyWithImage?:
      boolean;
  }) {
    const params =
      new URLSearchParams();

    params.set(
      "q",
      query
    );

    if (
      nextType !==
      "all"
    ) {
      params.set(
        "type",
        nextType
      );
    }

    if (
      nextSort !==
      "relevance"
    ) {
      params.set(
        "sort",
        nextSort
      );
    }

    if (
      nextOnlyWithImage
    ) {
      params.set(
        "image",
        "with"
      );
    }

    setMobileOpen(
      false
    );

    startTransition(
      () => {
        router.push(
          `/search?${params.toString()}`
        );
      }
    );
  }

  function resetFilters() {
    setMobileOpen(
      false
    );

    startTransition(
      () => {
        router.push(
          `/search?q=${encodeURIComponent(
            query
          )}`
        );
      }
    );
  }

  const filterContent = (
    <>
      {/* MEDIA */}

      <FilterGroup title="Mostrar">
        <FilterOption
          active={
            type ===
            "all"
          }
          label="Todos"
          count={
            counts.all
          }
          onClick={() =>
            navigate({
              type:
                "all",
            })
          }
        />

        <FilterOption
          active={
            type ===
            "game"
          }
          label="Juegos"
          count={
            counts.game
          }
          onClick={() =>
            navigate({
              type:
                "game",
            })
          }
        />

        <FilterOption
          active={
            type ===
            "movie"
          }
          label="Películas"
          count={
            counts.movie
          }
          onClick={() =>
            navigate({
              type:
                "movie",
            })
          }
        />

        <FilterOption
          active={
            type ===
            "series"
          }
          label="Series"
          count={
            counts.series
          }
          onClick={() =>
            navigate({
              type:
                "series",
            })
          }
        />

        <FilterOption
          active={
            type ===
            "book"
          }
          label="Libros"
          count={
            counts.book
          }
          onClick={() =>
            navigate({
              type:
                "book",
            })
          }
        />
      </FilterGroup>

      {/* SORT */}

      <div className="mt-7 border-t border-zinc-800 pt-6">
        <FilterGroup title="Ordenar por">
          <FilterOption
            active={
              sort ===
              "relevance"
            }
            label="Relevancia"
            onClick={() =>
              navigate({
                sort:
                  "relevance",
              })
            }
          />

          <FilterOption
            active={
              sort ===
              "newest"
            }
            label="Más recientes"
            onClick={() =>
              navigate({
                sort:
                  "newest",
              })
            }
          />

          <FilterOption
            active={
              sort ===
              "oldest"
            }
            label="Más antiguos"
            onClick={() =>
              navigate({
                sort:
                  "oldest",
              })
            }
          />

          <FilterOption
            active={
              sort ===
              "az"
            }
            label="A–Z"
            onClick={() =>
              navigate({
                sort:
                  "az",
              })
            }
          />
        </FilterGroup>
      </div>

      {/* APPEARANCE */}

      <div className="mt-7 border-t border-zinc-800 pt-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
          Apariencia
        </p>

        <button
          type="button"
          onClick={() =>
            navigate({
              onlyWithImage:
                !onlyWithImage,
            })
          }
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span className="text-sm text-zinc-400">
            Ocultar sin portada
          </span>

          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              onlyWithImage
                ? "bg-fuchsia-500"
                : "bg-zinc-800"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                onlyWithImage
                  ? "left-[18px]"
                  : "left-0.5"
              }`}
            />
          </span>
        </button>
      </div>

      {/* RESET */}

      {hasCustomFilters && (
        <div className="mt-7 border-t border-zinc-800 pt-5">
          <button
            type="button"
            onClick={
              resetFilters
            }
            className="flex items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-300"
          >
            <RotateCcw
              size={14}
            />

            Restablecer filtros
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* DESKTOP */}

      <aside className="hidden lg:block">
        <div className="sticky top-[106px] border-l border-zinc-800 pl-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Filtros
            </p>

            {pending && (
              <Loader2
                size={14}
                className="animate-spin text-fuchsia-400"
              />
            )}
          </div>

          {
            filterContent
          }
        </div>
      </aside>

      {/* MOBILE BUTTON */}

      <button
        type="button"
        onClick={() =>
          setMobileOpen(
            true
          )
        }
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 text-sm font-medium text-zinc-300 shadow-xl backdrop-blur transition hover:border-fuchsia-500/30 hover:text-fuchsia-300 lg:hidden"
      >
        {pending ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <Filter
            size={16}
          />
        )}

        Filtros
      </button>

      {/* MOBILE PANEL */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 px-5 pb-8 pt-5 shadow-2xl">
            {/* HANDLE */}

            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-zinc-800" />

            {/* HEADER */}

            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter
                  size={18}
                  className="text-fuchsia-400"
                />

                <h2 className="font-semibold text-zinc-100">
                  Filtrar resultados
                </h2>

                {pending && (
                  <Loader2
                    size={14}
                    className="animate-spin text-fuchsia-400"
                  />
                )}
              </div>

              <button
                type="button"
                aria-label="Cerrar filtros"
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            {
              filterContent
            }
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
        {
          title
        }
      </p>

      <div className="space-y-0.5">
        {
          children
        }
      </div>
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;

  onClick:
    () => void;

  label: string;

  count?:
    number;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition ${
        active
          ? "text-fuchsia-300"
          : "text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
            active
              ? "border-fuchsia-400"
              : "border-zinc-700"
          }`}
        >
          {active && (
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
          )}
        </span>

        <span>
          {
            label
          }
        </span>
      </div>

      {count !==
        undefined && (
        <span
          className={`text-xs ${
            active
              ? "text-fuchsia-500/70"
              : "text-zinc-700"
          }`}
        >
          {
            count
          }
        </span>
      )}
    </button>
  );
}