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
      <p className="py-4 text-sm text-zinc-600">
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
            className="rounded bg-white/[0.07] px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.11] hover:text-zinc-100"
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
      <p className="py-4 text-sm text-zinc-600">
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
            className="rounded bg-white/[0.07] px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.11] hover:text-zinc-100"
          >
            <span>
              {member.name}
            </span>

            <span className="ml-1.5 text-zinc-600">
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
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map(
          (value) => (
            <span
              key={value}
              className="rounded bg-white/[0.06] px-2.5 py-1.5 text-xs text-zinc-300"
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
      <p className="py-4 text-sm text-zinc-600">
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
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.055]">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-600">
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
      className="mt-1 flex w-full items-center justify-center border-t border-white/[0.08] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition hover:text-white"
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
      <p className="py-5 text-sm text-zinc-600">
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
            className="flex items-center gap-3 border-b border-white/[0.065] py-3.5 last:border-b-0"
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
              <p className="truncate text-[17px] font-medium leading-tight text-zinc-200">
                {member.name}
              </p>

              {member.character ? (
                <p className="mt-1 truncate text-sm text-zinc-600">
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
      <p className="py-5 text-sm text-zinc-600">
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
            className="flex items-center gap-3 border-b border-white/[0.065] py-3.5 last:border-b-0"
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
              <p className="truncate text-[17px] font-medium leading-tight text-zinc-200">
                {member.name}
              </p>

              <p className="mt-1 truncate text-sm text-zinc-600">
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
    <section className="border-b border-white/[0.08] py-4 last:border-b-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.17em] text-zinc-500">
        {title}
      </h3>

      <div className="mt-2">
        {values.map(
          (value) => (
            <p
              key={value}
              className="py-1.5 text-[16px] leading-6 text-zinc-300"
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
      <p className="py-5 text-sm text-zinc-600">
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
      {/* TABS */}

      <div className="flex items-end gap-6 border-b border-white/15">
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
                className={`relative pb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] transition ${
                  active
                    ? "text-zinc-100"
                    : "text-fuchsia-400 hover:text-fuchsia-300"
                }`}
              >
                {
                  tab.label
                }

                {active ? (
                  <span className="absolute inset-x-0 bottom-[-1px] h-px bg-zinc-100" />
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