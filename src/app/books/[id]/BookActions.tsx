
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LibraryReviewModalCard, {
  type ReviewDraft,
} from "@/components/media/LibraryReviewModalCard";
import MediaActionBar from "@/components/media/MediaActionBar";
import { createClient } from "@/lib/supabase/client";

interface BookActionsProps {
  book: {
    id: string;
    title: string;
    coverUrl: string | null;
    authors: string[];
  };
}

type BookStatus = "PENDING" | "IN_PROGRESS" | "DROPPED";

function isBookStatus(value: string): value is BookStatus {
  return value === "PENDING" || value === "IN_PROGRESS" || value === "DROPPED";
}

function getToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export default function BookActions({ book }: BookActionsProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [status, setStatus] = useState<BookStatus | null>(null);
  const [hasReadBefore, setHasReadBefore] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isReread, setIsReread] = useState(false);
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
            .eq("media_type", "BOOK")
            .eq("external_id", book.id)
            .maybeSingle(),
          supabase
            .from("reviews")
            .select("id")
            .eq("user_id", user.id)
            .eq("media_type", "BOOK")
            .eq("external_id", book.id)
            .limit(1),
        ]);

        if (libraryResult.error) {
          console.error("Error loading book state:", libraryResult.error);
        }
        if (reviewResult.error) {
          console.error("Error loading book reviews:", reviewResult.error);
        }
        if (cancelled) return;

        const loadedStatus = libraryResult.data?.status;
        setStatus(
          loadedStatus === "PENDING" ||
          loadedStatus === "IN_PROGRESS" ||
          loadedStatus === "DROPPED"
            ? loadedStatus
            : null,
        );
        setHasReadBefore(Boolean(reviewResult.data?.length));
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [book.id, supabase]);

  function getBookData(userId: string) {
    return {
      user_id: userId,
      media_type: "BOOK",
      external_id: book.id,
      title: book.title,
      original_title: null,
      cover_url: book.coverUrl,
      backdrop_url: null,
      release_year: null,
    };
  }

  async function clearLibraryActivity(userId: string) {
    const { error } = await supabase
      .from("activity_events")
      .delete()
      .eq("user_id", userId)
      .eq("media_type", "BOOK")
      .eq("external_id", book.id)
      .in("activity_type", ["ADDED_PENDING", "STARTED"]);

    if (error) {
      console.error("Error clearing book library activity:", error);
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
        media_type: "BOOK",
        external_id: book.id,
        title: book.title,
        cover_url: book.coverUrl,
      });

    if (error) {
      console.error("Error creating book activity:", error);
    }
  }

  async function setLibraryStatus(newStatus: BookStatus | null) {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Debes iniciar sesión.");
        return;
      }

      if (newStatus === null) {
        const { error } = await supabase
          .from("library_items")
          .delete()
          .eq("user_id", user.id)
          .eq("media_type", "BOOK")
          .eq("external_id", book.id);

        if (error) {
          setMessage(error.message);
          return;
        }

        await clearLibraryActivity(user.id);
        setStatus(null);
        setMessage("Libro quitado de tu biblioteca.");
        router.refresh();
        return;
      }

      const { error } = await supabase
        .from("library_items")
        .upsert(
          { ...getBookData(user.id), status: newStatus },
          { onConflict: "user_id,media_type,external_id" },
        );

      if (error) {
        setMessage(error.message);
        return;
      }

      await clearLibraryActivity(user.id);

      if (newStatus === "IN_PROGRESS") {
        await createLibraryActivity(user.id, "STARTED");
      }
      if (newStatus === "PENDING") {
        await createLibraryActivity(user.id, "ADDED_PENDING");
      }

      setStatus(newStatus);
      if (newStatus === "IN_PROGRESS") {
        setMessage("Libro marcado como leyendo.");
      } else if (newStatus === "PENDING") {
        setMessage("Libro añadido a pendientes.");
      } else {
        setMessage("Libro marcado como abandonado.");
      }
      router.refresh();
    } catch (error) {
      console.error("Error changing book status:", error);
      setMessage("No se pudo actualizar el libro.");
    } finally {
      setLoading(false);
    }
  }

  async function openReadModal() {
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
        .eq("media_type", "BOOK")
        .eq("external_id", book.id)
        .limit(1);

      if (error) {
        console.error("Error checking previous book reviews:", error);
      }

      setIsReread(Boolean(previousReviews?.length));
      setShowReview(true);
    } catch (error) {
      console.error("Error opening book review:", error);
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
          media_type: "BOOK",
          external_id: book.id,
          title: book.title,
          review_text: draft.reviewText.trim() || null,
          rating: draft.rating,
          liked: draft.liked,
          is_rewatch: draft.isRepeat,
          contains_spoilers: draft.containsSpoilers,
          show_consumed_date: draft.showConsumedDate,
          experience: draft.isRepeat ? "REREAD" : "FIRST_TIME",
          consumed_at: getToday(),
          cover_url: book.coverUrl,
          backdrop_url: null,
          release_year: null,
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
            media_type: "BOOK",
            external_id: book.id,
            title: book.title,
            cover_url: book.coverUrl,
            review_id: createdReview.id,
          });

        if (activityError) {
          console.error("Error creating book review activity:", activityError);
        }
      }

      const { error: deleteError } = await supabase
        .from("library_items")
        .delete()
        .eq("user_id", user.id)
        .eq("media_type", "BOOK")
        .eq("external_id", book.id);

      if (deleteError) {
        setMessage(deleteError.message);
        return;
      }

      await clearLibraryActivity(user.id);
      setStatus(null);
      setHasReadBefore(true);
      setShowReview(false);
      setMessage(
        draft.isRepeat ? "Relectura guardada." : "Libro marcado como leído.",
      );
      router.refresh();
    } catch (error) {
      console.error("Error saving book review:", error);
      setMessage("No se pudo guardar la review. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6">
        <MediaActionBar
          primaryLabel={
            hasReadBefore ? "Registrar relectura" : "Marcar como leído"
          }
          onPrimaryAction={openReadModal}
          primaryDisabled={loading}
          activeStatus={status}
          statusDisabled={loading}
          statusOptions={[
            { value: "IN_PROGRESS", label: "Leyendo" },
            { value: "PENDING", label: "Pendiente" },
          ]}
          onStatusChange={(newStatus) => {
            if (newStatus === null) return setLibraryStatus(null);
            if (!isBookStatus(newStatus)) return;
            return setLibraryStatus(newStatus);
          }}
          message={message}
        />
      </div>

      <LibraryReviewModalCard
        mode="create"
        open={showReview}
        mediaType="BOOK"
        title={book.title}
        coverUrl={book.coverUrl}
        initialRepeat={isReread}
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