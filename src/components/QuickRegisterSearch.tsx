
"use client";

import Image from "next/image";
import { Loader2, Search } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

export type RegisterSelection = {
  key: string;
  kind: "movie" | "series" | "game" | "book";
  title: string;
  image: string | null;
  year: number | null;
  href: string;
};

type Suggestion = RegisterSelection & {
  score: number;
  subtitle?: string;
};

type Props = {
  onSelect: (selection: RegisterSelection) => void;
};

const SOURCES = [
  "games",
  "screen",
  "books",
] as const;

const labels: Record<
  RegisterSelection["kind"],
  string
> = {
  movie: "Película",
  series: "Serie",
  game: "Videojuego",
  book: "Libro",
};

export default function QuickRegisterSearch({
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const requestId = useRef(0);

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      return;
    }

    const controller = new AbortController();
    const id = ++requestId.current;

    const timeout = window.setTimeout(async () => {
      try {
        const responses = await Promise.allSettled(
          SOURCES.map(async (source) => {
            const response = await fetch(
              `/api/search-suggestions?q=${encodeURIComponent(normalized)}&source=${source}`,
              {
                signal: controller.signal,
              },
            );

            if (!response.ok) {
              throw new Error(
                `Error buscando en ${source}`,
              );
            }

            const data = (await response.json()) as {
              results?: Suggestion[];
            };

            return Array.isArray(data.results)
              ? data.results
              : [];
          }),
        );

        if (
          controller.signal.aborted ||
          requestId.current !== id
        ) {
          return;
        }

        const successful = responses.filter(
          (
            response,
          ): response is PromiseFulfilledResult<
            Suggestion[]
          > => response.status === "fulfilled",
        );

        if (successful.length === 0) {
          throw new Error(
            "No se pudieron consultar las fuentes.",
          );
        }

        const seen = new Set<string>();

        const suggestions = successful
          .flatMap((response) => response.value)
          .sort((a, b) => b.score - a.score)
          .filter((item) => {
            if (
              !item.key ||
              !item.href ||
              seen.has(item.key)
            ) {
              return false;
            }

            seen.add(item.key);
            return true;
          })
          .slice(0, 12);

        setResults(suggestions);
        setActiveIndex(-1);
        setError(null);
      } catch (reason) {
        if (
          controller.signal.aborted ||
          requestId.current !== id
        ) {
          return;
        }

        console.error(
          "Error buscando obras:",
          reason,
        );

        setResults([]);
        setError(
          "No se pudieron cargar los resultados.",
        );
      } finally {
        if (
          !controller.signal.aborted &&
          requestId.current === id
        ) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function handleChange(value: string) {
    requestId.current += 1;

    setQuery(value);
    setResults([]);
    setError(null);
    setActiveIndex(-1);
    setLoading(value.trim().length >= 2);
  }

  function selectResult(result: Suggestion) {
    onSelect({
      key: result.key,
      kind: result.kind,
      title: result.title,
      image: result.image,
      year: result.year,
      href: result.href,
    });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();

      setActiveIndex(
        (current) => (current + 1) % results.length,
      );

      return;
    }

    if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();

      setActiveIndex(
        (current) =>
          current <= 0
            ? results.length - 1
            : current - 1,
      );

      return;
    }

    if (event.key === "Enter" && results.length) {
      event.preventDefault();

      const selected =
        results[activeIndex] ??
        (results.length === 1 ? results[0] : null);

      if (selected) {
        selectResult(selected);
      }
    }
  }

  const showResults = query.trim().length >= 2;

  return (
    <div className="relative w-[240px] xl:w-[360px] 2xl:w-[440px]">
      <div className="relative">
        {loading ? (
          <Loader2
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin text-violet-300"
          />
        ) : (
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
        )}

        <input
          type="search"
          value={query}
          onChange={(event) =>
            handleChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoFocus
          aria-label="Buscar una obra para registrar"
          aria-controls="register-suggestions"
          placeholder="Registrar una obra..."
          className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-10 pr-4 text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-violet-400/60"
        />
      </div>

      {showResults && (
        <div
          id="register-suggestions"
          className="absolute left-0 right-0 top-[52px] z-[130] max-h-[min(65vh,540px)] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl"
        >
          {error ? (
            <p
              role="alert"
              className="px-3 py-4 text-sm text-red-300"
            >
              {error}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-500">
              {loading
                ? "Buscando obras..."
                : "No hay coincidencias."}
            </p>
          ) : (
            <>
              <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Selecciona una obra para registrar
              </p>

              {results.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() =>
                    setActiveIndex(index)
                  }
                  onClick={() => selectResult(item)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                    activeIndex === index
                      ? "bg-white/[0.07]"
                      : "hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="relative h-[54px] w-9 shrink-0 overflow-hidden rounded bg-zinc-900">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="36px"
                        unoptimized={shouldUseOriginalImage(
                          item.image,
                        )}
                        className="object-cover"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-100">
                      {item.title}
                    </span>

                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {labels[item.kind]}
                      {item.year
                        ? ` · ${item.year}`
                        : ""}
                    </span>
                  </span>
                </button>
              ))}

              {loading && (
                <p className="px-3 py-2 text-xs text-zinc-500">
                  Buscando más resultados...
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
