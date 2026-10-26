"use client";

import { useCallback, useState } from "react";
import type { LibraryEntry } from "../libraryShared";
import { useLibraryRemove } from "./useLibraryRemove";

export function useLibraryRemoveDialog() {
  const [item, setItem] = useState<LibraryEntry | null>(null);
  const { removing, error, removeItem, clearError } = useLibraryRemove();

  const requestRemove = useCallback((entry: LibraryEntry) => {
    clearError();
    setItem(entry);
  }, [clearError]);

  const cancelRemove = useCallback(() => {
    if (removing) return;
    clearError();
    setItem(null);
  }, [removing, clearError]);

  async function confirmRemove() {
    if (!item || removing) return;
    const success = await removeItem(item);
    if (success) setItem(null);
  }

  return {
    item, removing, error,
    requestRemove, cancelRemove, confirmRemove,
    // Misma operación segura existente sin abrir otro diálogo.
    removeDirectly: removeItem,
  };
}