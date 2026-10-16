"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface ActivityLikeButtonProps {
  activityId?: string | null;
  reviewId?: string | null;

  currentUserId?: string | null;

  initialLiked?: boolean;
  initialCount?: number;

  variant?: "count" | "review";

  className?: string;
}

type ActivityEventRow = {
  id: string;
};

type ActivityLikeRow = {
  user_id: string;
};

export default function ActivityLikeButton({
  activityId = null,
  reviewId = null,

  currentUserId = null,

  initialLiked = false,
  initialCount = 0,

  variant = "count",

  className = "",
}: ActivityLikeButtonProps) {
  const router = useRouter();

  const [supabase] = useState(() =>
    createClient(),
  );

  const [
    resolvedActivityId,
    setResolvedActivityId,
  ] = useState<string | null>(
    activityId,
  );

  const [liked, setLiked] =
    useState(initialLiked);

  const [count, setCount] =
    useState(initialCount);

  const [loading, setLoading] =
    useState(false);

  /*
   * =====================================================
   * REVIEW -> ACTIVITY
   *
   * Buscamos el activity_event REVIEWED relacionado
   * y cargamos los mismos likes que usa Social.
   * =====================================================
   */

  useEffect(() => {
    if (activityId || !reviewId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const {
        data: activityData,
        error: activityError,
      } = await supabase
        .from("activity_events")
        .select("id")
        .eq("review_id", reviewId)
        .eq(
          "activity_type",
          "REVIEWED",
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (activityError) {
        console.error(
          "Error resolving review activity:",
          activityError,
        );

        return;
      }

      if (
        cancelled ||
        !activityData
      ) {
        return;
      }

      const activity =
        activityData as ActivityEventRow;

      const {
        data: likesData,
        error: likesError,
      } = await supabase
        .from("activity_likes")
        .select("user_id")
        .eq(
          "activity_id",
          activity.id,
        );

      if (likesError) {
        console.error(
          "Error loading activity likes:",
          likesError,
        );
      }

      if (cancelled) {
        return;
      }

      const likes =
        (likesData ??
          []) as ActivityLikeRow[];

      let userId =
        currentUserId;

      if (!userId) {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        userId =
          user?.id ?? null;
      }

      if (cancelled) {
        return;
      }

      setResolvedActivityId(
        activity.id,
      );

      setCount(likes.length);

      setLiked(
        Boolean(
          userId &&
            likes.some(
              (like) =>
                like.user_id ===
                userId,
            ),
        ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activityId,
    currentUserId,
    reviewId,
    supabase,
  ]);

  async function getActivityId() {
    if (resolvedActivityId) {
      return resolvedActivityId;
    }

    if (activityId) {
      return activityId;
    }

    if (!reviewId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("activity_events")
      .select("id")
      .eq(
        "review_id",
        reviewId,
      )
      .eq(
        "activity_type",
        "REVIEWED",
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Error resolving review activity:",
        error,
      );

      return null;
    }

    if (!data) {
      return null;
    }

    const id =
      (data as ActivityEventRow).id;

    setResolvedActivityId(id);

    return id;
  }

  async function toggleLike() {
    if (loading) {
      return;
    }

    let userId =
      currentUserId;

    if (!userId) {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      userId =
        user?.id ?? null;
    }

    if (!userId) {
      router.push(
        "/auth?mode=login",
      );

      return;
    }

    const targetActivityId =
      await getActivityId();

    if (!targetActivityId) {
      return;
    }

    setLoading(true);

    /*
     * QUITAR LIKE
     */

    if (liked) {
      const { error } =
        await supabase
          .from("activity_likes")
          .delete()
          .eq(
            "activity_id",
            targetActivityId,
          )
          .eq(
            "user_id",
            userId,
          );

      if (error) {
        console.error(
          "Error removing activity like:",
          error,
        );

        setLoading(false);

        return;
      }

      setLiked(false);

      setCount((current) =>
        Math.max(
          0,
          current - 1,
        ),
      );

      setLoading(false);

      return;
    }

    /*
     * DAR LIKE
     */

    const { error } =
      await supabase
        .from("activity_likes")
        .insert({
          activity_id:
            targetActivityId,

          user_id: userId,
        });

    if (error) {
      if (
        error.code === "23505"
      ) {
        setLiked(true);
        setLoading(false);

        return;
      }

      console.error(
        "Error creating activity like:",
        error,
      );

      setLoading(false);

      return;
    }

    setLiked(true);

    setCount(
      (current) =>
        current + 1,
    );

    setLoading(false);
  }

  /*
   * =====================================================
   * REVIEW
   *
   * Sin like:
   *
   * ♡ 0 Me gusta
   *
   * Con like:
   *
   * ♥ 1
   *
   * SOLO el corazón se pone rojo.
   * =====================================================
   */

  if (variant === "review") {
    return (
      <button
        type="button"
        onClick={() => {
          void toggleLike();
        }}
        disabled={loading}
        aria-pressed={liked}
        className={`inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <Heart
          size={18}
          fill={
            liked
              ? "currentColor"
              : "none"
          }
          className={
            liked
              ? "text-rose-500"
              : "text-zinc-500"
          }
        />

        <span className="min-w-[8px] text-zinc-500">
          {count}
        </span>

        {!liked ? (
          <span className="text-zinc-500">
            Me gusta
          </span>
        ) : null}
      </button>
    );
  }

  /*
   * =====================================================
   * SOCIAL
   * =====================================================
   */

  return (
    <button
      type="button"
      onClick={() => {
        void toggleLike();
      }}
      disabled={loading}
      aria-pressed={liked}
      className={`mt-4 flex items-center gap-2 text-sm transition ${
        liked
          ? "text-red-500"
          : "text-zinc-500 hover:text-zinc-300"
      } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Heart
        size={18}
        fill={
          liked
            ? "currentColor"
            : "none"
        }
      />

      <span>{count}</span>
    </button>
  );
}