"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";

import { getPosterImageConfig } from "@/lib/image-optimization";

import {
  labelOf,
  type LibraryEntry,
} from "../libraryShared";

type Props = {
  item: LibraryEntry;
  onOpen: (item: LibraryEntry) => void;
  showStatus?: boolean;
};

export default function MobileLibraryPoster({
  item,
  onOpen,
  showStatus = true,
}: Props) {
  const posterImage = item.coverUrl
    ? getPosterImageConfig(item.coverUrl)
    : null;

  return (
    <article className="min-w-0">
      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`Gestionar ${item.title}`}
        className="block w-full pb-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost-accent"
      >
        <span className="relative block w-full">
          <span className="relative block aspect-2/3 w-full overflow-hidden rounded-md bg-frost-surface shadow-lg">
            {posterImage ? (
              <Image
                src={posterImage.src}
                alt=""
                fill
                sizes="(max-width: 559px) 30vw, (max-width: 799px) 23vw, 18vw"
                loading="lazy"
                unoptimized={posterImage.unoptimized}
                className="object-cover"
                style={{
                  objectPosition:
                    `${item.posterPositionX ?? 50}% ` +
                    `${item.posterPositionY ?? 50}%`,
                  transform: `scale(${item.posterZoom ?? 1})`,
                }}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-frost-muted">
                <ImageOff
                  size={22}
                  aria-hidden="true"
                />
              </span>
            )}
          </span>

          {/* ETIQUETA DE ESTADO */}

          {showStatus && (
            <span
            className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex min-h-7 -translate-x-1/2 translate-y-1/2 items-center justify-center whitespace-nowrap rounded-lg border border-frost-border bg-frost-raised px-2.5 py-1 font-semibold text-frost-text shadow-lg"
            style={{
              maxWidth: "calc(100% + 8px)",
              fontSize: 10,
            }}
          >
            {labelOf(item)}
          </span>
          )}
        </span>
      </button>
    </article>
  );
}