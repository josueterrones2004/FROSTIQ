"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LibraryReviewModalCard, {
  type MediaType,
  type ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";
import type { RegisterSelection } from "@/components/QuickRegisterSearch";
import { createClient } from "@/lib/supabase/client";

type BrowserClient = ReturnType<typeof createClient>;

type MediaReviewInput = {
  supabase: BrowserClient;
  userId: string;
  mediaType: MediaType;
  externalId: string;
  title: string;
  coverUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  draft: ReviewDraft;
};

export type PersistMediaReviewResult = {
  warning: string | null;
  statusCleared: boolean;
};

const mediaTypes: Record<
  RegisterSelection["kind"],
  MediaType
> = {
  movie: "MOVIE",
  series: "SERIES",
  game: "GAME",
  book: "BOOK",
};

const mediaPrefixes: Record<
  RegisterSelection["kind"],
  string
> = {
  movie: "movies",
  series: "series",
  game: "games",
  book: "books",
};

function getLocalToday() {
  const now = new Date();

  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 10);
}

function getExperience(
  mediaType: MediaType,
  repeat: boolean,
) {
  if (!repeat) return "FIRST_TIME";

  if (mediaType === "GAME") return "REPLAY";
  if (mediaType === "BOOK") return "REREAD";

  return "REWATCH";
}

/**
 * Registra una finalización.
 *
 * - Inserta una review nueva.
 * - Nunca sobrescribe reviews anteriores.
 * - Registra el evento REVIEWED.
 * - Cierra el estado activo en library_items.
 * - Conserva los eventos históricos STARTED.
 *
 * Las obras completadas siguen formando parte de
 * Biblioteca porque esta consulta también reviews.
 */
export async function persistMediaReview({
  supabase,
  userId,
  mediaType,
  externalId,
  title,
  coverUrl,
  backdropUrl,
  releaseYear,
  draft,
}: MediaReviewInput): Promise<PersistMediaReviewResult> {
  const { data: review, error: reviewError } =
    await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        media_type: mediaType,
        external_id: externalId,
        title,
        review_text: draft.reviewText.trim() || null,
        rating: draft.rating,
        liked: draft.liked,
        is_rewatch: draft.isRepeat,
        contains_spoilers: draft.containsSpoilers,
        show_consumed_date: draft.showConsumedDate,
        experience: getExperience(
          mediaType,
          draft.isRepeat,
        ),
        consumed_at: getLocalToday(),
        cover_url: coverUrl,
        backdrop_url: backdropUrl,
        release_year: releaseYear,
      })
      .select("id")
      .single();

  if (reviewError) {
    throw reviewError;
  }

  const warnings: string[] = [];

  // La actividad se asocia a esta review concreta.
  const { error: activityError } = await supabase
    .from("activity_events")
    .insert({
      user_id: userId,
      activity_type: "REVIEWED",
      media_type: mediaType,
      external_id: externalId,
      title,
      cover_url: coverUrl,
      review_id: review.id,
    });

  if (activityError) {
    console.error(
      "Error creating review activity:",
      activityError,
    );
    warnings.push("registrar la actividad");
  }

  /*
   * COMPLETAR CIERRA EL ESTADO ACTIVO.
   *
   * PENDING      -> sin estado activo
   * IN_PROGRESS  -> sin estado activo
   * DROPPED      -> sin estado activo
   *
   * Ninguna review anterior se borra.
   *
   * Al volver a empezar, las Actions crearán
   * un nuevo estado IN_PROGRESS. Entonces la
   * obra estará en En progreso y Completados.
   */
  const { error: deleteError } = await supabase
    .from("library_items")
    .delete()
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("external_id", externalId);

  const statusCleared = !deleteError;

  if (deleteError) {
    console.error(
      "Error completing active library status:",
      deleteError,
    );
    warnings.push("finalizar el estado activo");
  }

  // No eliminamos los eventos STARTED ni REVIEWED.
  // Tampoco eliminamos reviews anteriores.

  return {
    statusCleared,
    warning:
      warnings.length > 0
        ? `La review se guardó, pero hubo un problema al ${warnings.join(" y ")}.`
        : null,
  };
}

type Props = {
  selection: RegisterSelection;
  onClose: () => void;
  onComplete: (message: string) => void;
};

export default function RegisterReviewModal({
  selection,
  onClose,
  onComplete,
}: Props) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [checking, setChecking] = useState(true);
  const [previouslyReviewed, setPreviouslyReviewed] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] =
    useState<string | null>(null);

  const mediaType = mediaTypes[selection.kind];
  const expectedPrefix =
    mediaPrefixes[selection.kind];

  const parts = selection.href
    .split("/")
    .filter(Boolean);

  const externalId =
    parts.length === 2 &&
    parts[0] === expectedPrefix
      ? parts[1]
      : "";

  const coverUrl =
    selection.image?.replace(
      "/t/p/w185/",
      "/t/p/w500/",
    ) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function checkPreviousReviews() {
      try {
        if (!externalId) {
          throw new Error(
            "La obra seleccionada no es válida.",
          );
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("Debes iniciar sesión.");
        }

        const { data, error: reviewError } =
          await supabase
            .from("reviews")
            .select("id")
            .eq("user_id", user.id)
            .eq("media_type", mediaType)
            .eq("external_id", externalId)
            .limit(1);

        if (reviewError) {
          throw reviewError;
        }

        if (!cancelled) {
          setPreviouslyReviewed(
            Boolean(data?.length),
          );
        }
      } catch (reason) {
        console.error(
          "Error checking previous reviews:",
          reason,
        );

        if (!cancelled) {
          setInitError(
            "No se pudo consultar el historial de esta obra.",
          );
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void checkPreviousReviews();

    return () => {
      cancelled = true;
    };
  }, [externalId, mediaType, supabase]);

  async function saveReview(draft: ReviewDraft) {
    if (loading || !externalId) return;

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Debes iniciar sesión.");
      }

      const { data: libraryItem, error: lookupError } =
        await supabase
          .from("library_items")
          .select(
            "cover_url, backdrop_url, release_year",
          )
          .eq("user_id", user.id)
          .eq("media_type", mediaType)
          .eq("external_id", externalId)
          .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      const result = await persistMediaReview({
        supabase,
        userId: user.id,
        mediaType,
        externalId,
        title: selection.title,
        coverUrl:
          libraryItem?.cover_url ?? coverUrl,
        backdropUrl:
          libraryItem?.backdrop_url ?? null,
        releaseYear:
          mediaType === "BOOK"
            ? null
            : (libraryItem?.release_year ??
              selection.year),
        draft,
      });

      onComplete(
        result.warning ??
          "Obra completada y review guardada.",
      );

      onClose();
      router.refresh();
    } catch (reason) {
      console.error(
        "Error registering media review:",
        reason,
      );

      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar la review.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking || initError) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/80 p-5"
        style={{ zIndex: 300 }}
        role="dialog"
        aria-modal="true"
        aria-label="Preparando review"
      >
        <div className="w-full max-w-sm rounded-2xl border border-frost-border bg-frost-bg p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-frost-text">
              {checking
                ? "Preparando review..."
                : "No se pudo abrir la review"}
            </p>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-2 text-frost-muted hover:text-frost-text"
            >
              <X size={18} />
            </button>
          </div>

          {checking ? (
            <Loader2
              size={22}
              className="mt-4 animate-spin text-frost-accent"
            />
          ) : (
            <p className="mt-4 text-sm text-red-300">
              {initError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <LibraryReviewModalCard
      mode="create"
      open
      mediaType={mediaType}
      title={selection.title}
      releaseYear={selection.year}
      coverUrl={coverUrl}
      initialRepeat={previouslyReviewed}
      loading={loading}
      message={error}
      onClose={() => {
        if (!loading) onClose();
      }}
      onSave={saveReview}
    />
  );
}