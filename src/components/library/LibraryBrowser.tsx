"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { Filters, SearchBar } from "./LibraryFilters";
import DesktopLibrary from "./desktop/DesktopLibrary";
import MobileLibrary from "./mobile/MobileLibrary";
import LibraryResults from "./shared/LibraryResults";
import LibraryModals from "./shared/LibraryModals";

import { useLibraryCollection } from "./hooks/useLibraryCollection";
import { useLibraryReviews } from "./hooks/useLibraryReviews";
import { useLibraryStatus } from "./hooks/useLibraryStatus";
import { useLibraryProgress } from "./hooks/useLibraryProgress";
import { useLibraryRemoveDialog } from "./hooks/useLibraryRemoveDialog";
import { useDesktopLibrary } from "./hooks/useDesktopLibrary";

import {
  ALL_TYPES,
  type Actions,
  type LibraryEntry,
  type LibraryMediaType,
  type Props,
  type QuickStatus,
  type Sort,
  type View,
} from "./libraryShared";

export type {
  LibraryEntry,
  CompletedReview,
  LibraryMediaType,
} from "./libraryShared";

const REVIEW_TRANSITION_MS = 360;
const NOTICE_DURATION_MS = 2500;
const NOTICE_EXIT_MS = 280;

type StatusNotice = {
  message: string;
  sequence: number;
  exiting: boolean;
};

/** Único coordinador de datos, filtros y acciones para la Biblioteca. */
export default function LibraryBrowser({
  entries,
  completedReviews,
}: Props) {
  const router = useRouter();
  const desktop = useDesktopLibrary();

  const [supabase] = useState(() =>
    createClient(),
  );

  const [view, setView] =
    useState<View>("ALL");

  const [types, setTypes] =
    useState<LibraryMediaType[]>(ALL_TYPES);

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState<Sort>("TITLE_ASC");

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const [statusNotice, setStatusNotice] =
    useState<StatusNotice | null>(null);

  const noticeSequence = useRef(0);

  function notifyStatus(
    item: LibraryEntry,
    nextStatus: QuickStatus,
  ) {
    let message: string;

    if (nextStatus === "PENDING") {
      message = "Marcado como pendiente";
    } else if (nextStatus === "DROPPED") {
      message = "Marcado como abandonado";
    } else if (item.mediaType === "BOOK") {
      message = "Marcado como leyendo";
    } else if (item.mediaType === "GAME") {
      message = "Marcado como jugando";
    } else {
      message = "Marcado como viendo";
    }

    noticeSequence.current += 1;

    setStatusNotice({
      message,
      sequence: noticeSequence.current,
      exiting: false,
    });
  }

  const reviews = useLibraryReviews({
    supabase,
    router,
    setFeedback,
  });

  const status = useLibraryStatus({
    supabase,
    router,
    setFeedback,
    onStatusSaved: notifyStatus,
  });

  const progress = useLibraryProgress({
    supabase,
    router,
    onCompleted: reviews.openReview,
  });

  const removal = useLibraryRemoveDialog();

  useEffect(() => {
    if (!statusNotice || statusNotice.exiting) {
      return;
    }

    const sequence = statusNotice.sequence;

    const timeout = window.setTimeout(() => {
      setStatusNotice((current) =>
        current?.sequence === sequence
          ? { ...current, exiting: true }
          : current,
      );
    }, NOTICE_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [statusNotice]);

  useEffect(() => {
    if (!statusNotice?.exiting) {
      return;
    }

    const sequence = statusNotice.sequence;

    const timeout = window.setTimeout(() => {
      setStatusNotice((current) =>
        current?.sequence === sequence
          ? null
          : current,
      );
    }, NOTICE_EXIT_MS);

    return () => window.clearTimeout(timeout);
  }, [statusNotice]);

  const {
    reviewMap,
    recent,
    filtered,
    filteredReviews,
  } = useLibraryCollection({
    entries,
    completedReviews,
    view,
    types,
    search,
    sort,
  });

  const actions: Actions = {
    rate: reviews.openReview,
    status: (item, nextStatus) =>
      void status.changeStatus(
        item,
        nextStatus,
      ),
    progress: (item) =>
      void progress.openProgress(item),
    remove: removal.requestRemove,
  };

  // Eliminación especial de completados:
  // incluye todas las reviews de esa obra.
  // La operación de Supabase está protegida
  // por el usuario autenticado y RLS.
  async function deleteCompletedEntry(
    item: LibraryEntry,
  ) {
    const {
      data: auth,
      error: authError,
    } = await supabase.auth.getUser();

    const user = auth.user;

    if (authError || !user) {
      return {
        success: false,
        error:
          "Debes iniciar sesión para eliminar esta obra.",
      };
    }

    // Una review puede existir sin una fila
    // activa en library_items.
    // Solo utilizamos el RPC de eliminación
    // normal si esa fila existe.
    const {
      data: activeRecord,
      error: lookupError,
    } = await supabase
      .from("library_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_type", item.mediaType)
      .eq("external_id", item.externalId)
      .maybeSingle();

    if (lookupError) {
      return {
        success: false,
        error: lookupError.message,
      };
    }

    if (activeRecord) {
      const removed =
        await removal.removeDirectly(item);

      if (!removed) {
        return {
          success: false,
          error:
            "No se pudo retirar la obra de la biblioteca. No se han borrado sus reviews.",
        };
      }
    }

    const {
      data: deleted,
      error,
    } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", user.id)
      .eq("media_type", item.mediaType)
      .eq("external_id", item.externalId)
      .select("id");

    if (error || !deleted?.length) {
      return {
        success: false,
        error:
          error?.message ??
          "No fue posible eliminar las reviews. La obra puede haberse retirado de la colección; puedes volver a intentar la eliminación.",
      };
    }

    router.refresh();

    return {
      success: true,
    };
  }

  function reset() {
    setView("ALL");
    setTypes(ALL_TYPES);
    setSearch("");
    setSort("TITLE_ASC");
  }

  const busy =
    status.busyKey !== null ||
    removal.removing;

  const filters = (
    <Filters
      entries={entries}
      reviews={completedReviews}
      view={view}
      setView={setView}
      types={types}
      setTypes={setTypes}
    />
  );

  const searchBar = (
    <SearchBar
      value={search}
      onChange={setSearch}
      sort={sort}
      onSort={setSort}
    />
  );

  const reviewTransition =
    reviews.reviewTransition;

  const mobileReviewActive =
    desktop === false &&
    reviewTransition !== "idle";

  const mobileLibraryAnimation =
    reviewTransition === "entering"
      ? "frost-library-slide-out"
      : reviewTransition === "exiting-cancel"
        ? "frost-library-slide-back"
        : reviewTransition === "exiting-save"
          ? "frost-library-slide-forward"
          : "none";

  const mobileLibraryTransform =
    reviewTransition === "idle"
      ? "translateX(0)"
      : reviewTransition === "active" ||
          reviewTransition === "entering"
        ? "translateX(-100%)"
        : "translateX(0)";

  return (
    <>
      <style>{`
        @keyframes frost-library-slide-out {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-100%);
          }
        }

        @keyframes frost-library-slide-back {
          from {
            transform: translateX(-100%);
          }

          to {
            transform: translateX(0);
          }
        }

        @keyframes frost-library-slide-forward {
          from {
            transform: translateX(100%);
          }

          to {
            transform: translateX(0);
          }
        }

        @keyframes frost-status-enter {
          from {
            opacity: 0;
            transform: translateY(-120%);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes frost-status-exit {
          from {
            opacity: 1;
            transform: translateY(0);
          }

          to {
            opacity: 0;
            transform: translateY(-120%);
          }
        }

        @keyframes frost-status-buzz {
          0%, 100% {
            transform: translateX(0);
          }

          20%, 60% {
            transform: translateX(-4px);
          }

          40%, 80% {
            transform: translateX(4px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .frost-library-transition,
          .frost-status-notice,
          .frost-status-notice-text {
            animation-duration: 1ms !important;
          }
        }
      `}</style>

      {statusNotice && (
        <div
          role="status"
          aria-live="polite"
          className="frost-status-notice pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
          style={{
            animation: statusNotice.exiting
              ? "frost-status-exit 280ms ease-in both"
              : statusNotice.sequence === 1
                ? "frost-status-enter 280ms ease-out both"
                : undefined,
          }}
        >
          <div className="max-w-sm rounded-xl border border-frost-accent/30 bg-frost-raised px-5 py-3 text-center text-sm font-medium text-frost-text shadow-2xl">
            <span
              key={statusNotice.sequence}
              className="frost-status-notice-text block"
              style={{
                animation:
                  statusNotice.sequence > 1
                    ? "frost-status-buzz 320ms ease-in-out"
                    : undefined,
              }}
            >
              {statusNotice.message}
            </span>
          </div>
        </div>
      )}

      {desktop === null ? (
        <div
          className="mx-auto w-full pb-20"
          style={{
            maxWidth: 1650,
            minHeight: "50vh",
          }}
        >
          <h1 className="text-3xl font-semibold tracking-tight text-frost-text">
            Tu biblioteca
          </h1>
        </div>
      ) : desktop ? (
        <DesktopLibrary
          recent={recent}
          reviews={reviewMap}
          actions={actions}
          busy={busy}
          filters={filters}
          searchBar={searchBar}
        >
          <LibraryResults
            filtered={filtered}
            filteredReviews={filteredReviews}
            reviewMap={reviewMap}
            recentCount={recent.length}
            types={types}
            view={view}
            actions={actions}
            busy={busy}
            feedback={feedback}
            onReset={reset}
          />
        </DesktopLibrary>
      ) : (
        <div
          className="frost-library-transition"
          aria-hidden={
            mobileReviewActive
              ? true
              : undefined
          }
          inert={mobileReviewActive}
          style={{
            transform: mobileLibraryTransform,
            animation:
              mobileLibraryAnimation === "none"
                ? undefined
                : `${mobileLibraryAnimation} ${REVIEW_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
            pointerEvents:
              mobileReviewActive
                ? "none"
                : undefined,
          }}
        >
          <MobileLibrary
            entries={entries}
            completedReviews={completedReviews}
            filtered={filtered}
            filteredReviews={filteredReviews}
            reviewMap={reviewMap}
            view={view}
            setView={setView}
            types={types}
            setTypes={setTypes}
            search={search}
            setSearch={setSearch}
            sort={sort}
            setSort={setSort}
            actions={actions}
            feedback={feedback}
            onDeleteCompleted={
              deleteCompletedEntry
            }
            onReset={reset}
          />
        </div>
      )}

      <LibraryModals
        progress={progress}
        reviews={reviews}
        removal={removal}
      />
    </>
  );
}