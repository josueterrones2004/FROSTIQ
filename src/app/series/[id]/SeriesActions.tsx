"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  persistMediaReview,
} from "@/components/RegisterReviewModal";
import LibraryReviewModalCard, {
  type ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";
import SeriesActionBar from "@/components/series/SeriesActionBar";
import { createClient } from "@/lib/supabase/client";

interface SeriesActionsProps {
  show: {
    id: number;
    name: string;
    original_name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    first_air_date?: string;
  };
}

type SeriesStatus = "PENDING" | "IN_PROGRESS";

export default function SeriesActions({
  show,
}: SeriesActionsProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [status, setStatus] =
    useState<SeriesStatus | null>(null);
  const [hasWatchedBefore, setHasWatchedBefore] =
    useState(false);
  const [showReview, setShowReview] =
    useState(false);
  const [isRewatch, setIsRewatch] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] = useState("");

  const externalId = String(show.id);

  const poster = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : null;

  const backdrop = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : null;

  const year = show.first_air_date
    ? Number(show.first_air_date.slice(0, 4))
    : null;

  // Cargar estado activo y completados anteriores.
  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const [libraryResult, reviewResult] =
          await Promise.all([
            supabase
              .from("library_items")
              .select("status")
              .eq("user_id", user.id)
              .eq("media_type", "SERIES")
              .eq("external_id", externalId)
              .maybeSingle(),

            supabase
              .from("reviews")
              .select("id")
              .eq("user_id", user.id)
              .eq("media_type", "SERIES")
              .eq("external_id", externalId)
              .limit(1),
          ]);

        if (libraryResult.error) {
          console.error(
            "Error loading series status:",
            libraryResult.error,
          );
        }

        if (reviewResult.error) {
          console.error(
            "Error loading series reviews:",
            reviewResult.error,
          );
        }

        if (cancelled) return;

        const loadedStatus =
          libraryResult.data?.status;

        setStatus(
          loadedStatus === "PENDING" ||
          loadedStatus === "IN_PROGRESS"
            ? loadedStatus
            : null,
        );

        setHasWatchedBefore(
          Boolean(reviewResult.data?.length),
        );
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [externalId, supabase]);

  function getSeriesData(userId: string) {
    return {
      user_id: userId,
      media_type: "SERIES",
      external_id: externalId,
      title: show.name,
      original_title: show.original_name ?? null,
      cover_url: poster,
      backdrop_url: backdrop,
      release_year: year,
    };
  }

  // El pendiente anterior deja de estar activo,
  // sin borrar eventos STARTED del historial.
  async function clearPendingActivity(userId: string) {
    const { error } = await supabase
      .from("activity_events")
      .delete()
      .eq("user_id", userId)
      .eq("media_type", "SERIES")
      .eq("external_id", externalId)
      .eq("activity_type", "ADDED_PENDING");

    if (error) {
      console.error(
        "Error clearing series pending activity:",
        error,
      );
    }
  }

  async function createLibraryActivity(
    userId: string,
    activityType: "STARTED" | "ADDED_PENDING",
  ) {
    const { error } = await supabase
      .from("activity_events")
      .insert({
        user_id: userId,
        activity_type: activityType,
        media_type: "SERIES",
        external_id: externalId,
        title: show.name,
        cover_url: poster,
      });

    if (error) {
      console.error(
        "Error creating series activity:",
        error,
      );
    }
  }

  async function setLibraryStatus(
    newStatus: SeriesStatus,
  ) {
    if (loading || newStatus === status) return;

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      const { error } = await supabase
        .from("library_items")
        .upsert(
          {
            ...getSeriesData(user.id),
            status: newStatus,
          },
          {
            onConflict:
              "user_id,media_type,external_id",
          },
        );

      if (error) {
        setMessage(error.message);
        return;
      }

      await clearPendingActivity(user.id);

      await createLibraryActivity(
        user.id,
        newStatus === "IN_PROGRESS"
          ? "STARTED"
          : "ADDED_PENDING",
      );

      setStatus(newStatus);

      setMessage(
        newStatus === "IN_PROGRESS"
          ? hasWatchedBefore
            ? "Serie marcada como viendo de nuevo."
            : "Serie marcada como viendo."
          : "Serie añadida a pendientes.",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error changing series status:",
        error,
      );
      setMessage(
        "No se pudo actualizar la serie.",
      );
    } finally {
      setLoading(false);
    }
  }

  const openWatchedModal = useCallback(async () => {
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("media_type", "SERIES")
        .eq("external_id", externalId)
        .limit(1);

      if (error) {
        console.error(
          "Error checking series reviews:",
          error,
        );
        setMessage(
          "No se pudo consultar el historial.",
        );
        return;
      }

      setIsRewatch(Boolean(data?.length));
      setShowReview(true);
    } catch (error) {
      console.error(
        "Error opening series review:",
        error,
      );
      setMessage(
        "No se pudo abrir la review.",
      );
    }
  }, [externalId, supabase]);

  // Mantener la integración con el seguimiento
  // de episodios y temporadas.
  useEffect(() => {
    function handleSeriesCompleted(event: Event) {
      const customEvent = event as CustomEvent<{
        seriesId: number;
      }>;

      if (
        customEvent.detail?.seriesId !== show.id
      ) {
        return;
      }

      void openWatchedModal();
    }

    window.addEventListener(
      "series-completed",
      handleSeriesCompleted,
    );

    return () => {
      window.removeEventListener(
        "series-completed",
        handleSeriesCompleted,
      );
    };
  }, [show.id, openWatchedModal]);

  function closeReview() {
    if (loading) return;

    setShowReview(false);
    setMessage("");
  }

  async function saveReview(draft: ReviewDraft) {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      const data = getSeriesData(user.id);

      const result = await persistMediaReview({
        supabase,
        userId: user.id,
        mediaType: "SERIES",
        externalId,
        title: show.name,
        coverUrl: data.cover_url,
        backdropUrl: data.backdrop_url,
        releaseYear: data.release_year,
        draft,
      });

      // La finalización cierra Viendo/Pendiente.
      // Una nueva visualización puede volver
      // a establecer IN_PROGRESS.
      if (result.statusCleared) {
        setStatus(null);
      }

      setHasWatchedBefore(true);
      setShowReview(false);

      setMessage(
        result.warning ??
          (draft.isRepeat
            ? "Rewatch de la serie guardado."
            : "Serie marcada como vista."),
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error saving series review:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la review.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6">
        <SeriesActionBar
          primaryLabel={
            hasWatchedBefore
              ? "Registrar rewatch"
              : "Marcar como vista"
          }
          onPrimaryAction={openWatchedModal}
          primaryDisabled={loading}
          activeStatus={status}
          statusDisabled={loading}
          onStatusChange={setLibraryStatus}
          message={message}
        />
      </div>

      <LibraryReviewModalCard
        mode="create"
        open={showReview}
        mediaType="SERIES"
        title={show.name}
        releaseYear={year}
        coverUrl={poster}
        initialRepeat={isRewatch}
        loading={loading}
        message={message}
        onClose={closeReview}
        onSave={saveReview}
      />
    </>
  );
}