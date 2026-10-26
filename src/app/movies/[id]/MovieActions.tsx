
"use client";

import { Clock3, Eye, Loader2, Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LibraryReviewModalCard, {
  type ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";
import { persistMediaReview } from "@/components/RegisterReviewModal";
import { createClient } from "@/lib/supabase/client";

interface MovieActionsProps {
  movie: {
    id: string;
    title: string;
    originalTitle: string | null;
    coverUrl: string | null;
    backdropUrl: string | null;
    releaseYear: number | null;
  };
}

export default function MovieActions({
  movie,
}: MovieActionsProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [pending, setPending] = useState(false);
  const [hasWatchedBefore, setHasWatchedBefore] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const [libraryResult, reviewResult] = await Promise.all([
          supabase
            .from("library_items")
            .select("status")
            .eq("user_id", user.id)
            .eq("media_type", "MOVIE")
            .eq("external_id", movie.id)
            .maybeSingle(),

          supabase
            .from("reviews")
            .select("id")
            .eq("user_id", user.id)
            .eq("media_type", "MOVIE")
            .eq("external_id", movie.id)
            .limit(1),
        ]);

        if (libraryResult.error) {
          console.error(
            "Error loading movie state:",
            libraryResult.error,
          );
        }

        if (reviewResult.error) {
          console.error(
            "Error loading movie reviews:",
            reviewResult.error,
          );
        }

        if (cancelled) return;

        setPending(
          libraryResult.data?.status === "PENDING",
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
  }, [movie.id, supabase]);

  function getMovieData(userId: string) {
    return {
      user_id: userId,
      media_type: "MOVIE",
      external_id: movie.id,
      title: movie.title,
      original_title: movie.originalTitle,
      cover_url: movie.coverUrl,
      backdrop_url: movie.backdropUrl,
      release_year: movie.releaseYear,
    };
  }

  async function clearTemporaryActivity(userId: string) {
    const { error } = await supabase
      .from("activity_events")
      .delete()
      .eq("user_id", userId)
      .eq("media_type", "MOVIE")
      .eq("external_id", movie.id)
      .in("activity_type", [
        "ADDED_PENDING",
        "STARTED",
      ]);

    if (error) {
      console.error(
        "Error clearing temporary movie activity:",
        error,
      );
    }
  }

  async function togglePending() {
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

      if (pending) {
        const { error } = await supabase
          .from("library_items")
          .delete()
          .eq("user_id", user.id)
          .eq("media_type", "MOVIE")
          .eq("external_id", movie.id);

        if (error) {
          setMessage(error.message);
          return;
        }

        await clearTemporaryActivity(user.id);

        setPending(false);
        setMessage("Quitada de tu lista.");
        router.refresh();
        return;
      }

      await clearTemporaryActivity(user.id);

      const { error } = await supabase
        .from("library_items")
        .upsert(
          {
            ...getMovieData(user.id),
            status: "PENDING",
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

      const { error: activityError } = await supabase
        .from("activity_events")
        .insert({
          user_id: user.id,
          activity_type: "ADDED_PENDING",
          media_type: "MOVIE",
          external_id: movie.id,
          title: movie.title,
          cover_url: movie.coverUrl,
        });

      if (activityError) {
        console.error(
          "Error creating movie pending activity:",
          activityError,
        );
      }

      setPending(true);
      setMessage("Añadida para ver después.");
      router.refresh();
    } catch (error) {
      console.error(
        "Error changing movie library status:",
        error,
      );
      setMessage("No se pudo actualizar la película.");
    } finally {
      setLoading(false);
    }
  }

  async function openWatchedModal() {
    setMessage("");

    try {
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
        .eq("media_type", "MOVIE")
        .eq("external_id", movie.id)
        .limit(1);

      if (error) {
        console.error(
          "Error checking previous movie reviews:",
          error,
        );
      }

      setIsRewatch(Boolean(previousReviews?.length));
      setShowReview(true);
    } catch (error) {
      console.error(
        "Error opening movie review:",
        error,
      );
      setMessage("No se pudo abrir la review.");
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
        mediaType: "MOVIE",
        externalId: movie.id,
        title: movie.title,
        coverUrl: movie.coverUrl,
        backdropUrl: movie.backdropUrl,
        releaseYear: movie.releaseYear,
        draft,
      });

      setPending(false);
      setHasWatchedBefore(true);
      setShowReview(false);

      setMessage(
        result.warning ??
          (draft.isRepeat
            ? "Rewatch guardado."
            : "Película marcada como vista."),
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error saving movie review:",
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={loading}
          onClick={() => void openWatchedModal()}
          className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-frost-accent/15 px-4 text-sm font-medium text-frost-accent transition hover:bg-frost-accent/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : hasWatchedBefore ? (
            <Repeat2 size={16} />
          ) : (
            <Eye size={17} />
          )}

          <span>
            {hasWatchedBefore
              ? "Registrar rewatch"
              : "Marcar como vista"}
          </span>
        </button>

        <button
          type="button"
          disabled={loading}
          aria-pressed={pending}
          onClick={() => void togglePending()}
          className={`inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition sm:w-auto ${
            pending
              ? "bg-amber-500/12 text-amber-200"
              : "bg-frost-surface/35 text-frost-muted hover:bg-frost-raised/40 hover:text-frost-text"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Clock3 size={16} />

          <span>
            {pending ? "En mi lista" : "Ver después"}
          </span>
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-xs text-frost-muted sm:text-sm">
          {message}
        </p>
      ) : null}

      <LibraryReviewModalCard
        mode="create"
        open={showReview}
        mediaType="MOVIE"
        title={movie.title}
        releaseYear={movie.releaseYear}
        coverUrl={movie.coverUrl}
        initialRepeat={isRewatch}
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