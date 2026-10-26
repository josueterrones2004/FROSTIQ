"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Eye,
  Play,
  X,
} from "lucide-react";
import type {
  ReactNode,
} from "react";

export interface MediaActionOption {
  value: string;
  label: string;

  icon?: ReactNode;

  destructive?: boolean;
}

interface MediaActionBarProps {
  primaryLabel: string;

  primaryActive?: boolean;

  primaryDisabled?: boolean;

  activeStatus?:
    | string
    | null;

  statusDisabled?: boolean;

  statusOptions?: MediaActionOption[];

  message?:
    | string
    | null;

  onPrimaryAction: () =>
    void |
    Promise<void>;

  onStatusChange?: (
    value: string,
  ) =>
    void |
    Promise<void>;
}

/* =========================================================
   PRIMARY ICON
========================================================= */

function getPrimaryIcon(
  label: string,
) {
  const normalized =
    label.toLowerCase();

  if (
    normalized.includes(
      "vista",
    ) ||
    normalized.includes(
      "rewatch",
    )
  ) {
    return (
      <Eye size={17} />
    );
  }

  if (
    normalized.includes(
      "leído",
    ) ||
    normalized.includes(
      "relectura",
    )
  ) {
    return (
      <BookOpenCheck
        size={17}
      />
    );
  }

  return (
    <CheckCircle2
      size={17}
    />
  );
}

/* =========================================================
   STATUS ICON
========================================================= */

function getStatusIcon(
  option: MediaActionOption,
) {
  if (option.icon) {
    return option.icon;
  }

  const value =
    option.value.toUpperCase();

  if (
    value ===
    "IN_PROGRESS"
  ) {
    return (
      <Play size={14} />
    );
  }

  if (
    value ===
    "PENDING"
  ) {
    return (
      <Clock3
        size={14}
      />
    );
  }

  if (
    value ===
      "DROPPED" ||
    option.destructive
  ) {
    return (
      <X size={14} />
    );
  }

  return null;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function MediaActionBar({
  primaryLabel,

  primaryActive = false,

  primaryDisabled = false,

  activeStatus = null,

  statusDisabled = false,

  statusOptions = [],

  message,

  onPrimaryAction,
  onStatusChange,
}: MediaActionBarProps) {
  return (
    <div className="w-full">
      {/* ==================================================
          PRIMARY

          Mismo lenguaje visual de Películas:
          gran botón Cobalt Ink, ancho completo.
      ================================================== */}

      <button
        type="button"
        disabled={
          primaryDisabled
        }
        onClick={() =>
          void onPrimaryAction()
        }
        className={`
          flex h-12 w-full
          items-center justify-center
          gap-2
          rounded-xl
          border
          px-4
          text-sm font-medium
          transition
          disabled:cursor-not-allowed
          disabled:opacity-50

          ${
            primaryActive
              ? `
                border-frost-accent/35
                bg-frost-accent/20
                text-frost-accent
              `
              : `
                border-frost-accent/20
                bg-frost-accent/15
                text-frost-accent
                hover:border-frost-accent/35
                hover:bg-frost-accent/20
                hover:text-frost-accent
              `
          }
        `}
      >
        {getPrimaryIcon(
          primaryLabel,
        )}

        <span>
          {primaryLabel}
        </span>
      </button>

      {/* ==================================================
          SECONDARY STATES
      ================================================== */}

      {statusOptions.length >
      0 ? (
        <div
          className={`
            mt-2.5 grid gap-2

            ${
              statusOptions.length ===
              1
                ? "grid-cols-1"
                : statusOptions.length ===
                    2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }
          `}
        >
          {statusOptions.map(
            (option) => {
              const active =
                activeStatus ===
                option.value;

              const destructive =
                Boolean(
                  option.destructive,
                );

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  disabled={
                    statusDisabled
                  }
                  onClick={() => {
                    if (
                      !onStatusChange
                    ) {
                      return;
                    }

                    void onStatusChange(
                      option.value,
                    );
                  }}
                  className={`
                    flex h-12 min-w-0
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    px-2
                    text-xs
                    font-medium
                    transition

                    disabled:cursor-not-allowed
                    disabled:opacity-50

                    ${
                      active &&
                      destructive
                        ? `
                          border-red-400/25
                          bg-red-500/10
                          text-red-300
                        `
                        : active
                          ? `
                            border-frost-accent/25
                            bg-frost-accent/10
                            text-frost-accent
                          `
                          : `
                            border-frost-border/40
                            bg-frost-surface/25
                            text-frost-muted
                            hover:border-frost-border/80
                            hover:bg-frost-surface/45
                            hover:text-frost-text
                          `
                    }
                  `}
                >
                  <span
                    className="shrink-0"
                  >
                    {getStatusIcon(
                      option,
                    )}
                  </span>

                  <span className="truncate">
                    {option.label}
                  </span>
                </button>
              );
            },
          )}
        </div>
      ) : null}

      {message ? (
        <p className="mt-2.5 text-xs leading-5 text-frost-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}