"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowDownUp,
  ListFilter,
  Search,
} from "lucide-react";

import {
  ALL_TYPES,
  SORTS,
  countLabel,
  type Actions,
  type CompletedReview,
  type LibraryEntry,
  type LibraryMediaType,
  type Sort,
  type View,
} from "../libraryShared";

import MobileLibraryActionSheet from "./MobileLibraryActionSheet";
import MobileLibraryFilters from "./MobileLibraryFilters";
import MobileLibraryGrid, {
  type MobileSelection,
} from "./MobileLibraryGrid";
import MobileCompletedDeleteDialog from "./MobileCompletedDeleteDialog";

type DeleteResult = {
  success: boolean;
  error?: string;
};

type Props = {
  entries: LibraryEntry[];
  completedReviews: CompletedReview[];
  filtered: LibraryEntry[];
  filteredReviews: CompletedReview[];
  reviewMap: Map<string, CompletedReview>;
  view: View;
  setView: (view: View) => void;
  types: LibraryMediaType[];
  setTypes: (types: LibraryMediaType[]) => void;
  sort: Sort;
  setSort: (sort: Sort) => void;
  search: string;
  setSearch: (search: string) => void;
  actions: Actions;
  feedback: string | null;
  onReset: () => void;
  onDeleteCompleted: (
    item: LibraryEntry,
  ) => Promise<DeleteResult>;
};

export default function MobileLibrary({
  entries,
  completedReviews,
  filtered,
  filteredReviews,
  reviewMap,
  view,
  setView,
  types,
  setTypes,
  sort,
  setSort,
  search,
  setSearch,
  actions,
  feedback,
  onReset,
  onDeleteCompleted,
}: Props) {
  const [selected, setSelected] =
    useState<MobileSelection | null>(null);

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [sortOpen, setSortOpen] =
    useState(false);

  const [deleteItem, setDeleteItem] =
    useState<LibraryEntry | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const sortTrigger =
    useRef<HTMLButtonElement>(null);

  const closeSheet = useCallback(
    () => setSelected(null),
    [],
  );

  const closeFilters = useCallback(
    () => setFiltersOpen(false),
    [],
  );

  useEffect(() => {
    if (!sortOpen) return;

    const triggerButton = sortTrigger.current;

    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSortOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      escape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        escape,
      );

      triggerButton?.focus();
    };
  }, [sortOpen]);

  const count =
    view === "COMPLETED"
      ? filteredReviews.length
      : filtered.length;

  const hasFilters =
    view !== "ALL" ||
    types.length !== ALL_TYPES.length;

  const currentSortLabel =
    SORTS.find(
      (option) => option.value === sort,
    )?.label ?? "Título A–Z";

  async function confirmCompletedDelete() {
    if (!deleteItem || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const result =
        await onDeleteCompleted(deleteItem);

      if (result.success) {
        setDeleteItem(null);
      } else {
        setDeleteError(
          result.error ||
            "No se pudo completar la eliminación.",
        );
      }
    } catch {
      setDeleteError(
        "Ocurrió un error al eliminar la obra y sus reviews.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-275 pb-2 text-frost-text">
      {/* BÚSQUEDA */}

      <div className="relative mb-6">
        <label
          htmlFor="mobile-library-search"
          className="sr-only"
        >
          Buscar en la biblioteca
        </label>

        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-frost-muted"
        />

        <input
          id="mobile-library-search"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Buscar..."
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-frost-border bg-frost-surface pl-11 pr-14 text-sm text-frost-text outline-none placeholder:text-frost-muted focus:border-frost-accent/70"
        />

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Filtrar biblioteca"
          aria-haspopup="dialog"
          className={`absolute top-1/2 right-1.5 flex h-9 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-frost-accent transition-colors focus-visible:outline-2 focus-visible:outline-frost-accent ${
            hasFilters
              ? "bg-frost-active"
              : "active:bg-frost-raised"
          }`}
        >
          <ListFilter
            size={20}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* CONTADOR Y ORDENAMIENTO */}

      <div className="relative mb-5 flex min-h-11 items-center justify-between gap-3 border-b border-frost-border pb-3">
        <h2
          aria-live="polite"
          className="min-w-0 text-base font-semibold text-frost-text"
        >
          {countLabel(count, view, types)}
        </h2>

        <button
          ref={sortTrigger}
          type="button"
          aria-label={`Orden actual: ${currentSortLabel}. Cambiar orden`}
          aria-expanded={sortOpen}
          aria-haspopup="true"
          onClick={() =>
            setSortOpen((current) => !current)
          }
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-1 text-xs font-medium text-frost-accent transition-colors hover:bg-frost-active focus-visible:outline-2 focus-visible:outline-frost-accent"
        >
          <ArrowDownUp
            size={17}
            aria-hidden="true"
            className="shrink-0 text-frost-accent"
          />

          <span className="whitespace-nowrap text-frost-accent">
            {currentSortLabel}
          </span>
        </button>

        {sortOpen && (
          <>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Cerrar ordenamiento"
              className="fixed inset-0 z-160 cursor-default"
              onClick={() => setSortOpen(false)}
            />

            <div
              role="radiogroup"
              aria-label="Ordenar por"
              className="absolute top-full right-0 z-170 w-56 overflow-hidden rounded-xl border border-frost-border bg-frost-surface p-1.5 shadow-2xl"
            >
              {SORTS.map((option) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={sort === option.value}
                  key={option.value}
                  onClick={() => {
                    setSort(option.value);
                    setSortOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm transition-colors ${
                    sort === option.value
                      ? "bg-frost-active font-semibold text-frost-accent"
                      : "text-frost-text hover:bg-frost-raised"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {feedback && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-frost-warning/30 bg-frost-warning/10 px-3 py-2 text-sm text-frost-warning"
        >
          {feedback}
        </p>
      )}

      {/* CUADRÍCULA */}

      <MobileLibraryGrid
        entries={entries}
        filtered={filtered}
        filteredReviews={filteredReviews}
        reviewMap={reviewMap}
        view={view}
        onOpen={setSelected}
        onReset={onReset}
      />

      {/* FILTROS */}

      {filtersOpen && (
        <MobileLibraryFilters
          open={filtersOpen}
          onClose={closeFilters}
          entries={entries}
          reviews={completedReviews}
          view={view}
          setView={setView}
          types={types}
          setTypes={setTypes}
        />
      )}

      {/* MENÚ DE OBRA */}

      {selected && (
        <MobileLibraryActionSheet
          item={selected.item}
          review={selected.review}
          actions={actions}
          onClose={closeSheet}
          onRequestCompletedDelete={(item) => {
            setDeleteError(null);
            setDeleteItem(item);
          }}
        />
      )}

      {/* ELIMINACIÓN DE COMPLETADOS */}

      {deleteItem && (
        <MobileCompletedDeleteDialog
          item={deleteItem}
          busy={deleting}
          error={deleteError}
          onCancel={() => {
            if (!deleting) {
              setDeleteItem(null);
            }
          }}
          onConfirm={() =>
            void confirmCompletedDelete()
          }
        />
      )}
    </section>
  );
}