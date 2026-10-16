import {
  getIGDBGameTypeLabel,
  getIGDBImageUrl,
  getIGDBReleaseYear,
  normalizeIGDBGameType,
  searchIGDBGames,
  type IGDBGame,
} from "@/lib/igdb";

import {
  getOpenLibraryCoverUrl,
  getWorkIdFromKey,
  searchBooks,
  type OpenLibrarySearchBook,
} from "@/lib/openlibrary";

import {
  searchTMDB,
} from "@/lib/tmdb";

export type SearchKind =
  | "game"
  | "movie"
  | "series"
  | "book";

export type UnifiedSearchResult = {
  key: string;

  kind:
    SearchKind;

  externalId:
    string;

  title:
    string;

  aliases:
    string[];

  image:
    | string
    | null;

  year:
    | number
    | null;

  subtitle:
    | string
    | null;

  meta:
    | string
    | null;

  href:
    string;

  baseScore:
    number;

  score:
    number;
};

type TMDBResult = {
  id:
    number;

  media_type:
    | "movie"
    | "tv"
    | string;

  title?:
    string;

  name?:
    string;

  original_title?:
    string;

  original_name?:
    string;

  poster_path?:
    | string
    | null;

  release_date?:
    string;

  first_air_date?:
    string;

  popularity?:
    number;

  vote_count?:
    number;

  genre_ids?:
    number[];
};

/*
 * NORMALIZATION
 */

const romanNumbers:
  Record<
    string,
    string
  > = {
  i: "1",
  ii: "2",
  iii: "3",
  iv: "4",
  v: "5",
  vi: "6",
  vii: "7",
  viii: "8",
  ix: "9",
  x: "10",
};

export function normalizeSearchText(
  value:
    string
) {
  return value
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /([a-zA-Z])(\d)/g,
      "$1 $2"
    )
    .replace(
      /(\d)([a-zA-Z])/g,
      "$1 $2"
    )
    .toLowerCase()
    .replace(
      /&/g,
      " and "
    )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function canonicalizeSearchText(
  value:
    string
) {
  const normalized =
    normalizeSearchText(
      value
    );

  const words =
    normalized
      .split(
        " "
      )
      .map(
        (
          word
        ) =>
          romanNumbers[
            word
          ] ??
          word
      );

  const withoutArticle =
    words.join(
      " "
    );

  return withoutArticle.replace(
    /^(the|a|an|el|la|los|las|un|una|unos|unas)\s+/,
    ""
  );
}

function getProviderQuery(
  query:
    string
) {
  return normalizeSearchText(
    query
  );
}

/*
 * FUZZY MATCH
 */

function levenshteinDistance(
  first:
    string,

  second:
    string
) {
  const rows =
    second.length +
    1;

  const columns =
    first.length +
    1;

  const matrix =
    Array.from(
      {
        length:
          rows,
      },
      () =>
        new Array<number>(
          columns
        ).fill(
          0
        )
    );

  for (
    let index =
      0;

    index <
    columns;

    index++
  ) {
    matrix[0][
      index
    ] =
      index;
  }

  for (
    let index =
      0;

    index <
    rows;

    index++
  ) {
    matrix[index][0] =
      index;
  }

  for (
    let row =
      1;

    row <
    rows;

    row++
  ) {
    for (
      let column =
        1;

      column <
      columns;

      column++
    ) {
      const cost =
        second[
          row -
            1
        ] ===
        first[
          column -
            1
        ]
          ? 0
          : 1;

      matrix[row][
        column
      ] =
        Math.min(
          matrix[
            row -
              1
          ][
            column
          ] +
            1,

          matrix[
            row
          ][
            column -
              1
          ] +
            1,

          matrix[
            row -
              1
          ][
            column -
              1
          ] +
            cost
        );
    }
  }

  return matrix[
    rows -
      1
  ][
    columns -
      1
  ];
}

function getSimilarity(
  first:
    string,

  second:
    string
) {
  if (
    !first ||
    !second
  ) {
    return 0;
  }

  const left =
    first.slice(
      0,
      60
    );

  const right =
    second.slice(
      0,
      60
    );

  const maximum =
    Math.max(
      left.length,
      right.length
    );

  if (
    maximum ===
    0
  ) {
    return 1;
  }

  const distance =
    levenshteinDistance(
      left,
      right
    );

  return (
    1 -
    distance /
      maximum
  );
}

function getTitleScore(
  title:
    string,

  query:
    string
) {
  const normalizedTitle =
    canonicalizeSearchText(
      title
    );

  const normalizedQuery =
    canonicalizeSearchText(
      query
    );

  if (
    !normalizedTitle ||
    !normalizedQuery
  ) {
    return 0;
  }

  if (
    normalizedTitle ===
    normalizedQuery
  ) {
    return 150;
  }

  if (
    normalizedTitle.startsWith(
      `${normalizedQuery} `
    )
  ) {
    return 122;
  }

  if (
    normalizedTitle.startsWith(
      normalizedQuery
    )
  ) {
    return 115;
  }

  if (
    normalizedTitle.includes(
      ` ${normalizedQuery} `
    ) ||
    normalizedTitle.endsWith(
      ` ${normalizedQuery}`
    )
  ) {
    return 82;
  }

  if (
    normalizedTitle.includes(
      normalizedQuery
    )
  ) {
    return 75;
  }

  const queryWords =
    normalizedQuery.split(
      " "
    );

  const titleWords =
    new Set(
      normalizedTitle.split(
        " "
      )
    );

  const matches =
    queryWords.filter(
      (
        word
      ) =>
        titleWords.has(
          word
        )
    ).length;

  let score =
    (
      matches /
      queryWords.length
    ) *
    55;

  const similarity =
    getSimilarity(
      normalizedTitle,
      normalizedQuery
    );

  if (
    similarity >=
    0.9
  ) {
    score =
      Math.max(
        score,
        105
      );
  } else if (
    similarity >=
    0.8
  ) {
    score =
      Math.max(
        score,
        82
      );
  } else if (
    similarity >=
    0.7
  ) {
    score =
      Math.max(
        score,
        58
      );
  }

  return score;
}

function getBestNameScore(
  title:
    string,

  aliases:
    string[],

  query:
    string
) {
  let best =
    getTitleScore(
      title,
      query
    );

  for (
    const alias of
    aliases
  ) {
    best =
      Math.max(
        best,
        getTitleScore(
          alias,
          query
        ) -
          3
      );
  }

  return best;
}

/*
 * YEAR
 */

function getTMDBYear(
  item:
    TMDBResult
) {
  const date =
    item.media_type ===
    "movie"
      ? item.release_date
      : item.first_air_date;

  if (
    !date
  ) {
    return null;
  }

  const year =
    Number(
      date.slice(
        0,
        4
      )
    );

  return Number.isFinite(
    year
  )
    ? year
    : null;
}

/*
 * GAMES
 */

function makeGameResult(
  game:
    IGDBGame,

  query:
    string
): UnifiedSearchResult {
  const aliases =
    game.alternative_names
      ?.map(
        (
          alias
        ) =>
          alias.name
      )
      .filter(
        Boolean
      ) ??
    [];

  let score =
    getBestNameScore(
      game.name,
      aliases,
      query
    );

  const gameType =
    normalizeIGDBGameType(
      game.game_type
        ?.type
    );

  if (
    gameType ===
    "main_game"
  ) {
    score +=
      28;
  } else if (
    gameType ===
      "expansion" ||
    gameType ===
      "standalone_expansion"
  ) {
    score +=
      13;
  } else if (
    gameType ===
    "dlc_addon"
  ) {
    score +=
      9;
  } else if (
    gameType ===
      "remake" ||
    gameType ===
      "remaster"
  ) {
    score +=
      8;
  }

  if (
    game.cover
      ?.image_id
  ) {
    score +=
      8;
  } else {
    score -=
      15;
  }

  if (
    game.total_rating_count
  ) {
    score +=
      Math.min(
        25,
        Math.log10(
          game.total_rating_count +
            1
        ) *
          7
      );
  }

  const platforms =
    game.platforms
      ?.slice(
        0,
        3
      )
      .map(
        (
          platform
        ) =>
          platform.name
      )
      .join(
        ", "
      ) ??
    null;

  return {
    key:
      `game:${game.id}`,

    kind:
      "game",

    externalId:
      String(
        game.id
      ),

    title:
      game.name,

    aliases,

    image:
      getIGDBImageUrl(
        game.cover
          ?.image_id,
        "cover_big"
      ),

    year:
      getIGDBReleaseYear(
        game.first_release_date
      ),

    subtitle:
      getIGDBGameTypeLabel(
        game
      ),

    meta:
      platforms,

    href:
      `/games/${game.id}`,

    baseScore:
      score,

    score,
  };
}

/*
 * TMDB
 */

function makeTMDBResult(
  item:
    TMDBResult,

  query:
    string
): UnifiedSearchResult {
  const isMovie =
    item.media_type ===
    "movie";

  const title =
    (
      isMovie
        ? item.title
        : item.name
    ) ??
    "Sin título";

  const originalTitle =
    isMovie
      ? item.original_title
      : item.original_name;

  const aliases =
    originalTitle &&
    normalizeSearchText(
      originalTitle
    ) !==
      normalizeSearchText(
        title
      )
      ? [
          originalTitle,
        ]
      : [];

  let score =
    getBestNameScore(
      title,
      aliases,
      query
    );

  if (
    item.poster_path
  ) {
    score +=
      8;
  } else {
    score -=
      16;
  }

  if (
    item.popularity
  ) {
    score +=
      Math.min(
        20,
        Math.log10(
          item.popularity +
            1
        ) *
          7
      );
  }

  if (
    item.vote_count
  ) {
    score +=
      Math.min(
        16,
        Math.log10(
          item.vote_count +
            1
        ) *
          5
      );
  }

  const documentary =
    item.genre_ids?.includes(
      99
    ) ??
    false;

  if (
    documentary &&
    canonicalizeSearchText(
      title
    ) !==
      canonicalizeSearchText(
        query
      )
  ) {
    score -=
      30;
  }

  return {
    key:
      `${
        isMovie
          ? "movie"
          : "series"
      }:${item.id}`,

    kind:
      isMovie
        ? "movie"
        : "series",

    externalId:
      String(
        item.id
      ),

    title,

    aliases,

    image:
      item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,

    year:
      getTMDBYear(
        item
      ),

    subtitle:
      isMovie
        ? "Película"
        : "Serie",

    meta:
      originalTitle &&
      originalTitle !==
        title
        ? originalTitle
        : null,

    href:
      isMovie
        ? `/movies/${item.id}`
        : `/series/${item.id}`,

    baseScore:
      score,

    score,
  };
}

/*
 * BOOKS
 */

function makeBookResult(
  book:
    OpenLibrarySearchBook,

  query:
    string
): UnifiedSearchResult {
  const authors =
    book.author_name
      ?.slice(
        0,
        2
      )
      .join(
        ", "
      ) ??
    null;

  let score =
    getTitleScore(
      book.title,
      query
    );

  if (
    book.cover_i
  ) {
    score +=
      13;
  } else {
    score -=
      14;
  }

  if (
    book.edition_count
  ) {
    score +=
      Math.min(
        22,
        Math.log10(
          book.edition_count +
            1
        ) *
          8
      );
  }

  const workId =
    getWorkIdFromKey(
      book.key
    );

  return {
    key:
      `book:${workId}`,

    kind:
      "book",

    externalId:
      workId,

    title:
      book.title,

    aliases:
      [],

    image:
      getOpenLibraryCoverUrl(
        book.cover_i,
        "L"
      ),

    year:
      book.first_publish_year ??
      null,

    subtitle:
      "Libro",

    meta:
      authors,

    href:
      `/books/${workId}`,

    baseScore:
      score,

    score,
  };
}

/*
 * DEDUP
 */

function deduplicateResults(
  results:
    UnifiedSearchResult[]
) {
  const seen =
    new Set<
      string
    >();

  const output:
    UnifiedSearchResult[] =
    [];

  for (
    const result of
    results
  ) {
    /*
     * Películas, series y juegos pueden compartir
     * exactamente el mismo título aunque sean obras
     * diferentes: remakes, adaptaciones, reboots, etc.
     *
     * En esos casos el ID del proveedor es lo que
     * realmente identifica al contenido.
     *
     * Para libros mantenemos la deduplicación visual
     * por título + autor porque Open Library puede
     * devolver obras prácticamente idénticas.
     */

    const key =
      result.kind ===
      "book"
        ? `book:${normalizeSearchText(
            result.title
          )}:${normalizeSearchText(
            result.meta ??
              ""
          )}`
        : result.key;

    if (
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    output.push(
      result
    );
  }

  return output;
}

/*
 * FRANCHISE RANKING
 */

function getKindBoost(
  items:
    UnifiedSearchResult[]
) {
  const strong =
    items.filter(
      (
        item
      ) =>
        item.baseScore >=
        105
    ).length;

  const medium =
    items.filter(
      (
        item
      ) =>
        item.baseScore >=
          75 &&
        item.baseScore <
          105
    ).length;

  return Math.min(
    38,
    strong *
      6 +
      medium *
        2
  );
}

function getOriginYears(
  results:
    UnifiedSearchResult[]
) {
  const values:
    Partial<
      Record<
        SearchKind,
        number
      >
    > = {};

  for (
    const kind of
    [
      "game",
      "movie",
      "series",
      "book",
    ] as SearchKind[]
  ) {
    const years =
      results
        .filter(
          (
            result
          ) =>
            result.kind ===
              kind &&
            result.baseScore >=
              100 &&
            result.year !==
              null
        )
        .map(
          (
            result
          ) =>
            result.year as number
        );

    if (
      years.length >
      0
    ) {
      values[
        kind
      ] =
        Math.min(
          ...years
        );
    }
  }

  return values;
}

function applyFranchiseRanking(
  results:
    UnifiedSearchResult[]
) {
  const groups =
    new Map<
      SearchKind,
      UnifiedSearchResult[]
    >();

  for (
    const result of
    results
  ) {
    const current =
      groups.get(
        result.kind
      ) ??
      [];

    current.push(
      result
    );

    groups.set(
      result.kind,
      current
    );
  }

  const boosts =
    new Map<
      SearchKind,
      number
    >();

  for (
    const kind of
    [
      "game",
      "movie",
      "series",
      "book",
    ] as SearchKind[]
  ) {
    boosts.set(
      kind,
      getKindBoost(
        groups.get(
          kind
        ) ??
          []
      )
    );
  }

  const originYears =
    getOriginYears(
      results
    );

  const knownYears =
    Object.values(
      originYears
    );

  if (
    knownYears.length >
    0
  ) {
    const earliest =
      Math.min(
        ...knownYears
      );

    for (
      const kind of
      [
        "game",
        "movie",
        "series",
        "book",
      ] as SearchKind[]
    ) {
      const year =
        originYears[
          kind
        ];

      if (
        year ===
        undefined
      ) {
        continue;
      }

      const difference =
        year -
        earliest;

      let bonus =
        0;

      if (
        difference <=
        1
      ) {
        bonus =
          22;
      } else if (
        difference <=
        4
      ) {
        bonus =
          12;
      } else if (
        difference <=
        10
      ) {
        bonus =
          5;
      }

      boosts.set(
        kind,
        (
          boosts.get(
            kind
          ) ??
          0
        ) +
          bonus
      );
    }
  }

  return results.map(
    (
      result
    ) => ({
      ...result,

      score:
        result.baseScore +
        (
          boosts.get(
            result.kind
          ) ??
          0
        ),
    })
  );
}

/*
 * SEARCH
 */

export async function searchAllMedia(
  query:
    string
) {
  const cleanQuery =
    getProviderQuery(
      query
    );

  if (
    !cleanQuery
  ) {
    return [];
  }

  const [
    tmdb,
    books,
    games,
  ] =
    await Promise.allSettled(
      [
        searchTMDB(
          cleanQuery
        ),

        searchBooks(
          cleanQuery
        ),

        searchIGDBGames(
          cleanQuery
        ),
      ]
    );

  const results:
    UnifiedSearchResult[] =
    [];

  if (
    games.status ===
    "fulfilled"
  ) {
    for (
      const game of
      games.value
    ) {
      results.push(
        makeGameResult(
          game,
          query
        )
      );
    }
  }

  if (
    tmdb.status ===
    "fulfilled"
  ) {
    const items =
      (
        tmdb.value
          .results ??
        []
      ) as TMDBResult[];

    for (
      const item of
      items
    ) {
      if (
        item.media_type !==
          "movie" &&
        item.media_type !==
          "tv"
      ) {
        continue;
      }

      results.push(
        makeTMDBResult(
          item,
          query
        )
      );
    }
  }

  if (
    books.status ===
    "fulfilled"
  ) {
    for (
      const book of
      books.value.docs
    ) {
      if (
        !book.key?.startsWith(
          "/works/"
        )
      ) {
        continue;
      }

      results.push(
        makeBookResult(
          book,
          query
        )
      );
    }
  }

  const deduplicated =
    deduplicateResults(
      results
    );

  return applyFranchiseRanking(
    deduplicated
  ).sort(
    (
      first,
      second
    ) =>
      second.score -
      first.score
  );
}