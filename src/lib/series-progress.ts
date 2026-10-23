export type SeasonProgressSummary = {
  season_number: number;
  episode_count: number;
};

export type WatchedEpisode = {
  season_number: number;
  episode_number: number;
  created_at?: string | null;
};

export type NextEpisode = {
  seasonNumber: number;
  episodeNumber: number;
};

/* =========================================
   SIGUIENTE EPISODIO PENDIENTE
========================================= */

export function findNextUnwatchedEpisode(
  seasons: readonly SeasonProgressSummary[],
  watches: readonly WatchedEpisode[],
): NextEpisode | null {
  const orderedSeasons = [...seasons]
    .filter(
      (season) =>
        season.season_number > 0 &&
        season.episode_count > 0,
    )
    .sort(
      (a, b) =>
        a.season_number -
        b.season_number,
    );

  if (orderedSeasons.length === 0) {
    return null;
  }

  const episodeCounts = new Map(
    orderedSeasons.map((season) => [
      season.season_number,
      season.episode_count,
    ]),
  );

  /* =========================================
     VISUALIZACIONES VÁLIDAS
  ========================================= */

  const validWatches = watches.filter(
    (watch) => {
      const total = episodeCounts.get(
        watch.season_number,
      );

      return (
        total !== undefined &&
        watch.episode_number >= 1 &&
        watch.episode_number <= total
      );
    },
  );

  const watched = new Set(
    validWatches.map(
      (watch) =>
        `${watch.season_number}:${watch.episode_number}`,
    ),
  );

  /* =========================================
     TEMPORADA ACTIVA

     Tomamos la temporada de la
     visualización más reciente.

     No suponemos que todas las temporadas
     anteriores deban haberse visto.
  ========================================= */

  const latestWatch =
    validWatches.reduce<
      WatchedEpisode | null
    >((latest, watch) => {
      if (!latest) {
        return watch;
      }

      const currentDate =
        watch.created_at ?? "";

      const latestDate =
        latest.created_at ?? "";

      return currentDate > latestDate
        ? watch
        : latest;
    }, null);

  const startingSeason =
    latestWatch?.season_number ??
    orderedSeasons[0].season_number;

  const startIndex =
    orderedSeasons.findIndex(
      (season) =>
        season.season_number ===
        startingSeason,
    );

  /* =========================================
     BUSCAR PRIMER EPISODIO PENDIENTE

     Comenzamos en la temporada activa.

     Si está completa, continuamos a la
     siguiente temporada disponible.

     No regresamos automáticamente a T1.
  ========================================= */

  for (
    let index = Math.max(0, startIndex);
    index < orderedSeasons.length;
    index++
  ) {
    const season = orderedSeasons[index];

    for (
      let episode = 1;
      episode <= season.episode_count;
      episode++
    ) {
      const key =
        `${season.season_number}:${episode}`;

      if (!watched.has(key)) {
        return {
          seasonNumber:
            season.season_number,
          episodeNumber: episode,
        };
      }
    }
  }

  return null;
}

/* =========================================
   FORMATO DEL SIGUIENTE EPISODIO
========================================= */

export function formatNextEpisode(
  episode: NextEpisode,
  title?: string | null,
): string {
  const label =
    `T${episode.seasonNumber} · ` +
    `E${episode.episodeNumber}`;

  return title?.trim()
    ? `${label} · ${title.trim()}`
    : label;
}