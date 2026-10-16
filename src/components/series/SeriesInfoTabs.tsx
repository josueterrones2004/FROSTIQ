"use client";

import Image from "next/image";
import { useState } from "react";

export type SeriesCastMember = {
  id: number;
  name: string;
  character: string | null;
  imageUrl: string | null;
};

export type SeriesCrewMember = {
  id: string;
  name: string;
  job: string;
  imageUrl: string | null;
};

export type SeriesDetailsInfo = {
  genres: string[];
  networks: string[];

  status: string | null;
  format: string | null;

  originalLanguage: string | null;

  countries: string[];

  originalName: string | null;

  firstAirDate: string | null;

  seasonCount: number | null;
  episodeCount: number | null;
};

interface SeriesInfoTabsProps {
  cast: SeriesCastMember[];
  crew: SeriesCrewMember[];
  details: SeriesDetailsInfo;
}

type Tab =
  | "cast"
  | "crew"
  | "details";

function PersonImage({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="56px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600">
          {name
            .slice(0, 1)
            .toUpperCase()}
        </div>
      )}
    </div>
  );
}

function PersonRow({
  name,
  role,
  imageUrl,
}: {
  name: string;
  role: string | null;
  imageUrl: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-white/[0.06] py-3 last:border-b-0">
      <PersonImage
        src={imageUrl}
        name={name}
      />

      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium text-zinc-200">
          {name}
        </p>

        {role ? (
          <p className="mt-1 truncate text-xs text-zinc-500">
            {role}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-white/[0.06] py-4 last:border-b-0 sm:grid-cols-[145px_minmax(0,1fr)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </p>

      <div className="text-sm text-zinc-300">
        {children}
      </div>
    </div>
  );
}

function Tags({
  values,
}: {
  values: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-md bg-white/[0.045] px-2.5 py-1.5 text-xs text-zinc-300"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export default function SeriesInfoTabs({
  cast,
  crew,
  details,
}: SeriesInfoTabsProps) {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<Tab>(
      "cast",
    );

  const [
    showAllCast,
    setShowAllCast,
  ] =
    useState(false);

  const [
    showAllCrew,
    setShowAllCrew,
  ] =
    useState(false);

  const visibleCast =
    showAllCast
      ? cast
      : cast.slice(
          0,
          10,
        );

  const visibleCrew =
    showAllCrew
      ? crew
      : crew.slice(
          0,
          10,
        );

  const tabs: {
    id: Tab;
    label: string;
  }[] = [
    {
      id: "cast",
      label: "Reparto",
    },
    {
      id: "crew",
      label: "Equipo",
    },
    {
      id: "details",
      label: "Detalles",
    },
  ];

  return (
    <section className="mt-9">
      {/* TABS */}

      <div className="flex items-center gap-7 border-b border-white/[0.09]">
        {tabs.map((tab) => {
          const active =
            activeTab ===
            tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id,
                )
              }
              className={`relative pb-3 text-sm font-medium transition ${
                active
                  ? "text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-300"
              }`}
            >
              {tab.label}

              {active ? (
                <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-fuchsia-400" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* REPARTO */}

      {activeTab ===
      "cast" ? (
        <div className="pt-2">
          {cast.length ===
          0 ? (
            <p className="py-6 text-sm text-zinc-600">
              No hay información de reparto.
            </p>
          ) : (
            <>
              <div className="grid gap-x-8 lg:grid-cols-2">
                {visibleCast.map(
                  (person) => (
                    <PersonRow
                      key={
                        person.id
                      }
                      name={
                        person.name
                      }
                      role={
                        person.character
                      }
                      imageUrl={
                        person.imageUrl
                      }
                    />
                  ),
                )}
              </div>

              {cast.length >
              10 ? (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllCast(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  className="mt-4 text-sm font-medium text-zinc-500 transition hover:text-zinc-200"
                >
                  {showAllCast
                    ? "Ver menos"
                    : `Ver ${cast.length - 10} más`}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {/* EQUIPO */}

      {activeTab ===
      "crew" ? (
        <div className="pt-2">
          {crew.length ===
          0 ? (
            <p className="py-6 text-sm text-zinc-600">
              No hay información del equipo.
            </p>
          ) : (
            <>
              <div className="grid gap-x-8 lg:grid-cols-2">
                {visibleCrew.map(
                  (person) => (
                    <PersonRow
                      key={
                        person.id
                      }
                      name={
                        person.name
                      }
                      role={
                        person.job
                      }
                      imageUrl={
                        person.imageUrl
                      }
                    />
                  ),
                )}
              </div>

              {crew.length >
              10 ? (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllCrew(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  className="mt-4 text-sm font-medium text-zinc-500 transition hover:text-zinc-200"
                >
                  {showAllCrew
                    ? "Ver menos"
                    : `Ver ${crew.length - 10} más`}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {/* DETALLES */}

      {activeTab ===
      "details" ? (
        <div>
          {details.genres.length >
          0 ? (
            <DetailRow label="Géneros">
              <Tags
                values={
                  details.genres
                }
              />
            </DetailRow>
          ) : null}

          {details.networks.length >
          0 ? (
            <DetailRow label="Cadenas">
              <Tags
                values={
                  details.networks
                }
              />
            </DetailRow>
          ) : null}

          {details.status ? (
            <DetailRow label="Estado">
              {
                details.status
              }
            </DetailRow>
          ) : null}

          {details.format ? (
            <DetailRow label="Formato">
              {
                details.format
              }
            </DetailRow>
          ) : null}

          {details.originalLanguage ? (
            <DetailRow label="Idioma original">
              {
                details.originalLanguage
              }
            </DetailRow>
          ) : null}

          {details.countries.length >
          0 ? (
            <DetailRow label="País">
              {details.countries.join(
                ", ",
              )}
            </DetailRow>
          ) : null}

          {details.originalName ? (
            <DetailRow label="Título original">
              {
                details.originalName
              }
            </DetailRow>
          ) : null}

          {details.firstAirDate ? (
            <DetailRow label="Estreno">
              {
                details.firstAirDate
              }
            </DetailRow>
          ) : null}

          {details.seasonCount !==
          null ? (
            <DetailRow label="Temporadas">
              {
                details.seasonCount
              }
            </DetailRow>
          ) : null}

          {details.episodeCount !==
          null ? (
            <DetailRow label="Episodios">
              {
                details.episodeCount
              }
            </DetailRow>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}