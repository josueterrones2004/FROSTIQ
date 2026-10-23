"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";

import { shouldUseOriginalImage } from "@/lib/image-optimization";

import {
  labelOf,
  type LibraryEntry,
} from "../libraryShared";

type Props = {
  item: LibraryEntry;
  onOpen: (item: LibraryEntry) => void;
};

export default function MobileLibraryPoster({
  item,
  onOpen,
}: Props) {
  return (
    <article className="min-w-0">
      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`Gestionar ${item.title}`}
        className="block w-full pb-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      >
        <span className="relative block w-full">
          <span className="relative block aspect-[2/3] w-full overflow-hidden rounded-md bg-[#181b24] shadow-[0_5px_14px_rgba(0,0,0,.22)]">
            {item.coverUrl ? (
              <Image
                src={item.coverUrl}
                alt=""
                fill
                sizes="(max-width: 1023px) 32vw, 140px"
                loading="lazy"
                unoptimized={shouldUseOriginalImage(
                  item.coverUrl,
                )}
                className="object-cover"
                style={{
                  objectPosition:
                    `${item.posterPositionX ?? 50}% ` +
                    `${item.posterPositionY ?? 50}%`,
                  transform: `scale(${item.posterZoom ?? 1})`,
                }}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-zinc-600">
                <ImageOff
                  size={22}
                  aria-hidden="true"
                />
              </span>
            )}
          </span>

          {/* PLACA SOBRE EL BORDE INFERIOR */}

          <span className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex min-h-7 max-w-[calc(100%+8px)] -translate-x-1/2 translate-y-1/2 items-center justify-center whitespace-nowrap rounded-lg border border-white/20 bg-[#2c3446] px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
            {labelOf(item)}
          </span>
        </span>
      </button>
    </article>
  );
}