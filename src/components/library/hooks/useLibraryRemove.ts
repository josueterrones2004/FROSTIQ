"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import type { LibraryEntry } from "../libraryShared";

export function useLibraryRemove() {
  const router = useRouter();

  const [supabase] = useState(
    () => createClient(),
  );

  const [removing, setRemoving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const removingRef = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const removeItem = async (
    item: LibraryEntry,
  ): Promise<boolean> => {
    if (removingRef.current) {
      return false;
    }

    removingRef.current = true;
    setRemoving(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Debes iniciar sesión para eliminar una obra.",
        );
      }

      // Una sola operación transaccional:
      // - Elimina la entrada.
      // - Limpia el progreso relacionado.
      // - Conserva las reviews.
      // - Registra la exclusión de Biblioteca.

      const { error: removeError } =
        await supabase.rpc(
          "remove_library_entry",
          {
            p_media_type: item.mediaType,
            p_external_id: item.externalId,
          },
        );

      if (removeError) {
        throw new Error(removeError.message);
      }

      router.refresh();

      return true;
    } catch (caught) {
      console.error(
        "Error removing library item:",
        caught,
      );

      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo eliminar la obra de la biblioteca.",
      );

      return false;
    } finally {
      removingRef.current = false;
      setRemoving(false);
    }
  };

  return {
    removing,
    error,
    removeItem,
    clearError,
  };
}