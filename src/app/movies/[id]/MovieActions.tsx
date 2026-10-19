
"use client";

import { Clock3, Eye, Loader2, Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LibraryReviewModalCard, {
  type ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";
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

function getToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export default function MovieActions({ movie }: MovieActionsProps) {
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
        const { data: { user } } = await supabase.auth.getUser();
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
          console.error("Error loading movie state:", libraryResult.error);
        }
        if (reviewResult.error) {
          console.error("Error loading movie reviews:", reviewResult.error);
        }
        if (cancelled) return;

        setPending(libraryResult.data?.status === "PENDING");
        setHasWatchedBefore(Boolean(reviewResult.data?.length));
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
      .in("activity_type", ["ADDED_PENDING", "STARTED"]);

    if (error) {
      console.error("Error clearing temporary movie activity:", error);
    }
  }

  async function togglePending() {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
          { ...getMovieData(user.id), status: "PENDING" },
          { onConflict: "user_id,media_type,external_id" },
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
        console.error("Error creating movie pending activity:", activityError);
      }

      setPending(true);
      setMessage("Añadida para ver después.");
      router.refresh();
    } catch (error) {
      console.error("Error changing movie library status:", error);
      setMessage("No se pudo actualizar la película.");
    } finally {
      setLoading(false);
    }
  }

  async function openWatchedModal() {
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      const { data: previousReviews, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("media_type", "MOVIE")
        .eq("external_id", movie.id)
        .limit(1);

      if (error) {
        console.error("Error checking previous movie reviews:", error);
      }

      setIsRewatch(Boolean(previousReviews?.length));
      setShowReview(true);
    } catch (error) {
      console.error("Error opening movie review:", error);
      setMessage("No se pudo abrir la review.");
    }
  }

  async function saveReview(draft: ReviewDraft) {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      const { data: createdReview, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          media_type: "MOVIE",
          external_id: movie.id,
          title: movie.title,
          review_text: draft.reviewText.trim() || null,
          rating: draft.rating,
          liked: draft.liked,
          is_rewatch: draft.isRepeat,
          contains_spoilers: draft.containsSpoilers,
          show_consumed_date: draft.showConsumedDate,
          experience: draft.isRepeat ? "REWATCH" : "FIRST_TIME",
          consumed_at: getToday(),
          cover_url: movie.coverUrl,
          backdrop_url: movie.backdropUrl,
          release_year: movie.releaseYear,
        })
        .select("id")
        .single();

      if (reviewError) {
        setMessage(reviewError.message);
        return;
      }

      if (createdReview) {
        const { error: activityError } = await supabase
          .from("activity_events")
          .insert({
            user_id: user.id,
            activity_type: "REVIEWED",
            media_type: "MOVIE",
            external_id: movie.id,
            title: movie.title,
            cover_url: movie.coverUrl,
            review_id: createdReview.id,
          });

        if (activityError) {
          console.error("Error creating movie review activity:", activityError);
        }
      }

      const { error: deleteError } = await supabase
        .from("library_items")
        .delete()
        .eq("user_id", user.id)
        .eq("media_type", "MOVIE")
        .eq("external_id", movie.id);

      if (deleteError) {
        setMessage(deleteError.message);
        return;
      }

      await clearTemporaryActivity(user.id);
      setPending(false);
      setHasWatchedBefore(true);
      setShowReview(false);
      setMessage(
        draft.isRepeat ? "Rewatch guardado." : "Película marcada como vista.",
      );
      router.refresh();
    } catch (error) {
      console.error("Error saving movie review:", error);
      setMessage("No se pudo guardar la review. Inténtalo de nuevo.");
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
          className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-fuchsia-500/15 px-4 text-sm font-medium text-fuchsia-200 transition hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : hasWatchedBefore ? (
            <Repeat2 size={16} />
          ) : (
            <Eye size={17} />
          )}
          <span>
            {hasWatchedBefore ? "Registrar rewatch" : "Marcar como vista"}
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
              : "bg-white/[0.035] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Clock3 size={16} />
          <span>{pending ? "En mi lista" : "Ver después"}</span>
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-xs text-zinc-500 sm:text-sm">{message}</p>
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