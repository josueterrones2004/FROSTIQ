
"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

function getToday() {
  const now = new Date();

  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 10);
}

export default function SeriesActions({
  show,
}: SeriesActionsProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [status, setStatus] = useState<SeriesStatus | null>(null);

  const [hasWatchedBefore, setHasWatchedBefore] = useState(false);

  const [showReview, setShowReview] = useState(false);

  const [isRewatch, setIsRewatch] = useState(false);

  const [loading, setLoading] = useState(false);

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

  /*
   * CARGAR ESTADO ACTUAL
   */

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) {
          return;
        }

        const [libraryResult, reviewResult] = await Promise.all([
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
            "Error loading series state:",
            libraryResult.error,
          );
        }

        if (reviewResult.error) {
          console.error(
            "Error loading series reviews:",
            reviewResult.error,
          );
        }

        if (cancelled) {
          return;
        }

        const loadedStatus = libraryResult.data?.status;

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

  /*
   * DATOS DE LA SERIE
   */

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

  /*
   * BORRAR ACTIVIDAD TEMPORAL
   */

  async function clearLibraryActivity(userId: string) {
    const { error } = await supabase
      .from("activity_events")
      .delete()
      .eq("user_id", userId)
      .eq("media_type", "SERIES")
      .eq("external_id", externalId)
      .in("activity_type", [
        "ADDED_PENDING",
        "STARTED",
      ]);

    if (error) {
      console.error(
        "Error clearing temporary series activity:",
        error,
      );
    }
  }

  /*
   * CREAR ACTIVIDAD TEMPORAL
   */

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

  /*
   * CAMBIAR ESTADO DE BIBLIOTECA
   */

  async function setLibraryStatus(newStatus: SeriesStatus) {
    if (loading || newStatus === status) {
      return;
    }

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
            onConflict: "user_id,media_type,external_id",
          },
        );

      if (error) {
        setMessage(error.message);
        return;
      }

      await clearLibraryActivity(user.id);

      await createLibraryActivity(
        user.id,
        newStatus === "IN_PROGRESS"
          ? "STARTED"
          : "ADDED_PENDING",
      );

      setStatus(newStatus);

      setMessage(
        newStatus === "IN_PROGRESS"
          ? "Serie marcada como viendo."
          : "Serie añadida a pendientes.",
      );
    } catch (error) {
      console.error(
        "Error changing series status:",
        error,
      );

      setMessage(
        "No se pudo actualizar la serie. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ABRIR FORMULARIO GLOBAL
   */

  const openWatchedModal = useCallback(async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Debes iniciar sesión.");
      return;
    }

    const {
      data: previousReviews,
      error,
    } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_type", "SERIES")
      .eq("external_id", externalId)
      .limit(1);

    if (error) {
      console.error(
        "Error checking previous series reviews:",
        error,
      );
    }

    setIsRewatch(Boolean(previousReviews?.length));

    setShowReview(true);
  }, [externalId, supabase]);

  /*
   * EVENTO DE SERIE COMPLETADA
   */

  useEffect(() => {
    function handleSeriesCompleted(event: Event) {
      const customEvent = event as CustomEvent<{
        seriesId: number;
      }>;

      if (customEvent.detail?.seriesId !== show.id) {
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

  /*
   * CERRAR FORMULARIO GLOBAL
   */

  function closeReview() {
    if (loading) {
      return;
    }

    setShowReview(false);
    setMessage("");
  }

  /*
   * GUARDAR REVIEW DESDE EL COMPONENTE GLOBAL
   */

  async function saveReview(draft: ReviewDraft) {
    if (loading) {
      return;
    }

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

      const seriesData = getSeriesData(user.id);

      const cleanReview = draft.reviewText.trim();

      const {
        data: createdReview,
        error: reviewError,
      } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,

          media_type: "SERIES",
          external_id: externalId,

          title: show.name,

          review_text: cleanReview || null,

          rating: draft.rating,

          liked: draft.liked,

          is_rewatch: draft.isRepeat,

          contains_spoilers: draft.containsSpoilers,

          show_consumed_date: draft.showConsumedDate,

          experience: draft.isRepeat
            ? "REWATCH"
            : "FIRST_TIME",

          consumed_at: getToday(),

          cover_url: seriesData.cover_url,
          backdrop_url: seriesData.backdrop_url,

          release_year: seriesData.release_year,
        })
        .select("id")
        .single();

      if (reviewError) {
        setMessage(reviewError.message);
        return;
      }

      /*
       * REGISTRAR ACTIVIDAD
       */

      if (createdReview) {
        const { error: activityError } = await supabase
          .from("activity_events")
          .insert({
            user_id: user.id,

            activity_type: "REVIEWED",

            media_type: "SERIES",
            external_id: externalId,

            title: show.name,
            cover_url: seriesData.cover_url,

            review_id: createdReview.id,
          });

        if (activityError) {
          console.error(
            "Error creating series review activity:",
            activityError,
          );
        }
      }

      /*
       * QUITAR DE PENDIENTES / VIENDO
       */

      const { error: deleteError } = await supabase
        .from("library_items")
        .delete()
        .eq("user_id", user.id)
        .eq("media_type", "SERIES")
        .eq("external_id", externalId);

      if (deleteError) {
        setMessage(deleteError.message);
        return;
      }

      await clearLibraryActivity(user.id);

      setStatus(null);
      setHasWatchedBefore(true);

      setShowReview(false);

      setMessage(
        draft.isRepeat
          ? "Rewatch de la serie guardado."
          : "Serie marcada como vista.",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error saving series review:",
        error,
      );

      setMessage(
        "No se pudo guardar la review. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * RENDER
   */

  return (
    <>
      {/* ACCIONES DE LA SERIE */}

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

      {/* FORMULARIO GLOBAL */}

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