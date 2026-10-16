import { createClient } from "@/lib/supabase/server";

export type RatingMediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

export type MediaRatingBucket = {
  value: number;
  count: number;
};

export type MediaRatingStats = {
  average: number | null;
  count: number;
  buckets: MediaRatingBucket[];
};

type RatingStatsRow = {
  average_rating:
    | number
    | string
    | null;

  rating_count:
    | number
    | string
    | null;

  rating_0_5:
    | number
    | string
    | null;

  rating_1_0:
    | number
    | string
    | null;

  rating_1_5:
    | number
    | string
    | null;

  rating_2_0:
    | number
    | string
    | null;

  rating_2_5:
    | number
    | string
    | null;

  rating_3_0:
    | number
    | string
    | null;

  rating_3_5:
    | number
    | string
    | null;

  rating_4_0:
    | number
    | string
    | null;

  rating_4_5:
    | number
    | string
    | null;

  rating_5_0:
    | number
    | string
    | null;
};

const EMPTY_RATINGS: MediaRatingStats = {
  average: null,
  count: 0,

  buckets: [
    { value: 0.5, count: 0 },
    { value: 1, count: 0 },
    { value: 1.5, count: 0 },
    { value: 2, count: 0 },
    { value: 2.5, count: 0 },
    { value: 3, count: 0 },
    { value: 3.5, count: 0 },
    { value: 4, count: 0 },
    { value: 4.5, count: 0 },
    { value: 5, count: 0 },
  ],
};

function toNumber(
  value:
    | number
    | string
    | null
    | undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export async function getMediaRatingStats(
  mediaType: RatingMediaType,
  externalId: string,
): Promise<MediaRatingStats> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_media_rating_stats",
      {
        p_media_type:
          mediaType,

        p_external_id:
          externalId,
      },
    );

  if (error) {
    console.error(
      "Error loading community ratings:",
      error,
    );

    return EMPTY_RATINGS;
  }

  const row =
    (
      Array.isArray(data)
        ? data[0]
        : data
    ) as
      | RatingStatsRow
      | null
      | undefined;

  if (!row) {
    return EMPTY_RATINGS;
  }

  const count =
    toNumber(
      row.rating_count,
    );

  const average =
    row.average_rating ===
      null
      ? null
      : toNumber(
          row.average_rating,
        );

  return {
    average:
      count > 0
        ? average
        : null,

    count,

    buckets: [
      {
        value: 0.5,
        count:
          toNumber(
            row.rating_0_5,
          ),
      },
      {
        value: 1,
        count:
          toNumber(
            row.rating_1_0,
          ),
      },
      {
        value: 1.5,
        count:
          toNumber(
            row.rating_1_5,
          ),
      },
      {
        value: 2,
        count:
          toNumber(
            row.rating_2_0,
          ),
      },
      {
        value: 2.5,
        count:
          toNumber(
            row.rating_2_5,
          ),
      },
      {
        value: 3,
        count:
          toNumber(
            row.rating_3_0,
          ),
      },
      {
        value: 3.5,
        count:
          toNumber(
            row.rating_3_5,
          ),
      },
      {
        value: 4,
        count:
          toNumber(
            row.rating_4_0,
          ),
      },
      {
        value: 4.5,
        count:
          toNumber(
            row.rating_4_5,
          ),
      },
      {
        value: 5,
        count:
          toNumber(
            row.rating_5_0,
          ),
      },
    ],
  };
}