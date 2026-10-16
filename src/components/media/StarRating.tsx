"use client";

import { Star, X } from "lucide-react";
import { useState } from "react";

type StarRatingProps = {
  value: number | null;
  onChange?: (value: number | null) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
};

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 34,
  showLabel = true,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] =
    useState<number | null>(null);

  const displayValue =
    hoverValue ?? value ?? 0;

  function selectRating(nextValue: number) {
    if (readonly || !onChange) {
      return;
    }

    onChange(nextValue);
  }

  function clearRating() {
    if (readonly || !onChange) {
      return;
    }

    onChange(null);
    setHoverValue(null);
  }

  return (
    <div className="inline-flex flex-col">
      {showLabel && (
        <span className="mb-2 text-sm text-zinc-500">
          {value === null ? "Rate" : "Rated"}
        </span>
      )}

      <div className="flex items-center gap-2">
        {!readonly && value !== null && (
          <button
            type="button"
            onClick={clearRating}
            className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Quitar puntuación"
            title="Quitar puntuación"
          >
            <X size={18} />
          </button>
        )}

        <div
          className="flex items-center"
          onMouseLeave={() =>
            setHoverValue(null)
          }
        >
          {[0, 1, 2, 3, 4].map((index) => {
            const halfValue = index + 0.5;
            const fullValue = index + 1;

            const fillAmount = Math.max(
              0,
              Math.min(
                1,
                displayValue - index
              )
            );

            return (
              <div
                key={index}
                className="relative shrink-0"
                style={{
                  width: size,
                  height: size,
                }}
              >
                {/* ESTRELLA VACÍA */}

                <Star
                  size={size}
                  strokeWidth={0}
                  fill="currentColor"
                  className="absolute inset-0 text-zinc-800"
                />

                {/* RELLENO */}

                <div
                  className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
                  style={{
                    width: `${fillAmount * 100}%`,
                  }}
                >
                  <Star
                    size={size}
                    strokeWidth={0}
                    fill="currentColor"
                    className="text-emerald-400"
                  />
                </div>

                {!readonly && (
                  <>
                    {/* IZQUIERDA = MEDIA ESTRELLA */}

                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 z-20 w-1/2 cursor-pointer"
                      onMouseEnter={() =>
                        setHoverValue(halfValue)
                      }
                      onFocus={() =>
                        setHoverValue(halfValue)
                      }
                      onClick={() =>
                        selectRating(halfValue)
                      }
                      aria-label={`${halfValue} de 5`}
                      title={`${halfValue}/5`}
                    />

                    {/* DERECHA = ESTRELLA COMPLETA */}

                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 z-20 w-1/2 cursor-pointer"
                      onMouseEnter={() =>
                        setHoverValue(fullValue)
                      }
                      onFocus={() =>
                        setHoverValue(fullValue)
                      }
                      onClick={() =>
                        selectRating(fullValue)
                      }
                      aria-label={`${fullValue} de 5`}
                      title={`${fullValue}/5`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}