import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { shouldUseOriginalImage } from "@/lib/image-optimization";
import {
  getMediaArtworkOverrides,
  type MediaArtworkOverride,
  type MediaArtworkType,
} from "@/lib/media-artwork";

import ProfileActivity from "./ProfileActivity";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type MediaType = "MOVIE" | "SERIES" | "BOOK" | "GAME";

type ProfileSection = {
  section_key: SectionKey;
  visible: boolean;
  position: number;
};

export type ProfileFavorite = {
  id: string;
  media_type: MediaType;
  external_id: string;
  title: string;
  cover_url: string | null;
  position: number;
};

interface ProfileSectionsProps {
  profileUserId: string;
  username: string;
  sections: ProfileSection[];
  favorites: ProfileFavorite[];
  includeActivity?: boolean;
}

type ArtworkMaps = {
  movie: Map<string, MediaArtworkOverride>;
  series: Map<string, MediaArtworkOverride>;
  book: Map<string, MediaArtworkOverride>;
  game: Map<string, MediaArtworkOverride>;
};

const DEFAULT_SECTIONS: ProfileSection[] = [
  { section_key: "ACTIVITY", visible: true, position: 1 },
  { section_key: "FAVORITE_MOVIES", visible: true, position: 2 },
  { section_key: "FAVORITE_SERIES", visible: true, position: 3 },
  { section_key: "FAVORITE_BOOKS", visible: true, position: 4 },
  { section_key: "FAVORITE_GAMES", visible: true, position: 5 },
];

function getMediaHref(mediaType: MediaType, externalId: string) {
  switch (mediaType) {
    case "MOVIE":
      return `/movies/${externalId}`;
    case "SERIES":
      return `/series/${externalId}`;
    case "BOOK":
      return `/books/${externalId}`;
    case "GAME":
      return `/games/${externalId}`;
  }
}

function getArtworkType(mediaType: MediaType): MediaArtworkType {
  switch (mediaType) {
    case "MOVIE":
      return "movie";
    case "SERIES":
      return "series";
    case "BOOK":
      return "book";
    case "GAME":
      return "game";
  }
}

function getArtworkMap(mediaType: MediaType, artworkMaps: ArtworkMaps) {
  return artworkMaps[getArtworkType(mediaType)];
}

function FavoriteMedia({
  favorites,
  mediaType,
  artworkMaps,
}: {
  favorites: ProfileFavorite[];
  mediaType: MediaType;
  artworkMaps: ArtworkMaps;
}) {
  const filtered = favorites
    .filter((favorite) => favorite.media_type === mediaType)
    .sort((a, b) => a.position - b.position)
    .slice(0, 6);

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-frost-muted">
        Todavía no hay favoritos en esta sección.
      </p>
    );
  }

  const artworkMap = getArtworkMap(mediaType, artworkMaps);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 lg:gap-4">
      {filtered.map((favorite) => {
        const override = artworkMap.get(favorite.external_id);
        const coverUrl = override?.poster_url ?? favorite.cover_url;
        const positionX = override?.poster_position_x ?? 50;
        const positionY = override?.poster_position_y ?? 50;
        const zoom = override?.poster_zoom ?? 1;

        return (
          <Link
            key={favorite.id}
            href={getMediaHref(favorite.media_type, favorite.external_id)}
            className="frost-profile-favorite-width group shrink-0"
          >
            <div className="relative aspect-2/3 overflow-hidden rounded-md border border-frost-border bg-frost-surface transition-colors group-hover:border-frost-accent/40">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={favorite.title}
                  fill
                  sizes="135px"
                  unoptimized={shouldUseOriginalImage(coverUrl)}
                  className="object-cover"
                  style={{
                    objectPosition: `${positionX}% ${positionY}%`,
                    transform: `scale(${zoom})`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-3 text-center text-xs text-frost-muted">
                  Sin portada
                </div>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-frost-muted transition-colors group-hover:text-frost-text lg:text-sm">
              {favorite.title}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 border-b border-frost-border pb-2.5">
      <h2 className="frost-profile-section-eyebrow font-semibold uppercase text-frost-muted">
        {children}
      </h2>
    </div>
  );
}

export default async function ProfileSections({
  profileUserId,
  username,
  sections,
  favorites,
  includeActivity = true,
}: ProfileSectionsProps) {
  // Agrupamos IDs por tipo para pedir solo los overrides necesarios.
  const movieIds = favorites
    .filter((favorite) => favorite.media_type === "MOVIE")
    .map((favorite) => favorite.external_id);

  const seriesIds = favorites
    .filter((favorite) => favorite.media_type === "SERIES")
    .map((favorite) => favorite.external_id);

  const bookIds = favorites
    .filter((favorite) => favorite.media_type === "BOOK")
    .map((favorite) => favorite.external_id);

  const gameIds = favorites
    .filter((favorite) => favorite.media_type === "GAME")
    .map((favorite) => favorite.external_id);

  const [movieArtwork, seriesArtwork, bookArtwork, gameArtwork] =
    await Promise.all([
      getMediaArtworkOverrides("movie", movieIds),
      getMediaArtworkOverrides("series", seriesIds),
      getMediaArtworkOverrides("book", bookIds),
      getMediaArtworkOverrides("game", gameIds),
    ]);

  const artworkMaps: ArtworkMaps = {
    movie: movieArtwork,
    series: seriesArtwork,
    book: bookArtwork,
    game: gameArtwork,
  };

  const effectiveSections = sections.length > 0 ? sections : DEFAULT_SECTIONS;

  const visibleSections = effectiveSections
    .filter(
      (section) =>
        section.visible &&
        (includeActivity || section.section_key !== "ACTIVITY"),
    )
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-10 lg:space-y-12">
      <style>{`
        .frost-profile-favorite-width {
          width: 112px;
        }

        .frost-profile-section-eyebrow {
          font-size: 11px;
          letter-spacing: 0.18em;
        }

        @media (min-width: 1024px) {
          .frost-profile-favorite-width {
            width: 135px;
          }
        }
      `}</style>

      {visibleSections.map((section) => {
        switch (section.section_key) {
          case "ACTIVITY":
            return (
              <section key={section.section_key}>
                <SectionTitle>Actividad reciente</SectionTitle>
                <ProfileActivity
                  profileUserId={profileUserId}
                  username={username}
                  mode="preview"
                />
              </section>
            );

          case "FAVORITE_MOVIES":
            return (
              <section key={section.section_key}>
                <SectionTitle>Películas favoritas</SectionTitle>
                <FavoriteMedia
                  favorites={favorites}
                  mediaType="MOVIE"
                  artworkMaps={artworkMaps}
                />
              </section>
            );

          case "FAVORITE_SERIES":
            return (
              <section key={section.section_key}>
                <SectionTitle>Series favoritas</SectionTitle>
                <FavoriteMedia
                  favorites={favorites}
                  mediaType="SERIES"
                  artworkMaps={artworkMaps}
                />
              </section>
            );

          case "FAVORITE_BOOKS":
            return (
              <section key={section.section_key}>
                <SectionTitle>Libros favoritos</SectionTitle>
                <FavoriteMedia
                  favorites={favorites}
                  mediaType="BOOK"
                  artworkMaps={artworkMaps}
                />
              </section>
            );

          case "FAVORITE_GAMES":
            return (
              <section key={section.section_key}>
                <SectionTitle>Juegos favoritos</SectionTitle>
                <FavoriteMedia
                  favorites={favorites}
                  mediaType="GAME"
                  artworkMaps={artworkMaps}
                />
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}