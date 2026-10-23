import { NextResponse } from "next/server";
import { getSeriesDetails } from "@/lib/tmdb";

type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string | null;
};

type SeriesDetails = {
  id: number;
  name: string;
  poster_path?: string | null;
  seasons?: Season[];
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const { id } = await params;

  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return NextResponse.json(
      { error: "Identificador de serie inválido." },
      { status: 400 },
    );
  }

  try {
    const series = (await getSeriesDetails(
      id,
    )) as SeriesDetails;

    const seasons = (series.seasons ?? [])
      .filter(
        (season) =>
          season.season_number > 0 &&
          season.episode_count > 0,
      )
      .sort(
        (a, b) =>
          a.season_number - b.season_number,
      );

    return NextResponse.json({
      seriesId: series.id,
      title: series.name,
      posterUrl: series.poster_path
        ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
        : null,
      seasons,
    });
  } catch (error) {
    console.error(
      "Error loading series seasons:",
      error,
    );

    return NextResponse.json(
      {
        error: "No se pudieron cargar las temporadas.",
      },
      { status: 502 },
    );
  }
}