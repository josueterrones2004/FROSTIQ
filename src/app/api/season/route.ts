import { NextResponse } from "next/server";

import { getSeasonDetails } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const seriesId = searchParams.get("seriesId");
  const seasonNumber = searchParams.get("seasonNumber");

  if (
    !seriesId ||
    !seasonNumber ||
    !/^\d+$/.test(seriesId) ||
    !/^\d+$/.test(seasonNumber) ||
    Number(seriesId) <= 0
  ) {
    return NextResponse.json(
      {
        error: "Identificador de serie o temporada inválido.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const data = await getSeasonDetails(
      seriesId,
      seasonNumber,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `Error al cargar la temporada ${seasonNumber} de la serie ${seriesId}:`,
      error,
    );

    return NextResponse.json(
      {
        error: "No se pudo cargar la temporada desde TMDB.",
      },
      {
        status: 502,
      },
    );
  }
}