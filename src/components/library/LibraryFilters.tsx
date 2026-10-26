"use client";

import {
  Check,
  ListFilter,
  Search,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ALL_TYPES,
  SORTS,
  TYPES,
  VIEWS,
  keyOf,
  matches,
  type CompletedReview,
  type LibraryEntry,
  type LibraryMediaType,
  type Sort,
  type View,
} from "./libraryShared";

function SortMenu({
  value,
  onChange,
}: {
  value: Sort;
  onChange: (sort: Sort) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        outside,
      );

      document.removeEventListener(
        "keydown",
        escape,
      );
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="Ordenar biblioteca"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-9 items-center justify-center rounded-md text-frost-accent transition-colors hover:bg-frost-raised"
      >
        <ListFilter size={18} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Ordenar por"
          className="absolute right-0 z-100 rounded-xl border border-frost-border bg-frost-surface p-1.5 shadow-2xl"
          style={{
            top: "calc(100% + 8px)",
            minWidth: 195,
          }}
        >
          <p className="px-3 py-2 frost-audit-text-10 font-semibold uppercase tracking-widest text-frost-muted">
            Ordenar por
          </p>

          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-frost-raised ${
                option.value === value
                  ? "text-frost-accent"
                  : "text-frost-muted"
              }`}
            >
              {option.label}
              {option.value === value && (
                <Check size={15} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  sort,
  onSort,
}: {
  value: string;
  onChange: (value: string) => void;
  sort: Sort;
  onSort: (sort: Sort) => void;
}) {
  return (
    <div className="flex h-11 items-center rounded-xl border border-frost-border bg-frost-surface px-2">
      <Search
        size={17}
        className="ml-1 mr-2 shrink-0 text-frost-muted"
      />

      <input
        type="search"
        aria-label="Buscar en biblioteca"
        placeholder="Buscar..."
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-frost-text outline-none placeholder:text-frost-muted"
      />

      <SortMenu
        value={sort}
        onChange={onSort}
      />
    </div>
  );
}

export function Filters({
  entries,
  reviews,
  view,
  setView,
  types,
  setTypes,
}: {
  entries: LibraryEntry[];
  reviews: CompletedReview[];
  view: View;
  setView: (view: View) => void;
  types: LibraryMediaType[];
  setTypes: (types: LibraryMediaType[]) => void;
}) {
  const abandoned = new Set(
    entries
      .filter((entry) => entry.status === "DROPPED")
      .map((entry) => entry.key),
  );

  const count = (filter: View) =>
    filter === "COMPLETED"
      ? reviews.filter(
          (review) =>
            types.includes(review.mediaType) &&
            !abandoned.has(
              keyOf(
                review.mediaType,
                review.review.external_id,
              ),
            ),
        ).length
      : entries.filter(
          (entry) =>
            types.includes(entry.mediaType) &&
            matches(entry, filter),
        ).length;

  return (
    <div className="space-y-8">
      <section>
        <h2
          className="mb-3 px-2 frost-audit-text-11 font-semibold uppercase text-frost-muted"
          style={{ letterSpacing: "0.18em" }}
        >
          Colección
        </h2>

        <div className="space-y-1">
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={option.value === view}
              onClick={() => setView(option.value)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                option.value === view
                  ? "bg-frost-active font-medium text-frost-accent"
                  : "text-frost-muted hover:bg-frost-raised hover:text-frost-text"
              }`}
            >
              {option.label}

              <span className="text-xs tabular-nums text-frost-muted">
                {count(option.value)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between px-2">
          <h2
            className="frost-audit-text-11 font-semibold uppercase text-frost-muted"
            style={{ letterSpacing: "0.18em" }}
          >
            Tipos de medio
          </h2>

          <button
            type="button"
            onClick={() => setTypes(ALL_TYPES)}
            className="text-xs text-frost-accent hover:text-frost-accent-hover"
          >
            Todos
          </button>
        </div>

        {TYPES.map((type) => {
          const Icon = type.icon;
          const checked = types.includes(type.value);

          return (
            <label
              key={type.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-frost-muted transition-colors hover:bg-frost-raised hover:text-frost-text"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() =>
                  setTypes(
                    checked
                      ? types.filter(
                          (value) => value !== type.value,
                        )
                      : [...types, type.value],
                  )
                }
              />

              <span
                aria-hidden="true"
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-sm border ${
                  checked
                    ? "border-frost-accent/60 bg-frost-active text-frost-accent"
                    : "border-frost-border bg-frost-raised"
                }`}
              >
                {checked && <Check size={13} />}
              </span>

              <Icon size={16} />
              {type.label}
            </label>
          );
        })}
      </section>
    </div>
  );
}