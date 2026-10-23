"use client";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams, } from "next/navigation";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState, } from "react";
import { Clock, Loader2, Search, X, } from "lucide-react";
import { shouldUseOriginalImage, } from "@/lib/image-optimization";
import { getMediaKindLabel, type MediaSuggestion, useMediaSearch, } from "@/hooks/useMediaSearch";
type Props = {
    className?: string;
    onNavigate?: () => void;
};
export default function GlobalSearch({ className = "", onNavigate, }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const currentQuery = pathname === "/search"
        ? params.get("q") ?? ""
        : "";
    const { query, setQuery, suggestions, loading, recent, saveRecent, removeRecent, } = useMediaSearch({
        initialQuery: currentQuery,
    });
    const [open, setOpen] = useState(false);
    const [navigating, setNavigating] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollToTop = useRef(false);
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setQuery(currentQuery);
            setNavigating(false);
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [currentQuery, pathname, setQuery]);
    useEffect(() => {
        if (!scrollToTop.current)
            return;
        scrollToTop.current = false;
        const frame = window.requestAnimationFrame(() => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "auto",
            });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [pathname, currentQuery]);
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
                setActiveIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);
    function navigate(href: string, value: string) {
        saveRecent(value);
        setQuery(value);
        setOpen(false);
        setActiveIndex(-1);
        setNavigating(true);
        scrollToTop.current = true;
        onNavigate?.();
        router.push(href, {
            scroll: true,
        });
    }
    function fullSearch(value: string) {
        const clean = value.trim();
        if (!clean)
            return;
        navigate(`/search?q=${encodeURIComponent(clean)}`, clean);
    }
    function openSuggestion(item: MediaSuggestion) {
        navigate(item.href, item.title);
    }
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (activeIndex >= 0 &&
            suggestions[activeIndex]) {
            openSuggestion(suggestions[activeIndex]);
            return;
        }
        fullSearch(query);
    }
    function handleKeyboard(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
            return;
        }
        if (!suggestions.length)
            return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % suggestions.length);
        }
        else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => index <= 0
                ? suggestions.length - 1
                : index - 1);
        }
    }
    const showRecent = open &&
        !query.trim() &&
        recent.length > 0;
    const showSuggestions = open &&
        query.trim().length >= 2;
    return (<div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {navigating ? (<Loader2 size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin text-fuchsia-400"/>) : (<Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"/>)}

          <input type="search" value={query} onFocus={() => setOpen(true)} onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setNavigating(false);
            setActiveIndex(-1);
        }} onKeyDown={handleKeyboard} autoComplete="off" placeholder="Buscar títulos..." className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-10 pr-4 text-[15px] text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"/>
        </div>
      </form>

      {(showRecent || showSuggestions) && (<div className="absolute left-0 right-0 top-[52px] z-[80] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {showRecent && (<div className="p-2">
              <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Búsquedas recientes
              </p>

              {recent.map((item) => (<div key={item} className="flex items-center rounded-lg hover:bg-zinc-900">
                  <button type="button" onClick={() => fullSearch(item)} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-300">
                    <Clock size={15} className="shrink-0 text-zinc-600"/>

                    <span className="truncate">
                      {item}
                    </span>
                  </button>

                  <button type="button" onClick={() => removeRecent(item)} aria-label={`Eliminar ${item}`} className="mr-2 rounded-md p-1.5 text-zinc-700 hover:bg-zinc-800 hover:text-zinc-300">
                    <X size={14}/>
                  </button>
                </div>))}
            </div>)}

          {showSuggestions && (<div className="p-2">
              {suggestions.length === 0 ? (<div className="flex items-center gap-2 px-3 py-4 text-sm text-zinc-600">
                  {loading ? (<>
                      <Loader2 size={15} className="animate-spin"/>
                      Buscando...
                    </>) : ("No encontramos coincidencias.")}
                </div>) : (<>
                  {suggestions.map((item, index) => (<button key={item.key} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => openSuggestion(item)} className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${activeIndex === index
                            ? "bg-zinc-900"
                            : "hover:bg-zinc-900"}`}>
                        <div className="relative h-[54px] w-9 shrink-0 overflow-hidden rounded bg-zinc-900">
                          {item.image ? (<Image src={item.image} alt={item.title} fill sizes="36px" unoptimized={shouldUseOriginalImage(item.image)} className="object-cover"/>) : (<div className="flex h-full w-full items-center justify-center text-[8px] text-zinc-700">
                              —
                            </div>)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {item.kind === "book"
                            ? item.subtitle || "Lectura"
                            : getMediaKindLabel(item.kind)}
                            {item.year != null &&
                            ` · ${item.year}`}
                          </p>
                        </div>
                      </button>))}

                  {loading && (<div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700">
                      <Loader2 size={12} className="animate-spin"/>
                      Buscando más resultados...
                    </div>)}

                  <button type="button" onClick={() => fullSearch(query)} className="mt-1 w-full border-t border-zinc-800 px-3 py-3 text-left text-sm font-medium text-fuchsia-400 transition hover:text-fuchsia-300">
                    Ver todos los resultados para “
                    {query.trim()}”
                  </button>
                </>)}
            </div>)}
        </div>)}
    </div>);
}
