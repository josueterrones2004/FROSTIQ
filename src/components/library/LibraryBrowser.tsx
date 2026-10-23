"use client";

import { useState } from "react";
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
  type LibraryMediaType,
  type Props,
  type Sort,
  type View,
} from "./libraryShared";

export type {
  LibraryEntry,
  CompletedReview,
  LibraryMediaType,
} from "./libraryShared";

/** Único coordinador de datos, filtros y acciones para la Biblioteca. */
export default function LibraryBrowser({
  entries,
  completedReviews,
}: Props) {
  const router = useRouter();
  const desktop = useDesktopLibrary();
  const [supabase] = useState(() => createClient());

  const [view, setView] = useState<View>("ALL");
  const [types, setTypes] = useState<LibraryMediaType[]>(ALL_TYPES);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("TITLE_ASC");
  const [feedback, setFeedback] = useState<string | null>(null);

  const reviews = useLibraryReviews({
    supabase,
    router,
    setFeedback,
  });

  const status = useLibraryStatus({
    supabase,
    router,
    setFeedback,
  });

  const progress = useLibraryProgress({
    supabase,
    router,
    onCompleted: reviews.openReview,
  });

  const removal = useLibraryRemoveDialog();

  const { reviewMap, recent, filtered, filteredReviews } =
    useLibraryCollection({
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
      void status.changeStatus(item, nextStatus),
    progress: (item) => void progress.openProgress(item),
    remove: removal.requestRemove,
  };

  // Eliminación especial de completados: incluye todas las reviews de esa obra.
  // La operación de Supabase está protegida por el usuario autenticado y RLS.
  async function deleteCompletedEntry(item: import("./libraryShared").LibraryEntry) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const user = auth.user;
    if (authError || !user) {
      return { success: false, error: "Debes iniciar sesión para eliminar esta obra." };
    }

    // Una review puede existir sin una fila activa en library_items.
    // Solo utilizamos el RPC de eliminación normal si esa fila existe.
    const { data: activeRecord, error: lookupError } = await supabase
      .from("library_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_type", item.mediaType)
      .eq("external_id", item.externalId)
      .maybeSingle();

    if (lookupError) {
      return { success: false, error: lookupError.message };
    }

    if (activeRecord) {
      const removed = await removal.removeDirectly(item);
      if (!removed) {
        return { success: false, error: "No se pudo retirar la obra de la biblioteca. No se han borrado sus reviews." };
      }
    }

    const { data: deleted, error } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", user.id)
      .eq("media_type", item.mediaType)
      .eq("external_id", item.externalId)
      .select("id");

    if (error || !deleted?.length) {
      return {
        success: false,
        error: error?.message ?? "No fue posible eliminar las reviews. La obra puede haberse retirado de la colección; puedes volver a intentar la eliminación.",
      };
    }

    router.refresh();
    return { success: true };
  }

  function reset() {
    setView("ALL");
    setTypes(ALL_TYPES);
    setSearch("");
    setSort("TITLE_ASC");
  }

  const busy = status.busyKey !== null || removal.removing;

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

  return (
    <>
      {desktop === null ? (
        <div className="mx-auto w-full max-w-[1650px] min-h-[50vh] pb-20">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Tu biblioteca</h1>
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
          onDeleteCompleted={deleteCompletedEntry}
          onReset={reset}
        />
      )}

      <LibraryModals
        progress={progress}
        reviews={reviews}
        removal={removal}
      />
    </>
  );
}