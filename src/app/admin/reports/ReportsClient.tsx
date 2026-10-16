"use client";

import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Loader2,
  Monitor,
  Wrench,
} from "lucide-react";

import Image from "next/image";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import type {
  AdminBugReport,
} from "./page";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

type Filter =
  | "ALL"
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED";

type ReportStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED";

const categoryLabels = {
  BUG:
    "Error",

  UI:
    "Interfaz",

  PERFORMANCE:
    "Rendimiento",

  OTHER:
    "Otro",
};

const statusLabels = {
  OPEN:
    "Abierto",

  IN_PROGRESS:
    "En progreso",

  RESOLVED:
    "Resuelto",
};

export default function ReportsClient({
  initialReports,
}: {
  initialReports:
    AdminBugReport[];
}) {
  const [supabase] =
    useState(() =>
      createClient()
    );

  const [
    reports,
    setReports,
  ] =
    useState(
      initialReports
    );

  const [
    filter,
    setFilter,
  ] =
    useState<Filter>(
      "ALL"
    );

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<
      string |
      null
    >(null);

  const filteredReports =
    useMemo(
      () => {
        if (
          filter ===
          "ALL"
        ) {
          return reports;
        }

        return reports.filter(
          (report) =>
            report.status ===
            filter
        );
      },
      [
        filter,
        reports,
      ]
    );

  const openCount =
    reports.filter(
      (report) =>
        report.status ===
        "OPEN"
    ).length;

  const progressCount =
    reports.filter(
      (report) =>
        report.status ===
        "IN_PROGRESS"
    ).length;

  const resolvedCount =
    reports.filter(
      (report) =>
        report.status ===
        "RESOLVED"
    ).length;

  async function updateStatus(
    reportId:
      string,

    status:
      ReportStatus
  ) {
    if (
      updatingId
    ) {
      return;
    }

    setUpdatingId(
      reportId
    );

    const {
      error,
    } =
      await supabase
        .from(
          "bug_reports"
        )
        .update({
          status,
        })
        .eq(
          "id",
          reportId
        );

    if (
      error
    ) {
      console.error(
        "Error updating bug report:",
        error
      );

      setUpdatingId(
        null
      );

      return;
    }

    setReports(
      (
        current
      ) =>
        current.map(
          (report) =>
            report.id ===
            reportId
              ? {
                  ...report,
                  status,
                }
              : report
        )
    );

    setUpdatingId(
      null
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] pb-16">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Bug
              size={24}
              className="text-fuchsia-400"
            />

            <h1 className="text-3xl font-bold text-zinc-100">
              Reportes
            </h1>
          </div>

          <p className="mt-2 text-zinc-500">
            Problemas enviados por los usuarios durante la pre-alpha.
          </p>
        </div>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>

      {/* SUMMARY */}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={
            CircleDot
          }
          value={
            openCount
          }
          label="Abiertos"
        />

        <SummaryCard
          icon={
            Wrench
          }
          value={
            progressCount
          }
          label="En progreso"
        />

        <SummaryCard
          icon={
            CheckCircle2
          }
          value={
            resolvedCount
          }
          label="Resueltos"
        />
      </div>

      {/* FILTERS */}

      <div className="mt-8 flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        <FilterButton
          active={
            filter ===
            "ALL"
          }
          onClick={() =>
            setFilter(
              "ALL"
            )
          }
        >
          Todos ·{" "}
          {
            reports.length
          }
        </FilterButton>

        <FilterButton
          active={
            filter ===
            "OPEN"
          }
          onClick={() =>
            setFilter(
              "OPEN"
            )
          }
        >
          Abiertos ·{" "}
          {
            openCount
          }
        </FilterButton>

        <FilterButton
          active={
            filter ===
            "IN_PROGRESS"
          }
          onClick={() =>
            setFilter(
              "IN_PROGRESS"
            )
          }
        >
          En progreso ·{" "}
          {
            progressCount
          }
        </FilterButton>

        <FilterButton
          active={
            filter ===
            "RESOLVED"
          }
          onClick={() =>
            setFilter(
              "RESOLVED"
            )
          }
        >
          Resueltos ·{" "}
          {
            resolvedCount
          }
        </FilterButton>
      </div>

      {/* REPORTS */}

      {filteredReports.length ===
      0 ? (
        <div className="py-20 text-center">
          <Bug
            size={32}
            className="mx-auto text-zinc-800"
          />

          <p className="mt-4 text-sm text-zinc-600">
            No hay reportes en esta categoría.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredReports.map(
            (
              report
            ) => (
              <ReportCard
                key={
                  report.id
                }
                report={
                  report
                }
                updating={
                  updatingId ===
                  report.id
                }
                onStatusChange={(
                  status
                ) =>
                  updateStatus(
                    report.id,
                    status
                  )
                }
              />
            )
          )}
        </div>
      )}
    </main>
  );
}

function ReportCard({
  report,
  updating,
  onStatusChange,
}: {
  report:
    AdminBugReport;

  updating:
    boolean;

  onStatusChange: (
    status:
      ReportStatus
  ) => void;
}) {
  const reporterName =
    report.reporter
      ?.display_name ||
    report.reporter
      ?.username ||
    "Usuario";

  const pageLabel =
    getPageLabel(
      report.page_url
    );

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
      {/* TOP */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <ReporterAvatar
            report={
              report
            }
          />

          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-100">
              {
                reporterName
              }
            </p>

            {report.reporter
              ?.username && (
              <p className="mt-0.5 truncate text-xs text-zinc-600">
                @
                {
                  report.reporter
                    .username
                }
              </p>
            )}
          </div>

          <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-500">
            {
              categoryLabels[
                report.category
              ]
            }
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs ${
              report.status ===
              "RESOLVED"
                ? "text-emerald-400"
                : report.status ===
                    "IN_PROGRESS"
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {
              statusLabels[
                report.status
              ]
            }
          </span>

          <time className="text-xs text-zinc-600">
            {formatDate(
              report.created_at
            )}
          </time>
        </div>
      </div>

      {/* DESCRIPTION */}

      <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-zinc-300">
        {
          report.description
        }
      </p>

      {/* PAGE */}

      {report.page_url && (
        <div className="mt-5">
          <a
            href={
              report.page_url
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-fuchsia-400 transition hover:text-fuchsia-300"
          >
            <ExternalLink
              size={15}
            />

            {
              pageLabel
            }
          </a>
        </div>
      )}

      {/* DEVICE */}

      <details className="mt-5 border-t border-zinc-800 pt-4">
        <summary className="cursor-pointer text-sm text-zinc-600 transition hover:text-zinc-400">
          Información técnica
        </summary>

        <div className="mt-4 space-y-2 text-xs leading-5 text-zinc-600">
          {report.viewport_width &&
            report.viewport_height && (
              <p className="flex items-center gap-2">
                <Monitor
                  size={14}
                />

                {
                  report.viewport_width
                }
                ×
                {
                  report.viewport_height
                }
              </p>
            )}

          {report.user_agent && (
            <p className="break-all">
              {
                report.user_agent
              }
            </p>
          )}

          <p className="font-mono text-zinc-700">
            {
              report.id
            }
          </p>
        </div>
      </details>

      {/* STATUS */}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
        <span className="mr-2 text-xs text-zinc-600">
          Estado:
        </span>

        {(
          [
            "OPEN",
            "IN_PROGRESS",
            "RESOLVED",
          ] as ReportStatus[]
        ).map(
          (
            status
          ) => (
            <button
              key={
                status
              }
              type="button"
              disabled={
                updating
              }
              onClick={() =>
                onStatusChange(
                  status
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                report.status ===
                status
                  ? "bg-fuchsia-500/15 text-fuchsia-300"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {
                statusLabels[
                  status
                ]
              }
            </button>
          )
        )}

        {updating && (
          <Loader2
            size={15}
            className="ml-2 animate-spin text-zinc-500"
          />
        )}
      </div>
    </article>
  );
}

function ReporterAvatar({
  report,
}: {
  report:
    AdminBugReport;
}) {
  const name =
    report.reporter
      ?.display_name ||
    report.reporter
      ?.username ||
    "U";

  const avatar =
    report.reporter
      ?.avatar_url;

  if (
    avatar
  ) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
        <Image
          src={
            avatar
          }
          alt={
            name
          }
          fill
          sizes="40px"
          unoptimized={
            shouldUseOriginalImage(
              avatar
            )
          }
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/10 font-semibold text-fuchsia-300">
      {name
        .slice(
          0,
          1
        )
        .toUpperCase()}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  value,
  label,
}: {
  icon:
    React.ComponentType<{
      size?: number;
    }>;

  value:
    number;

  label:
    string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/20 px-5 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
        <Icon
          size={18}
        />
      </div>

      <div>
        <p className="text-xl font-bold text-zinc-100">
          {
            value
          }
        </p>

        <p className="text-xs text-zinc-600">
          {
            label
          }
        </p>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-fuchsia-500/10 text-fuchsia-300"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      }`}
    >
      {
        children
      }
    </button>
  );
}

function getPageLabel(
  value:
    | string
    | null
) {
  if (!value) {
    return "";
  }

  try {
    const url =
      new URL(
        value
      );

    return (
      url.pathname +
      url.search
    );
  } catch {
    return value;
  }
}

function formatDate(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    new Date(
      value
    )
  );
}