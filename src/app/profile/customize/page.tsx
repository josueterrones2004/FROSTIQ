import {
  redirect,
} from "next/navigation";

import {
  getMediaArtworkMapKey,
  getMixedMediaArtworkOverrides,
} from "@/lib/media-artwork";

import {
  createClient,
} from "@/lib/supabase/server";

import ProfileCustomizeEditor from "./ProfileCustomizeEditor";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

type SectionRow = {
  section_key:
    SectionKey;

  visible:
    boolean;

  position:
    number;
};

type FavoriteRow = {
  id:
    string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  position:
    number;
};

type ActivityType =
  | "ADDED_PENDING"
  | "STARTED"
  | "EPISODE_WATCHED"
  | "COMPLETED"
  | "REVIEWED";

type ActivityRow = {
  id:
    string;

  activity_type:
    ActivityType;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  created_at:
    string;
};

export default async function CustomizeProfilePage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth"
    );
  }

  const [
    profileResult,
    sectionsResult,
    favoritesResult,
    activityResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "profiles"
        )
        .select(`
          username,
          display_name,
          bio,
          avatar_url,
          banner_url,
          avatar_crop,
          banner_crop
        `)
        .eq(
          "id",
          user.id
        )
        .single(),

      supabase
        .from(
          "profile_sections"
        )
        .select(`
          section_key,
          visible,
          position
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "position",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "profile_favorites"
        )
        .select(`
          id,
          media_type,
          external_id,
          title,
          cover_url,
          position
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "position",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "activity_events"
        )
        .select(`
          id,
          activity_type,
          media_type,
          external_id,
          title,
          cover_url,
          created_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          6
        ),
    ]);

  if (
    profileResult.error
  ) {
    throw new Error(
      profileResult.error.message
    );
  }

  if (
    sectionsResult.error
  ) {
    console.error(
      "Error loading profile sections:",
      sectionsResult.error
    );
  }

  if (
    favoritesResult.error
  ) {
    console.error(
      "Error loading profile favorites:",
      favoritesResult.error
    );
  }

  if (
    activityResult.error
  ) {
    console.error(
      "Error loading profile activity:",
      activityResult.error
    );
  }

  const rawFavorites =
    (
      favoritesResult.data ??
      []
    ) as FavoriteRow[];

  const rawActivity =
    (
      activityResult.data ??
      []
    ) as ActivityRow[];

  const artworkOverrides =
    await getMixedMediaArtworkOverrides([
      ...rawFavorites,
      ...rawActivity,
    ]);

  const initialFavorites =
    rawFavorites.map(
      (
        favorite
      ) => {
        const override =
          artworkOverrides.get(
            getMediaArtworkMapKey(
              favorite.media_type,
              favorite.external_id
            )
          );

        return {
          ...favorite,

          cover_url:
            override
              ?.poster_url ??
            favorite.cover_url,

          poster_position_x:
            override
              ?.poster_position_x ??
            50,

          poster_position_y:
            override
              ?.poster_position_y ??
            50,

          poster_zoom:
            override
              ?.poster_zoom ??
            1,
        };
      }
    );

  const recentActivity =
    rawActivity.map(
      (
        activity
      ) => {
        const override =
          artworkOverrides.get(
            getMediaArtworkMapKey(
              activity.media_type,
              activity.external_id
            )
          );

        return {
          ...activity,

          cover_url:
            override
              ?.poster_url ??
            activity.cover_url,

          poster_position_x:
            override
              ?.poster_position_x ??
            50,

          poster_position_y:
            override
              ?.poster_position_y ??
            50,

          poster_zoom:
            override
              ?.poster_zoom ??
            1,
        };
      }
    );

  const defaultSections:
    SectionRow[] =
    [
      {
        section_key:
          "ACTIVITY",

        visible:
          true,

        position:
          1,
      },

      {
        section_key:
          "FAVORITE_MOVIES",

        visible:
          true,

        position:
          2,
      },

      {
        section_key:
          "FAVORITE_SERIES",

        visible:
          true,

        position:
          3,
      },

      {
        section_key:
          "FAVORITE_BOOKS",

        visible:
          true,

        position:
          4,
      },

      {
        section_key:
          "FAVORITE_GAMES",

        visible:
          true,

        position:
          5,
      },
    ];

  const sections =
    sectionsResult.data &&
    sectionsResult.data.length >
      0
      ? (
          sectionsResult.data as SectionRow[]
        )
      : defaultSections;

  return (
    <main className="mx-auto w-full max-w-[1100px] border-x-0 border-zinc-800/80 bg-zinc-950 pb-20 lg:border-x">
      <ProfileCustomizeEditor
        userId={
          user.id
        }
        initialProfile={{
          username:
            profileResult.data.username,

          displayName:
            profileResult.data.display_name,

          bio:
            profileResult.data.bio,

          avatarUrl:
            profileResult.data.avatar_url,

          bannerUrl:
            profileResult.data.banner_url,

          avatarCrop:
            profileResult.data.avatar_crop,

          bannerCrop:
            profileResult.data.banner_crop,
        }}
        initialSections={
          sections
        }
        initialFavorites={
          initialFavorites
        }
        recentActivity={
          recentActivity
        }
      />
    </main>
  );
}