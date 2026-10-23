"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronRight,
  Library,
  Loader2,
  Search,
  X,
} from "lucide-react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  getMediaKindLabel,
  type MediaKind,
  useMediaSearch,
} from "@/hooks/useMediaSearch";

type DiscoverResult = {
  key: string;
  kind: MediaKind;
  title: string;
  image: string | null;
  imagePositionX: number;
  imagePositionY: number;
  imageZoom: number;
  year: number | null;
  href: string;
};

type ResultRowProps = {
  href: string;
  title: string;
  kind: MediaKind;
  image: string | null;
  year: number | null;
  imagePositionX: number;
  imagePositionY: number;
  imageZoom: number;
  onNavigate: () => void;
};

function ResultRow({
  href,
  title,
  kind,
  image,
  year,
  imagePositionX,
  imagePositionY,
  imageZoom,
  onNavigate,
}: ResultRowProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex min-h-[84px] items-center gap-4 border-b border-zinc-900 px-4 py-3 transition active:bg-zinc-900/80"
    >
      <div className="relative h-[60px] w-10 shrink-0 overflow-hidden rounded-md bg-zinc-900">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="40px"
            unoptimized={
              shouldUseOriginalImage(image)
            }
            className="object-cover"
            style={{
              objectPosition:
                `${imagePositionX}% ${imagePositionY}%`,
              transform:
                `scale(${imageZoom})`,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-700">
            <Library size={15} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-zinc-200">
          {title}
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
          <span>
            {getMediaKindLabel(kind)}
          </span>

          {year != null && (
            <>
              <span>·</span>
              <span>{year}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight
        size={18}
        className="shrink-0 text-zinc-700"
      />
    </Link>
  );
}

function LoadingList() {
  return (
    <div
      aria-label="Buscando contenido"
      role="status"
    >
      {Array.from(
        { length: 8 },
        (_, index) => (
          <div
            key={index}
            className="flex min-h-[84px] items-center gap-4 border-b border-zinc-900 px-4 py-3"
          >
            <div className="h-[60px] w-10 animate-pulse rounded-md bg-zinc-900" />

            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-900" />

              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-zinc-900" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export default function MobileSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef =
    useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    suggestions,
    loading,
    saveRecent,
  } = useMediaSearch({
    enabled: open,
    limit: 24,
  });

  const [
    discoverItems,
    setDiscoverItems,
  ] = useState<DiscoverResult[]>([]);

  const [
    discoverLoading,
    setDiscoverLoading,
  ] = useState(true);

  const [
    discoverLoaded,
    setDiscoverLoaded,
  ] = useState(false);

  const cleanQuery = query.trim();
  const showingResults =
    cleanQuery.length >= 2;

  useEffect(() => {
    if (!open) {
      const timeout = window.setTimeout(
        () => setQuery(""),
        0,
      );

      return () =>
        window.clearTimeout(timeout);
    }

    const frame =
      window.requestAnimationFrame(
        () => inputRef.current?.focus(),
      );

    const before =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const escape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      escape,
    );

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow =
        before;

      document.removeEventListener(
        "keydown",
        escape,
      );
    };
  }, [open, onClose, setQuery]);

  useEffect(() => {
    if (!open || discoverLoaded) return;

    const controller =
      new AbortController();

    const timeout = window.setTimeout(
      () => {
        setDiscoverLoading(true);

        void fetch("/api/mobile-discover", {
          cache: "no-store",
          signal: controller.signal,
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}`,
              );
            }

            const data: {
              results?: unknown;
            } = await response.json();

            return Array.isArray(
              data.results,
            )
              ? (data.results as DiscoverResult[])
              : [];
          })
          .then((items) => {
            if (controller.signal.aborted) {
              return;
            }

            setDiscoverItems(items);
            setDiscoverLoaded(true);
          })
          .catch((error: unknown) => {
            if (!controller.signal.aborted) {
              console.error(
                "Error loading mobile discover:",
                error,
              );
            }
          })
          .finally(() => {
            if (!controller.signal.aborted) {
              setDiscoverLoading(false);
            }
          });
      },
      0,
    );

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, discoverLoaded]);

  function openResult(title: string) {
    saveRecent(title);
    onClose();
  }

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!cleanQuery) return;

    saveRecent(cleanQuery);
    onClose();

    router.push(
      `/search?q=${encodeURIComponent(
        cleanQuery,
      )}`,
    );
  }

  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Buscar"
      className="fixed inset-x-0 top-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-[160] flex flex-col bg-zinc-950 lg:hidden"
    >
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 px-4 pb-4 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
        <form
          onSubmit={submit}
          className="flex items-center gap-3"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={19}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar películas, series, juegos o libros"
              autoComplete="off"
              enterKeyHint="search"
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-11 pr-10 text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500/60 focus:bg-zinc-900"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar búsqueda"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
          >
            <X size={21} />
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!showingResults &&
          (discoverItems.length > 0 ? (
            discoverItems.map((item) => (
              <ResultRow
                key={item.key}
                href={item.href}
                title={item.title}
                kind={item.kind}
                image={item.image}
                year={item.year}
                imagePositionX={
                  item.imagePositionX
                }
                imagePositionY={
                  item.imagePositionY
                }
                imageZoom={item.imageZoom}
                onNavigate={() =>
                  openResult(item.title)
                }
              />
            ))
          ) : discoverLoading ? (
            <LoadingList />
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center px-8 text-center text-sm text-zinc-600">
              No se pudieron cargar resultados.
            </div>
          ))}

        {showingResults &&
          (suggestions.length > 0 ? (
            <>
              {suggestions.map((item) => (
                <ResultRow
                  key={item.key}
                  href={item.href}
                  title={item.title}
                  kind={item.kind}
                  image={item.image}
                  year={item.year}
                  imagePositionX={50}
                  imagePositionY={50}
                  imageZoom={1}
                  onNavigate={() =>
                    openResult(item.title)
                  }
                />
              ))}

              {loading && (
                <div className="flex items-center justify-center gap-2 py-5 text-xs text-zinc-600">
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                  Actualizando resultados
                </div>
              )}
            </>
          ) : loading ? (
            <LoadingList />
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center px-8 text-center text-sm text-zinc-600">
              No encontramos resultados para &quot;
              {cleanQuery}&quot;.
            </div>
          ))}
      </div>
    </section>
  );
}