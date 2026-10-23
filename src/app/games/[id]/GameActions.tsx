"use client";

import { Clock3, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  persistMediaReview,
} from "@/components/RegisterReviewModal";
import LibraryReviewModalCard, {
  type ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";
import MediaActionBar from "@/components/media/MediaActionBar";
import { createClient } from "@/lib/supabase/client";

interface GameActionsProps {
  game: {
    id: string;
    title: string;
    coverUrl: string | null;
    backdropUrl: string | null;
    releaseYear: number | null;
  };
}

type GameStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DROPPED";

function isGameStatus(
  value: string,
): value is GameStatus {
  return (
    value === "PENDING" ||
    value === "IN_PROGRESS" ||
    value === "DROPPED"
  );
}

export default function GameActions({
  game,
}: GameActionsProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [status, setStatus] =
    useState<GameStatus | null>(null);
  const [hasCompletedBefore, setHasCompletedBefore] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [showReview, setShowReview] =
    useState(false);
  const [isReplay, setIsReplay] =
    useState(false);
  const [message, setMessage] = useState("");

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
              .eq("media_type", "GAME")
              .eq("external_id", game.id)
              .maybeSingle(),

            supabase
              .from("reviews")
              .select("id")
              .eq("user_id", user.id)
              .eq("media_type", "GAME")
              .eq("external_id", game.id)
              .limit(1),
          ]);

        if (libraryResult.error) {
          console.error(
            "Error loading game status:",
            libraryResult.error,
          );
        }

        if (reviewResult.error) {
          console.error(
            "Error loading game reviews:",
            reviewResult.error,
          );
        }

        if (cancelled) return;

        const loadedStatus =
          libraryResult.data?.status;

        setStatus(
          loadedStatus === "PENDING" ||
          loadedStatus === "IN_PROGRESS" ||
          loadedStatus === "DROPPED"
            ? loadedStatus
            : null,
        );

        setHasCompletedBefore(
          Boolean(reviewResult.data?.length),
        );
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [game.id, supabase]);

  function getGameData(userId: string) {
    return {
      user_id: userId,
      media_type: "GAME",
      external_id: game.id,
      title: game.title,
      original_title: null,
      cover_url: game.coverUrl,
      backdrop_url: game.backdropUrl,
      release_year: game.releaseYear,
    };
  }

  async function clearPendingActivity(userId: string) {
    const { error } = await supabase
      .from("activity_events")
      .delete()
      .eq("user_id", userId)
      .eq("media_type", "GAME")
      .eq("external_id", game.id)
      .eq("activity_type", "ADDED_PENDING");

    if (error) {
      console.error(
        "Error clearing game pending activity:",
        error,
      );
    }
  }

  async function createActivity(
    userId: string,
    activityType: "STARTED" | "ADDED_PENDING",
  ) {
    const { error } = await supabase
      .from("activity_events")
      .insert({
        user_id: userId,
        activity_type: activityType,
        media_type: "GAME",
        external_id: game.id,
        title: game.title,
        cover_url: game.coverUrl,
      });

    if (error) {
      console.error(
        "Error creating game activity:",
        error,
      );
    }
  }

  async function setLibraryStatus(
    newStatus: GameStatus | null,
  ) {
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

      if (newStatus === null) {
        const { error } = await supabase
          .from("library_items")
          .delete()
          .eq("user_id", user.id)
          .eq("media_type", "GAME")
          .eq("external_id", game.id);

        if (error) {
          setMessage(error.message);
          return;
        }

        await clearPendingActivity(user.id);

        setStatus(null);
        setMessage(
          "Juego quitado de tu estado activo.",
        );
        router.refresh();
        return;
      }

      const { error } = await supabase
        .from("library_items")
        .upsert(
          {
            ...getGameData(user.id),
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

      if (newStatus === "IN_PROGRESS") {
        await createActivity(user.id, "STARTED");
      }

      if (newStatus === "PENDING") {
        await createActivity(
          user.id,
          "ADDED_PENDING",
        );
      }

      setStatus(newStatus);

      if (newStatus === "IN_PROGRESS") {
        setMessage(
          hasCompletedBefore
            ? "Nueva partida iniciada."
            : "Juego marcado como jugando.",
        );
      } else if (newStatus === "PENDING") {
        setMessage("Juego añadido a pendientes.");
      } else {
        setMessage("Juego marcado como abandonado.");
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Error changing game status:",
        error,
      );
      setMessage(
        "No se pudo actualizar el juego.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function openCompletedModal() {
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
        .eq("media_type", "GAME")
        .eq("external_id", game.id)
        .limit(1);

      if (error) {
        console.error(
          "Error checking game reviews:",
          error,
        );
        setMessage(
          "No se pudo consultar el historial.",
        );
        return;
      }

      setIsReplay(Boolean(data?.length));
      setShowReview(true);
    } catch (error) {
      console.error(
        "Error opening game review:",
        error,
      );
      setMessage(
        "No se pudo abrir la review.",
      );
    }
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

      const result = await persistMediaReview({
        supabase,
        userId: user.id,
        mediaType: "GAME",
        externalId: game.id,
        title: game.title,
        coverUrl: game.coverUrl,
        backdropUrl: game.backdropUrl,
        releaseYear: game.releaseYear,
        draft,
      });

      // La partida actual se completa.
      // Se retira de En progreso, pero sigue
      // en Completados por su historial de reviews.
      if (result.statusCleared) {
        setStatus(null);
      }

      setHasCompletedBefore(true);
      setShowReview(false);

      setMessage(
        result.warning ??
          (draft.isRepeat
            ? "Replay guardado."
            : "Juego marcado como completado."),
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error saving game review:",
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
        <MediaActionBar
          primaryLabel={
            hasCompletedBefore
              ? "✓ Completado"
              : "Marcar como completado"
          }
          primaryActive={hasCompletedBefore}
          onPrimaryAction={openCompletedModal}
          primaryDisabled={loading}
          activeStatus={status}
          statusDisabled={loading}
          statusOptions={[
            {
              value: "IN_PROGRESS",
              label: "Jugando",
              icon: <Play size={13} />,
            },
            {
              value: "PENDING",
              label: "Pendiente",
              icon: <Clock3 size={13} />,
            },
          ]}
          onStatusChange={(newStatus) => {
            if (newStatus === null) {
              return setLibraryStatus(null);
            }

            if (!isGameStatus(newStatus)) {
              return;
            }

            return setLibraryStatus(newStatus);
          }}
          message={message}
        />
      </div>

      <LibraryReviewModalCard
        mode="create"
        open={showReview}
        mediaType="GAME"
        title={game.title}
        releaseYear={game.releaseYear}
        coverUrl={game.coverUrl}
        initialRepeat={isReplay}
        loading={loading}
        message={message}
        onClose={() => {
          if (!loading) {
            setShowReview(false);
            setMessage("");
          }
        }}
        onSave={saveReview}
      />
    </>
  );
}