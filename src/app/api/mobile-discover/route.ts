import {
  NextResponse,
} from "next/server";

import {
  getDiscoverItems,
  type DiscoverItem,
  type DiscoverKind,
} from "@/lib/discover";

const kinds:
  DiscoverKind[] = [
    "movie",
    "series",
    "game",
    "book",
  ];

function interleaveDiscoverItems(
  items:
    DiscoverItem[],

  limit:
    number
) {
  const groups =
    new Map<
      DiscoverKind,
      DiscoverItem[]
    >();

  for (
    const kind of
    kinds
  ) {
    groups.set(
      kind,
      items.filter(
        (
          item
        ) =>
          item.kind ===
          kind
      )
    );
  }

  const result:
    DiscoverItem[] =
    [];

  let index =
    0;

  while (
    result.length <
    limit
  ) {
    let added =
      false;

    for (
      const kind of
      kinds
    ) {
      const item =
        groups.get(
          kind
        )?.[
          index
        ];

      if (
        !item
      ) {
        continue;
      }

      result.push(
        item
      );

      added =
        true;

      if (
        result.length >=
        limit
      ) {
        break;
      }
    }

    if (
      !added
    ) {
      break;
    }

    index +=
      1;
  }

  return result;
}

export async function GET() {
  try {
    const items =
      await getDiscoverItems();

    const results =
      interleaveDiscoverItems(
        items,
        24
      ).map(
        (
          item
        ) => ({
          key:
            item.key,

          kind:
            item.kind,

          title:
            item.title,

          image:
            item.image,

          imagePositionX:
            item.imagePositionX,

          imagePositionY:
            item.imagePositionY,

          imageZoom:
            item.imageZoom,

          year:
            item.year,

          href:
            item.href,
        })
      );

    return NextResponse.json(
      {
        results,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Could not load mobile discover:",
      error
    );

    return NextResponse.json(
      {
        results:
          [],
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}