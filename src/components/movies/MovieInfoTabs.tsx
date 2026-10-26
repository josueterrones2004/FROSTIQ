"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
} from "react";

type MovieInfoTab =
  | "cast"
  | "crew"
  | "details";

export type MovieCastMember = {
  name: string;

  character:
    | string
    | null;

  imageUrl:
    | string
    | null;
};

export type MovieCrewMember = {
  name: string;
  job: string;

  imageUrl:
    | string
    | null;
};

export type MovieDetailsInfo = {
  studios: string[];
  countries: string[];

  originalLanguage:
    | string
    | null;

  spokenLanguages: string[];

  alternativeTitles: string[];
};

interface MovieInfoTabsProps {
  cast: MovieCastMember[];
  crew: MovieCrewMember[];

  details:
    MovieDetailsInfo;

  compact?: boolean;
}

const MOBILE_LIMIT = 10;

const TABS: {
  value: MovieInfoTab;
  label: string;
}[] = [
  {
    value: "cast",
    label: "Reparto",
  },
  {
    value: "crew",
    label: "Equipo",
  },
  {
    value: "details",
    label: "Detalles",
  },
];

type DetailGroup = {
  key: string;
  title: string;
  values: string[];
};

/*
 * =========================================================
 * DESKTOP
 * =========================================================
 */

function DesktopCast({
  cast,
}: {
  cast: MovieCastMember[];
}) {
  if (cast.length === 0) {
    return (
      <p className="py-4 text-sm text-frost-muted">
        No hay información de reparto.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 py-4">
      {cast.map(
        (
          member,
          index,
        ) => (
          <span
            key={`${member.name}-${member.character}-${index}`}
            title={
              member.character ??
              undefined
            }
            className="rounded bg-frost-raised/35 px-2.5 py-1.5 text-xs text-frost-text transition hover:bg-frost-raised/55 hover:text-frost-text"
          >
            {member.name}
          </span>
        ),
      )}
    </div>
  );
}

function DesktopCrew({
  crew,
}: {
  crew: MovieCrewMember[];
}) {
  if (crew.length === 0) {
    return (
      <p className="py-4 text-sm text-frost-muted">
        No hay información del equipo.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 py-4">
      {crew.map(
        (
          member,
          index,
        ) => (
          <span
            key={`${member.name}-${member.job}-${index}`}
            title={member.job}
            className="rounded bg-frost-raised/35 px-2.5 py-1.5 text-xs text-frost-text transition hover:bg-frost-raised/55 hover:text-frost-text"
          >
            <span>
              {member.name}
            </span>

            <span className="ml-1.5 text-frost-muted">
              {member.job}
            </span>
          </span>
        ),
      )}
    </div>
  );
}

function DesktopDetailGroup({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="frost-movie-tabs-text-9 font-semibold uppercase frost-movie-tabs-track-018 text-frost-muted">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map(
          (value) => (
            <span
              key={value}
              className="rounded bg-frost-raised/30 px-2.5 py-1.5 text-xs text-frost-text"
            >
              {value}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function DesktopDetails({
  details,
}: {
  details: MovieDetailsInfo;
}) {
  const hasDetails =
    details.studios.length > 0 ||
    details.countries.length > 0 ||
    Boolean(
      details.originalLanguage,
    ) ||
    details.spokenLanguages.length > 0 ||
    details.alternativeTitles.length > 0;

  if (!hasDetails) {
    return (
      <p className="py-4 text-sm text-frost-muted">
        No hay información adicional.
      </p>
    );
  }

  return (
    <div className="grid gap-5 py-4 sm:grid-cols-2">
      <DesktopDetailGroup
        label="Estudios"
        values={details.studios}
      />

      <DesktopDetailGroup
        label="País"
        values={details.countries}
      />

      <DesktopDetailGroup
        label="Idioma original"
        values={
          details.originalLanguage
            ? [
                details.originalLanguage,
              ]
            : []
        }
      />

      <DesktopDetailGroup
        label="Idiomas hablados"
        values={
          details.spokenLanguages
        }
      />

      <div className="sm:col-span-2">
        <DesktopDetailGroup
          label="Títulos alternativos"
          values={
            details.alternativeTitles
          }
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MOBILE SHARED
 * =========================================================
 */

function PersonAvatar({
  name,
  imageUrl,
}: {
  name: string;

  imageUrl:
    | string
    | null;
}) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-frost-raised/25">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-frost-muted">
          {name
            .slice(
              0,
              1,
            )
            .toUpperCase()}
        </div>
      )}
    </div>
  );
}

function ShowMoreButton({
  expanded,
  remaining,
  onToggle,
}: {
  expanded: boolean;
  remaining: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-1 flex w-full items-center justify-center border-t border-frost-border/80 py-4 text-xs font-semibold uppercase frost-movie-tabs-track-018 text-frost-muted transition hover:text-frost-text"
    >
      {expanded
        ? "Ver menos"
        : `Ver ${remaining} más`}
    </button>
  );
}

/*
 * =========================================================
 * MOBILE CAST
 * =========================================================
 */

function MobileCast({
  cast,
  expanded,
  onToggle,
}: {
  cast: MovieCastMember[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (cast.length === 0) {
    return (
      <p className="py-5 text-sm text-frost-muted">
        No hay información de reparto.
      </p>
    );
  }

  const visibleCast =
    expanded
      ? cast
      : cast.slice(
          0,
          MOBILE_LIMIT,
        );

  const remaining =
    Math.max(
      0,
      cast.length -
        MOBILE_LIMIT,
    );

  return (
    <div>
      {visibleCast.map(
        (
          member,
          index,
        ) => (
          <div
            key={`${member.name}-${member.character}-${index}`}
            className="flex items-center gap-3 border-b border-frost-border/65 py-3.5 last:border-b-0"
          >
            <PersonAvatar
              name={
                member.name
              }
              imageUrl={
                member.imageUrl
              }
            />

            <div className="min-w-0">
              <p className="truncate frost-movie-tabs-text-17 font-medium leading-tight text-frost-text">
                {member.name}
              </p>

              {member.character ? (
                <p className="mt-1 truncate text-sm text-frost-muted">
                  {
                    member.character
                  }
                </p>
              ) : null}
            </div>
          </div>
        ),
      )}

      {cast.length >
      MOBILE_LIMIT ? (
        <ShowMoreButton
          expanded={
            expanded
          }
          remaining={
            remaining
          }
          onToggle={
            onToggle
          }
        />
      ) : null}
    </div>
  );
}

/*
 * =========================================================
 * MOBILE CREW
 * =========================================================
 */

function MobileCrew({
  crew,
  expanded,
  onToggle,
}: {
  crew: MovieCrewMember[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (crew.length === 0) {
    return (
      <p className="py-5 text-sm text-frost-muted">
        No hay información del equipo.
      </p>
    );
  }

  const visibleCrew =
    expanded
      ? crew
      : crew.slice(
          0,
          MOBILE_LIMIT,
        );

  const remaining =
    Math.max(
      0,
      crew.length -
        MOBILE_LIMIT,
    );

  return (
    <div>
      {visibleCrew.map(
        (
          member,
          index,
        ) => (
          <div
            key={`${member.name}-${member.job}-${index}`}
            className="flex items-center gap-3 border-b border-frost-border/65 py-3.5 last:border-b-0"
          >
            <PersonAvatar
              name={
                member.name
              }
              imageUrl={
                member.imageUrl
              }
            />

            <div className="min-w-0">
              <p className="truncate frost-movie-tabs-text-17 font-medium leading-tight text-frost-text">
                {member.name}
              </p>

              <p className="mt-1 truncate text-sm text-frost-muted">
                {member.job}
              </p>
            </div>
          </div>
        ),
      )}

      {crew.length >
      MOBILE_LIMIT ? (
        <ShowMoreButton
          expanded={
            expanded
          }
          remaining={
            remaining
          }
          onToggle={
            onToggle
          }
        />
      ) : null}
    </div>
  );
}

/*
 * =========================================================
 * MOBILE DETAILS
 * =========================================================
 */

function buildDetailGroups(
  details: MovieDetailsInfo,
): DetailGroup[] {
  return [
    {
      key: "studios",
      title: "Estudios",
      values:
        details.studios,
    },

    {
      key: "countries",
      title: "País",
      values:
        details.countries,
    },

    {
      key:
        "original-language",

      title:
        "Idioma original",

      values:
        details.originalLanguage
          ? [
              details.originalLanguage,
            ]
          : [],
    },

    {
      key:
        "spoken-languages",

      title:
        "Idiomas hablados",

      values:
        details.spokenLanguages,
    },

    {
      key:
        "alternative-titles",

      title:
        "Títulos alternativos",

      values:
        details.alternativeTitles,
    },
  ].filter(
    (group) =>
      group.values.length > 0,
  );
}

function limitDetailGroups(
  groups: DetailGroup[],
  limit: number,
) {
  let remaining =
    limit;

  const result:
    DetailGroup[] =
    [];

  for (
    const group of groups
  ) {
    if (
      remaining <= 0
    ) {
      break;
    }

    const values =
      group.values.slice(
        0,
        remaining,
      );

    if (
      values.length > 0
    ) {
      result.push({
        ...group,
        values,
      });

      remaining -=
        values.length;
    }
  }

  return result;
}

function MobileDetailSection({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <section className="border-b border-frost-border/80 py-4 last:border-b-0">
      <h3 className="frost-movie-tabs-text-11 font-semibold uppercase frost-movie-tabs-track-017 text-frost-muted">
        {title}
      </h3>

      <div className="mt-2">
        {values.map(
          (value) => (
            <p
              key={value}
              className="py-1.5 text-base leading-6 text-frost-text"
            >
              {value}
            </p>
          ),
        )}
      </div>
    </section>
  );
}

function MobileDetails({
  details,
  expanded,
  onToggle,
}: {
  details: MovieDetailsInfo;
  expanded: boolean;
  onToggle: () => void;
}) {
  const groups =
    useMemo(
      () =>
        buildDetailGroups(
          details,
        ),
      [
        details,
      ],
    );

  const totalItems =
    groups.reduce(
      (
        total,
        group,
      ) =>
        total +
        group.values.length,
      0,
    );

  if (
    totalItems === 0
  ) {
    return (
      <p className="py-5 text-sm text-frost-muted">
        No hay información adicional.
      </p>
    );
  }

  const visibleGroups =
    expanded
      ? groups
      : limitDetailGroups(
          groups,
          MOBILE_LIMIT,
        );

  const remaining =
    Math.max(
      0,
      totalItems -
        MOBILE_LIMIT,
    );

  return (
    <div>
      {visibleGroups.map(
        (group) => (
          <MobileDetailSection
            key={group.key}
            title={
              group.title
            }
            values={
              group.values
            }
          />
        ),
      )}

      {totalItems >
      MOBILE_LIMIT ? (
        <ShowMoreButton
          expanded={
            expanded
          }
          remaining={
            remaining
          }
          onToggle={
            onToggle
          }
        />
      ) : null}
    </div>
  );
}

/*
 * =========================================================
 * MAIN
 * =========================================================
 */

export default function MovieInfoTabs({
  cast,
  crew,
  details,
  compact = false,
}: MovieInfoTabsProps) {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<MovieInfoTab>(
      "cast",
    );

  const [
    castExpanded,
    setCastExpanded,
  ] =
    useState(false);

  const [
    crewExpanded,
    setCrewExpanded,
  ] =
    useState(false);

  const [
    detailsExpanded,
    setDetailsExpanded,
  ] =
    useState(false);

  return (
    <section>
      <style>{`
        .frost-movie-tabs-text-9 { font-size: 9px; }
        .frost-movie-tabs-text-11 { font-size: 11px; }
        .frost-movie-tabs-text-17 { font-size: 17px; }
        .frost-movie-tabs-track-008 { letter-spacing: 0.08em; }
        .frost-movie-tabs-track-017 { letter-spacing: 0.17em; }
        .frost-movie-tabs-track-018 { letter-spacing: 0.18em; }
      `}</style>
      {/* TABS */}

      <div className="flex items-end gap-6 border-b border-frost-border">
        {TABS.map(
          (tab) => {
            const active =
              activeTab ===
              tab.value;

            return (
              <button
                key={
                  tab.value
                }
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.value,
                  )
                }
                className={`relative pb-2.5 frost-movie-tabs-text-11 font-medium uppercase frost-movie-tabs-track-008 transition ${
                  active
                    ? "text-frost-text"
                    : "text-frost-accent hover:text-frost-accent"
                }`}
              >
                {
                  tab.label
                }

                {active ? (
                  <span className="absolute inset-x-0 -bottom-px h-px bg-frost-text" />
                ) : null}
              </button>
            );
          },
        )}
      </div>

      {/* DESKTOP */}

      <div className="hidden md:block">
        {activeTab ===
        "cast" ? (
          <DesktopCast
            cast={
              compact
                ? cast.slice(
                    0,
                    16,
                  )
                : cast
            }
          />
        ) : null}

        {activeTab ===
        "crew" ? (
          <DesktopCrew
            crew={
              compact
                ? crew.slice(
                    0,
                    16,
                  )
                : crew
            }
          />
        ) : null}

        {activeTab ===
        "details" ? (
          <DesktopDetails
            details={
              details
            }
          />
        ) : null}
      </div>

      {/* MOBILE */}

      <div className="md:hidden">
        {activeTab ===
        "cast" ? (
          <MobileCast
            cast={cast}
            expanded={
              castExpanded
            }
            onToggle={() =>
              setCastExpanded(
                (current) =>
                  !current,
              )
            }
          />
        ) : null}

        {activeTab ===
        "crew" ? (
          <MobileCrew
            crew={crew}
            expanded={
              crewExpanded
            }
            onToggle={() =>
              setCrewExpanded(
                (current) =>
                  !current,
              )
            }
          />
        ) : null}

        {activeTab ===
        "details" ? (
          <MobileDetails
            details={
              details
            }
            expanded={
              detailsExpanded
            }
            onToggle={() =>
              setDetailsExpanded(
                (current) =>
                  !current,
              )
            }
          />
        ) : null}
      </div>
    </section>
  );
}