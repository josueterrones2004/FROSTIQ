"use client";

import {
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { useRouter } from "next/navigation";
import type { createClient } from "@/lib/supabase/client";

import type {
  LibraryEntry,
  QuickStatus,
} from "../libraryShared";

type Supabase = ReturnType<typeof createClient>;

type Router = Pick<
  ReturnType<typeof useRouter>,
  "refresh"
>;

type Options = {
  supabase: Supabase;
  router: Router;
  setFeedback: Dispatch<
    SetStateAction<string | null>
  >;
  onStatusSaved?: (
    item: LibraryEntry,
    status: QuickStatus,
  ) => void;
};

export function useLibraryStatus({
  supabase,
  router,
  setFeedback,
  onStatusSaved,
}: Options) {
  const [busyKey, setBusyKey] =
    useState<string | null>(null);

  async function changeStatus(
    item: LibraryEntry,
    requested: QuickStatus,
  ) {
    if (busyKey !== null) return;

    setBusyKey(item.key);
    setFeedback(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Debes iniciar sesión para cambiar el estado.",
        );
      }

      const status: QuickStatus =
        requested === "IN_PROGRESS" &&
        item.mediaType === "MOVIE"
          ? "PENDING"
          : requested;

      const { error } = await supabase
        .from("library_items")
        .upsert(
          {
            user_id: user.id,
            media_type: item.mediaType,
            external_id: item.externalId,
            title: item.title,
            original_title: null,
            cover_url: item.coverUrl,
            backdrop_url: item.backdropUrl ?? null,
            release_year: item.releaseYear,
            status,
          },
          {
            onConflict:
              "user_id,media_type,external_id",
          },
        );

      if (error) throw error;

      onStatusSaved?.(item, status);

      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  return {
    busyKey,
    changeStatus,
  };
}