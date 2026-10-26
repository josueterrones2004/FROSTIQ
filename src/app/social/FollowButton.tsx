"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FOLLOW_TABLE } from "@/lib/follows";
import { createClient } from "@/lib/supabase/client";

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  initialFollowing: boolean;
  compact?: boolean;
}

type FollowState = {
  targetUserId: string;
  following: boolean;
};

export default function FollowButton({
  currentUserId,
  targetUserId,
  initialFollowing,
  compact = false,
}: FollowButtonProps) {
  const router = useRouter();

  const [supabase] = useState(() =>
    createClient(),
  );

  /*
   * Guardamos también targetUserId.
   *
   * Así, si Next reutiliza el componente
   * al navegar entre perfiles, no hace
   * falta sincronizar props con useEffect.
   */

  const [followState, setFollowState] =
    useState<FollowState>({
      targetUserId,
      following: initialFollowing,
    });

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const following =
    followState.targetUserId === targetUserId
      ? followState.following
      : initialFollowing;

  async function toggleFollow() {
    if (
      loading ||
      currentUserId === targetUserId
    ) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (
        authError ||
        !user ||
        user.id !== currentUserId
      ) {
        throw new Error(
          "Tu sesión ha cambiado. Vuelve a iniciar sesión.",
        );
      }

      if (following) {
        const { error } = await supabase
          .from(FOLLOW_TABLE)
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) {
          throw error;
        }

        setFollowState({
          targetUserId,
          following: false,
        });
      } else {
        const { error } = await supabase
          .from(FOLLOW_TABLE)
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) {
          throw error;
        }

        setFollowState({
          targetUserId,
          following: true,
        });
      }

      /*
       * Refresca contadores de:
       *
       * - perfil
       * - seguidores
       * - siguiendo
       */

      router.refresh();
    } catch (error) {
      console.error(
        "Error updating follow status:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el seguimiento.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (currentUserId === targetUserId) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={() => {
          void toggleFollow();
        }}
        disabled={loading}
        aria-pressed={following}
        className={`inline-flex items-center justify-center rounded-full text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          compact
            ? "min-w-22 px-3.5 py-1.5"
            : "min-w-27 px-5 py-2"
        } ${
          following
            ? "border border-frost-border bg-frost-bg text-frost-text hover:border-frost-accent/40 hover:bg-frost-surface"
            : "bg-frost-accent text-frost-bg hover:bg-frost-accent-hover"
        }`}
      >
        {loading ? (
          <Loader2
            size={15}
            className="animate-spin"
          />
        ) : following ? (
          "Siguiendo"
        ) : (
          "Seguir"
        )}
      </button>

      {errorMessage && (
        <p
          role="alert"
          className="max-w-56 text-right leading-4 text-frost-danger"
          style={{ fontSize: 11 }}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}