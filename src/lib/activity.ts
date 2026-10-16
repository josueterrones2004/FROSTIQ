import type {
  SupabaseClient,
} from "@supabase/supabase-js";

export type ActivityMediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

export async function removeLibraryActivity({
  supabase,
  userId,
  mediaType,
  externalId,
}: {
  supabase: SupabaseClient;
  userId: string;
  mediaType: ActivityMediaType;
  externalId: string;
}) {
  const {
    error,
  } =
    await supabase
      .from(
        "activity_events"
      )
      .delete()
      .eq(
        "user_id",
        userId
      )
      .eq(
        "media_type",
        mediaType
      )
      .eq(
        "external_id",
        externalId
      )
      .in(
        "activity_type",
        [
          "ADDED_PENDING",
          "STARTED",
        ]
      );

  if (error) {
    console.error(
      "Error removing library activity:",
      error
    );

    return false;
  }

  return true;
}