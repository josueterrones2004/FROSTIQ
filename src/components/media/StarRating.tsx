"use client";

import { Star } from "lucide-react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useRef,
  useState,
} from "react";

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
  const [preview, setPreview] =
    useState<number | null>(null);

  const dragging = useRef(false);

  const editable =
    !readonly && Boolean(onChange);

  const savedValue = Math.max(
    0,
    Math.min(5, value ?? 0),
  );

  const displayed = editable
    ? (preview ?? savedValue)
    : savedValue;

  function fromPointer(
    event: PointerEvent<HTMLDivElement>,
  ) {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const x = Math.max(
      0,
      Math.min(
        rect.width,
        event.clientX - rect.left,
      ),
    );

    if (x <= 8) return 0;

    return Math.min(
      5,
      Math.ceil(
        ((x - 8) / Math.max(1, rect.width - 8)) * 10,
      ) / 2,
    );
  }

  function commit(next: number) {
    if (editable) {
      onChange?.(next === 0 ? null : next);
    }
  }

  function onStart(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!editable) return;

    event.preventDefault();

    dragging.current = true;

    try {
      event.currentTarget.setPointerCapture(
        event.pointerId,
      );
    } catch {
      // El gesto continúa sin captura explícita.
    }

    const next = fromPointer(event);

    setPreview(next);
    commit(next);
  }

  function onMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!editable) return;

    if (
      !dragging.current &&
      event.pointerType !== "mouse"
    ) {
      return;
    }

    const next = fromPointer(event);

    setPreview(next);

    if (dragging.current) {
      commit(next);
    }
  }

  function onEnd(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!editable || !dragging.current) {
      return;
    }

    commit(fromPointer(event));

    dragging.current = false;
    setPreview(null);
  }

  function onKey(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (!editable) return;

    let next: number | undefined;

    if (
      ["ArrowRight", "ArrowUp"].includes(event.key)
    ) {
      next = Math.min(
        5,
        savedValue + 0.5,
      );
    }

    if (
      ["ArrowLeft", "ArrowDown"].includes(event.key)
    ) {
      next = Math.max(
        0,
        savedValue - 0.5,
      );
    }

    if (event.key === "Home") {
      next = 0;
    }

    if (event.key === "End") {
      next = 5;
    }

    if (next !== undefined) {
      event.preventDefault();
      commit(next);
      setPreview(null);
    }
  }

  if (readonly && savedValue === 0) {
    return null;
  }

  return (
    <div className="inline-flex flex-col">
      {showLabel && (
        <span className="mb-2 text-sm text-frost-muted">
          {savedValue ? "Rated" : "Rate"}
        </span>
      )}

      <div
        role={editable ? "slider" : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={
          editable ? "Tu puntuación" : undefined
        }
        aria-valuemin={editable ? 0 : undefined}
        aria-valuemax={editable ? 5 : undefined}
        aria-valuenow={
          editable ? savedValue : undefined
        }
        aria-valuetext={
          editable
            ? `${savedValue} de 5 estrellas`
            : undefined
        }
        onPointerDown={onStart}
        onPointerMove={onMove}
        onPointerUp={onEnd}
        onPointerCancel={() => {
          dragging.current = false;
          setPreview(null);
        }}
        onLostPointerCapture={() => {
          dragging.current = false;
          setPreview(null);
        }}
        onPointerLeave={() => {
          if (!dragging.current) {
            setPreview(null);
          }
        }}
        onKeyDown={onKey}
        className={`inline-flex select-none items-center rounded outline-none ${
          editable
            ? "cursor-pointer touch-none focus-visible:ring-2 focus-visible:ring-frost-accent"
            : ""
        }`}
        style={{
          width: size * 5,
          height: size,
        }}
      >
        {Array.from(
          { length: 5 },
          (_, index) => {
            const filled = Math.max(
              0,
              Math.min(
                1,
                displayed - index,
              ),
            );

            return (
              <div
                key={index}
                className="relative shrink-0"
                style={{
                  width: size,
                  height: size,
                }}
                aria-hidden="true"
              >
                <Star
                  size={size}
                  strokeWidth={0}
                  fill="currentColor"
                  className="absolute inset-0 text-frost-raised"
                />

                <div
                  className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden transition-all duration-75"
                  style={{
                    width: `${filled * 100}%`,
                  }}
                >
                  <Star
                    size={size}
                    strokeWidth={0}
                    fill="currentColor"
                    className="text-emerald-400"
                  />
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}