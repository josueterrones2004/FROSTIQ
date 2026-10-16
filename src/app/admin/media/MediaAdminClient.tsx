"use client";

import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Upload,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

type MediaType =
  | "movie"
  | "series"
  | "game"
  | "book";

export type MediaAdminInitialSelection = {
  key: string;
  title: string;
  kind: MediaType;

  image:
    | string
    | null;

  year:
    | number
    | null;

  href: string;

  subtitle?:
    string;
};

type SearchResult =
  MediaAdminInitialSelection;

type AssetOption = {
  url: string;

  type:
    | "poster"
    | "backdrop";

  label: string;

  width?:
    number;

  height?:
    number;
};

type ApiOverride = {
  poster_url:
    | string
    | null;

  backdrop_url:
    | string
    | null;

  poster_position_x:
    number;

  poster_position_y:
    number;

  poster_zoom:
    number;

  backdrop_position_x:
    number;

  backdrop_position_y:
    number;

  backdrop_zoom:
    number;
};

type AssetResponse = {
  automaticPoster:
    | string
    | null;

  automaticBackdrop:
    | string
    | null;

  currentPoster?:
    | string
    | null;

  currentBackdrop?:
    | string
    | null;

  assets:
    AssetOption[];

  override:
    | ApiOverride
    | null;
};

const MAX_FILE_SIZE =
  10 *
  1024 *
  1024;

const ACCEPTED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

function getExternalId(
  result:
    SearchResult
) {
  return result.key
    .split(
      ":"
    )
    .slice(
      1
    )
    .join(
      ":"
    );
}

function getExtension(
  file:
    File
) {
  if (
    file.type ===
    "image/png"
  ) {
    return "png";
  }

  if (
    file.type ===
    "image/webp"
  ) {
    return "webp";
  }

  return "jpg";
}

function getKindLabel(
  kind:
    MediaType
) {
  if (
    kind ===
    "movie"
  ) {
    return "Película";
  }

  if (
    kind ===
    "series"
  ) {
    return "Serie";
  }

  if (
    kind ===
    "game"
  ) {
    return "Juego";
  }

  return "Libro";
}

export default function MediaAdminClient({
  initialSelection = null,
}: {
  initialSelection?:
    MediaAdminInitialSelection |
    null;
}) {
  const [
    supabase,
  ] =
    useState(
      () =>
        createClient()
    );

  const bannerInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const posterInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const initialSelectionLoaded =
    useRef(
      false
    );

  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );

  const [
    searching,
    setSearching,
  ] =
    useState(
      false
    );

  const [
    results,
    setResults,
  ] =
    useState<
      SearchResult[]
    >(
      []
    );

  const [
    selected,
    setSelected,
  ] =
    useState<
      SearchResult |
      null
    >(
      null
    );

  const [
    loadingMedia,
    setLoadingMedia,
  ] =
    useState(
      false
    );

  const [
    assets,
    setAssets,
  ] =
    useState<
      AssetOption[]
    >(
      []
    );

  const [
    automaticBackdrop,
    setAutomaticBackdrop,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    automaticPoster,
    setAutomaticPoster,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    backdropUrl,
    setBackdropUrl,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    posterUrl,
    setPosterUrl,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    backdropPositionX,
    setBackdropPositionX,
  ] =
    useState(
      50
    );

  const [
    backdropPositionY,
    setBackdropPositionY,
  ] =
    useState(
      50
    );

  const [
    backdropZoom,
    setBackdropZoom,
  ] =
    useState(
      1
    );

  const [
    posterPositionX,
    setPosterPositionX,
  ] =
    useState(
      50
    );

  const [
    posterPositionY,
    setPosterPositionY,
  ] =
    useState(
      50
    );

  const [
    posterZoom,
    setPosterZoom,
  ] =
    useState(
      1
    );

  const [
    uploading,
    setUploading,
  ] =
    useState<
      "backdrop"
      | "poster"
      | null
    >(
      null
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );

  /*
   * La imagen visible es:
   *
   * override -> automática
   *
   * No usamos selected.image como fallback aquí,
   * porque la búsqueda puede mostrar el override
   * actual y confundirlo con la automática.
   */

  const visibleBackdrop =
    backdropUrl ??
    automaticBackdrop;

  const visiblePoster =
    posterUrl ??
    automaticPoster;

  /*
   * Evitamos repetir la imagen automática
   * dentro de las alternativas.
   */

  const backdropAssets =
    assets.filter(
      (
        asset
      ) =>
        asset.type ===
          "backdrop" &&
        asset.url !==
          automaticBackdrop
    );

  const posterAssets =
    assets.filter(
      (
        asset
      ) =>
        asset.type ===
          "poster" &&
        asset.url !==
          automaticPoster
    );

  /*
   * SEARCH
   */

  async function searchMedia(
    event:
      FormEvent
  ) {
    event.preventDefault();

    const clean =
      query.trim();

    if (
      clean.length <
      2
    ) {
      return;
    }

    setSearching(
      true
    );

    setResults(
      []
    );

    setSelected(
      null
    );

    setMessage(
      ""
    );

    try {
      const [
        games,
        screen,
        books,
      ] =
        await Promise.all([
          fetch(
            `/api/search-suggestions?q=${encodeURIComponent(
              clean
            )}&source=games`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/search-suggestions?q=${encodeURIComponent(
              clean
            )}&source=screen`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/search-suggestions?q=${encodeURIComponent(
              clean
            )}&source=books`,
            {
              cache:
                "no-store",
            }
          ),
        ]);

      const [
        gamesData,
        screenData,
        booksData,
      ] =
        await Promise.all([
          games.json(),
          screen.json(),
          books.json(),
        ]);

      /*
       * search-suggestions ya devuelve
       * poster_url personalizado si existe.
       */

      setResults([
        ...(
          screenData.results ??
          []
        ),

        ...(
          gamesData.results ??
          []
        ),

        ...(
          booksData.results ??
          []
        ),
      ]);
    } catch (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        "Error buscando contenido."
      );
    } finally {
      setSearching(
        false
      );
    }
  }

  /*
   * SELECT
   */

  const chooseResult =
    useCallback(
      async (
        result:
          SearchResult
      ) => {
        setSelected(
          result
        );

        setLoadingMedia(
          true
        );

        setMessage(
          ""
        );

        setAssets(
          []
        );

        const externalId =
          getExternalId(
            result
          );

        try {
          const response =
            await fetch(
              `/api/admin/media-assets?kind=${result.kind}&id=${encodeURIComponent(
                externalId
              )}`,
              {
                cache:
                  "no-store",
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const data =
            (
              await response.json()
            ) as AssetResponse;

          setAssets(
            data.assets ??
            []
          );

          setAutomaticBackdrop(
            data.automaticBackdrop ??
            null
          );

          setAutomaticPoster(
            data.automaticPoster ??
            null
          );

          /*
           * Cargamos exactamente el override
           * que actualmente utiliza la app.
           */

          setBackdropUrl(
            data.override
              ?.backdrop_url ??
            null
          );

          setPosterUrl(
            data.override
              ?.poster_url ??
            null
          );

          setBackdropPositionX(
            Number(
              data.override
                ?.backdrop_position_x ??
              50
            )
          );

          setBackdropPositionY(
            Number(
              data.override
                ?.backdrop_position_y ??
              50
            )
          );

          setBackdropZoom(
            Number(
              data.override
                ?.backdrop_zoom ??
              1
            )
          );

          setPosterPositionX(
            Number(
              data.override
                ?.poster_position_x ??
              50
            )
          );

          setPosterPositionY(
            Number(
              data.override
                ?.poster_position_y ??
              50
            )
          );

          setPosterZoom(
            Number(
              data.override
                ?.poster_zoom ??
              1
            )
          );
        } catch (
          error
        ) {
          console.error(
            error
          );

          setMessage(
            "No se pudieron cargar las imágenes."
          );
        } finally {
          setLoadingMedia(
            false
          );
        }
      },
      []
    );

  /*
   * Si llegamos desde el botón DEV de una ficha,
   * abrimos directamente ese medio.
   */

  useEffect(
    () => {
      if (
        !initialSelection ||
        initialSelectionLoaded.current
      ) {
        return;
      }

      initialSelectionLoaded.current =
        true;

      const timeout =
        window.setTimeout(
          () => {
            setQuery(
              initialSelection.title
            );

            void chooseResult(
              initialSelection
            );
          },
          0
        );

      return () =>
        window.clearTimeout(
          timeout
        );
    },
    [
      initialSelection,
      chooseResult,
    ]
  );

  /*
   * UPLOAD
   */

  async function uploadImage(
    file:
      File,

    type:
      | "backdrop"
      | "poster"
  ) {
    if (
      !selected
    ) {
      return;
    }

    if (
      !ACCEPTED_TYPES.has(
        file.type
      )
    ) {
      setMessage(
        "Solo se permiten JPG, PNG y WebP."
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setMessage(
        "La imagen no puede superar los 10 MB."
      );

      return;
    }

    setUploading(
      type
    );

    setMessage(
      ""
    );

    const externalId =
      getExternalId(
        selected
      );

    const extension =
      getExtension(
        file
      );

    const path =
      `${selected.kind}/${externalId}/${type}-${Date.now()}.${extension}`;

    const {
      error,
    } =
      await supabase.storage
        .from(
          "media-artwork"
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,
          }
        );

    if (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        `Error: ${error.message}`
      );

      setUploading(
        null
      );

      return;
    }

    const {
      data,
    } =
      supabase.storage
        .from(
          "media-artwork"
        )
        .getPublicUrl(
          path
        );

    if (
      type ===
      "backdrop"
    ) {
      setBackdropUrl(
        data.publicUrl
      );

      setBackdropPositionX(
        50
      );

      setBackdropPositionY(
        50
      );

      setBackdropZoom(
        1
      );
    } else {
      setPosterUrl(
        data.publicUrl
      );

      setPosterPositionX(
        50
      );

      setPosterPositionY(
        50
      );

      setPosterZoom(
        1
      );
    }

    setMessage(
      "Imagen subida. Guarda los cambios para aplicarla."
    );

    setUploading(
      null
    );
  }

  function handleUpload(
    event:
      ChangeEvent<HTMLInputElement>,

    type:
      | "backdrop"
      | "poster"
  ) {
    const file =
      event.target.files?.[
        0
      ];

    event.target.value =
      "";

    if (
      !file
    ) {
      return;
    }

    void uploadImage(
      file,
      type
    );
  }

  /*
   * SAVE
   */

  async function saveOverride() {
    if (
      !selected
    ) {
      return;
    }

    setSaving(
      true
    );

    setMessage(
      ""
    );

    const externalId =
      getExternalId(
        selected
      );

    const {
      error,
    } =
      await supabase
        .from(
          "media_artwork_overrides"
        )
        .upsert(
          {
            media_type:
              selected.kind,

            external_id:
              externalId,

            title:
              selected.title,

            backdrop_url:
              backdropUrl,

            poster_url:
              posterUrl,

            backdrop_position_x:
              backdropPositionX,

            backdrop_position_y:
              backdropPositionY,

            backdrop_zoom:
              backdropZoom,

            poster_position_x:
              posterPositionX,

            poster_position_y:
              posterPositionY,

            poster_zoom:
              posterZoom,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "media_type,external_id",
          }
        );

    if (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        `Error: ${error.message}`
      );

      setSaving(
        false
      );

      return;
    }

    /*
     * Actualizamos inmediatamente la miniatura
     * del resultado actual.
     */

    const resolvedPoster =
      posterUrl ??
      automaticPoster;

    setResults(
      (
        current
      ) =>
        current.map(
          (
            result
          ) =>
            result.key ===
            selected.key
              ? {
                  ...result,

                  image:
                    resolvedPoster,
                }
              : result
        )
    );

    setSelected(
      (
        current
      ) =>
        current
          ? {
              ...current,

              image:
                resolvedPoster,
            }
          : current
    );

    setMessage(
      "Cambios guardados."
    );

    setSaving(
      false
    );
  }

  /*
   * RESTORE
   */

  async function restoreAutomatic() {
    if (
      !selected
    ) {
      return;
    }

    setSaving(
      true
    );

    setMessage(
      ""
    );

    const externalId =
      getExternalId(
        selected
      );

    const {
      error,
    } =
      await supabase
        .from(
          "media_artwork_overrides"
        )
        .delete()
        .eq(
          "media_type",
          selected.kind
        )
        .eq(
          "external_id",
          externalId
        );

    if (
      error
    ) {
      setMessage(
        `Error: ${error.message}`
      );

      setSaving(
        false
      );

      return;
    }

    setBackdropUrl(
      null
    );

    setPosterUrl(
      null
    );

    setBackdropPositionX(
      50
    );

    setBackdropPositionY(
      50
    );

    setBackdropZoom(
      1
    );

    setPosterPositionX(
      50
    );

    setPosterPositionY(
      50
    );

    setPosterZoom(
      1
    );

    setResults(
      (
        current
      ) =>
        current.map(
          (
            result
          ) =>
            result.key ===
            selected.key
              ? {
                  ...result,

                  image:
                    automaticPoster,
                }
              : result
        )
    );

    setSelected(
      (
        current
      ) =>
        current
          ? {
              ...current,

              image:
                automaticPoster,
            }
          : current
    );

    setMessage(
      "Imagen automática restaurada."
    );

    setSaving(
      false
    );
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:gap-8">
      {/* ======================================
          SEARCH
      ====================================== */}

      <aside
        className={`min-w-0 xl:sticky xl:top-[94px] xl:self-start ${
          selected
            ? "hidden xl:block"
            : "block"
        }`}
      >
        <form
          onSubmit={
            searchMedia
          }
          className="relative"
        >
          <Search
            size={
              17
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
          />

          <input
            value={
              query
            }
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Buscar título..."
            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-10 pr-4 text-sm text-zinc-200 outline-none transition focus:border-fuchsia-500"
          />
        </form>

        {searching && (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2
              size={
                15
              }
              className="animate-spin"
            />

            Buscando...
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          {results.map(
            (
              result
            ) => (
              <button
                key={
                  result.key
                }
                type="button"
                onClick={() => {
                  void chooseResult(
                    result
                  );
                }}
                className={`flex w-full min-w-0 gap-3 rounded-xl border p-2 text-left transition ${
                  selected?.key ===
                  result.key
                    ? "border-fuchsia-500/40 bg-fuchsia-500/5"
                    : "border-transparent hover:border-zinc-800 hover:bg-zinc-900"
                }`}
              >
                <div className="relative h-[68px] w-[46px] shrink-0 overflow-hidden rounded-md bg-zinc-900">
                  {result.image ? (
                    <Image
                      src={
                        result.image
                      }
                      alt=""
                      fill
                      unoptimized
                      sizes="46px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[9px] text-zinc-700">
                      —
                    </div>
                  )}
                </div>

                <div className="min-w-0 py-1">
                  <p className="line-clamp-2 text-sm font-medium leading-5 text-zinc-200">
                    {
                      result.title
                    }
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {getKindLabel(
                      result.kind
                    )}

                    {result.year
                      ? ` · ${result.year}`
                      : ""}
                  </p>
                </div>
              </button>
            )
          )}
        </div>
      </aside>

      {/* ======================================
          EMPTY
      ====================================== */}

      {!selected ? (
        <div className="hidden min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-zinc-800 px-6 text-center text-sm text-zinc-700 xl:flex">
          Busca y selecciona un título.
        </div>
      ) : loadingMedia ? (
        <div className="flex min-h-[300px] items-center justify-center sm:min-h-[500px]">
          <Loader2
            size={
              26
            }
            className="animate-spin text-fuchsia-400"
          />
        </div>
      ) : (
        <section className="min-w-0">
          {/* ======================================
              SELECTED HEADER
          ====================================== */}

          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  setSelected(
                    null
                  );

                  setMessage(
                    ""
                  );
                }}
                className="mb-3 inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200 xl:hidden"
              >
                <ArrowLeft
                  size={
                    15
                  }
                />

                Cambiar título
              </button>

              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-fuchsia-400 sm:text-xs">
                {getKindLabel(
                  selected.kind
                )}
              </p>

              <h2 className="mt-1 line-clamp-2 text-xl font-bold leading-tight text-zinc-100 sm:text-2xl">
                {
                  selected.title
                }
              </h2>
            </div>

            <Link
              href={
                selected.href
              }
              target="_blank"
              className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-800 px-2.5 text-xs text-zinc-500 transition hover:text-white sm:h-10 sm:px-3 sm:text-sm"
            >
              <ExternalLink
                size={
                  14
                }
              />

              <span className="hidden sm:inline">
                Abrir ficha
              </span>
            </Link>
          </div>

          {/* ======================================
              BANNER
          ====================================== */}

          <div className="mt-7 sm:mt-8">
            <div>
              <h3 className="font-semibold text-zinc-200">
                Banner
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Se muestra el banner que está usando actualmente Media Tracker.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setBackdropUrl(
                    null
                  );

                  setBackdropPositionX(
                    50
                  );

                  setBackdropPositionY(
                    50
                  );

                  setBackdropZoom(
                    1
                  );
                }}
                className="min-h-10 rounded-xl border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                Usar automático
              </button>

              <button
                type="button"
                disabled={
                  uploading ===
                  "backdrop"
                }
                onClick={() =>
                  bannerInputRef.current?.click()
                }
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
              >
                {uploading ===
                "backdrop" ? (
                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Upload
                    size={
                      14
                    }
                  />
                )}

                Subir imagen
              </button>
            </div>

            <input
              ref={
                bannerInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(
                event
              ) =>
                handleUpload(
                  event,
                  "backdrop"
                )
              }
            />

            <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 sm:aspect-[16/7] sm:rounded-2xl lg:aspect-[16/6]">
              {visibleBackdrop ? (
                <Image
                  src={
                    visibleBackdrop
                  }
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  style={{
                    objectPosition:
                      `${backdropPositionX}% ${backdropPositionY}%`,

                    transform:
                      `scale(${backdropZoom})`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs text-zinc-700 sm:text-sm">
                  No hay banner disponible.
                </div>
              )}
            </div>

            <CurrentStatus
              custom={
                backdropUrl !==
                null
              }
            />

            <div className="mt-4 grid gap-5 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 sm:rounded-2xl sm:p-5 md:grid-cols-3">
              <RangeControl
                label="Posición X"
                value={
                  backdropPositionX
                }
                min={
                  0
                }
                max={
                  100
                }
                step={
                  1
                }
                suffix="%"
                onChange={
                  setBackdropPositionX
                }
              />

              <RangeControl
                label="Posición Y"
                value={
                  backdropPositionY
                }
                min={
                  0
                }
                max={
                  100
                }
                step={
                  1
                }
                suffix="%"
                onChange={
                  setBackdropPositionY
                }
              />

              <RangeControl
                label="Zoom"
                value={
                  backdropZoom
                }
                min={
                  1
                }
                max={
                  2
                }
                step={
                  0.01
                }
                suffix="×"
                onChange={
                  setBackdropZoom
                }
              />
            </div>

            {(automaticBackdrop ||
              backdropAssets.length >
                0) && (
              <div className="mt-5 min-w-0">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 sm:text-xs">
                  Imágenes disponibles
                </p>

                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
                  {automaticBackdrop && (
                    <ArtworkButton
                      url={
                        automaticBackdrop
                      }
                      label="Automática"
                      active={
                        backdropUrl ===
                        null
                      }
                      onClick={() => {
                        setBackdropUrl(
                          null
                        );

                        setBackdropPositionX(
                          50
                        );

                        setBackdropPositionY(
                          50
                        );

                        setBackdropZoom(
                          1
                        );
                      }}
                    />
                  )}

                  {backdropAssets.map(
                    (
                      asset
                    ) => (
                      <ArtworkButton
                        key={
                          asset.url
                        }
                        url={
                          asset.url
                        }
                        label={
                          asset.label
                        }
                        active={
                          backdropUrl ===
                          asset.url
                        }
                        onClick={() => {
                          setBackdropUrl(
                            asset.url
                          );

                          if (
                            asset.label !==
                            "Actual"
                          ) {
                            setBackdropPositionX(
                              50
                            );

                            setBackdropPositionY(
                              50
                            );

                            setBackdropZoom(
                              1
                            );
                          }
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================
              POSTER
          ====================================== */}

          <div className="mt-9 border-t border-zinc-800 pt-7 sm:mt-10 sm:pt-8">
            <div>
              <h3 className="font-semibold text-zinc-200">
                Portada
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Se muestra la portada que está usando actualmente Media Tracker.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setPosterUrl(
                    null
                  );

                  setPosterPositionX(
                    50
                  );

                  setPosterPositionY(
                    50
                  );

                  setPosterZoom(
                    1
                  );
                }}
                className="min-h-10 rounded-xl border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                Usar automática
              </button>

              <button
                type="button"
                disabled={
                  uploading ===
                  "poster"
                }
                onClick={() =>
                  posterInputRef.current?.click()
                }
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {uploading ===
                "poster" ? (
                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                ) : (
                  <ImagePlus
                    size={
                      14
                    }
                  />
                )}

                Subir imagen
              </button>
            </div>

            <input
              ref={
                posterInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(
                event
              ) =>
                handleUpload(
                  event,
                  "poster"
                )
              }
            />

            <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <div>
                <div className="relative mx-auto aspect-[2/3] w-[min(62vw,210px)] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 sm:w-[210px] lg:mx-0 lg:w-[220px]">
                  {visiblePoster ? (
                    <Image
                      src={
                        visiblePoster
                      }
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      style={{
                        objectPosition:
                          `${posterPositionX}% ${posterPositionY}%`,

                        transform:
                          `scale(${posterZoom})`,
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-700">
                      Sin portada
                    </div>
                  )}
                </div>

                <CurrentStatus
                  custom={
                    posterUrl !==
                    null
                  }
                  centered
                />
              </div>

              <div className="min-w-0">
                <div className="grid gap-5 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 sm:rounded-2xl sm:p-5 md:grid-cols-3">
                  <RangeControl
                    label="Posición X"
                    value={
                      posterPositionX
                    }
                    min={
                      0
                    }
                    max={
                      100
                    }
                    step={
                      1
                    }
                    suffix="%"
                    onChange={
                      setPosterPositionX
                    }
                  />

                  <RangeControl
                    label="Posición Y"
                    value={
                      posterPositionY
                    }
                    min={
                      0
                    }
                    max={
                      100
                    }
                    step={
                      1
                    }
                    suffix="%"
                    onChange={
                      setPosterPositionY
                    }
                  />

                  <RangeControl
                    label="Zoom"
                    value={
                      posterZoom
                    }
                    min={
                      1
                    }
                    max={
                      2
                    }
                    step={
                      0.01
                    }
                    suffix="×"
                    onChange={
                      setPosterZoom
                    }
                  />
                </div>

                {(automaticPoster ||
                  posterAssets.length >
                    0) && (
                  <div className="mt-5 min-w-0">
                    <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 sm:text-xs">
                      Portadas disponibles
                    </p>

                    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
                      {automaticPoster && (
                        <PosterButton
                          url={
                            automaticPoster
                          }
                          label="Automática"
                          active={
                            posterUrl ===
                            null
                          }
                          onClick={() => {
                            setPosterUrl(
                              null
                            );

                            setPosterPositionX(
                              50
                            );

                            setPosterPositionY(
                              50
                            );

                            setPosterZoom(
                              1
                            );
                          }}
                        />
                      )}

                      {posterAssets.map(
                        (
                          asset
                        ) => (
                          <PosterButton
                            key={
                              asset.url
                            }
                            url={
                              asset.url
                            }
                            label={
                              asset.label
                            }
                            active={
                              posterUrl ===
                              asset.url
                            }
                            onClick={() => {
                              setPosterUrl(
                                asset.url
                              );

                              if (
                                asset.label !==
                                "Actual"
                              ) {
                                setPosterPositionX(
                                  50
                                );

                                setPosterPositionY(
                                  50
                                );

                                setPosterZoom(
                                  1
                                );
                              }
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================
              SAVE
          ====================================== */}

          <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 xl:static xl:mx-0 xl:mt-10 xl:flex xl:flex-wrap xl:items-center xl:gap-3 xl:bg-transparent xl:px-0 xl:pt-6 xl:backdrop-blur-none">
            <div className="grid grid-cols-2 gap-2 xl:flex">
              <button
                type="button"
                onClick={() => {
                  void restoreAutomatic();
                }}
                disabled={
                  saving
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50 sm:text-sm"
              >
                <RotateCcw
                  size={
                    15
                  }
                />

                Restaurar
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  uploading !==
                    null
                }
                onClick={() => {
                  void saveOverride();
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-3 text-xs font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50 sm:text-sm xl:px-5"
              >
                {saving ? (
                  <Loader2
                    size={
                      16
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Save
                    size={
                      16
                    }
                  />
                )}

                Guardar
              </button>
            </div>

            {message && (
              <p
                className={`mt-2 text-xs xl:mt-0 xl:text-sm ${
                  message.startsWith(
                    "Error:"
                  )
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {
                  message
                }
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function CurrentStatus({
  custom,
  centered = false,
}: {
  custom:
    boolean;

  centered?:
    boolean;
}) {
  return (
    <p
      className={`mt-2 text-[10px] font-medium ${
        centered
          ? "text-center lg:text-left"
          : ""
      } ${
        custom
          ? "text-fuchsia-400"
          : "text-zinc-600"
      }`}
    >
      {custom
        ? "Usando imagen personalizada"
        : "Usando imagen automática"}
    </p>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label:
    string;

  value:
    number;

  min:
    number;

  max:
    number;

  step:
    number;

  suffix:
    string;

  onChange:
    (
      value:
        number
    ) => void;
}) {
  return (
    <label className="block min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-500">
          {
            label
          }
        </span>

        <span className="font-mono text-xs text-zinc-400">
          {Number.isInteger(
            value
          )
            ? value
            : value.toFixed(
                2
              )}
          {
            suffix
          }
        </span>
      </div>

      <input
        type="range"
        min={
          min
        }
        max={
          max
        }
        step={
          step
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className="mt-3 h-6 w-full accent-fuchsia-500"
      />
    </label>
  );
}

function ArtworkButton({
  url,
  label,
  active,
  onClick,
}: {
  url:
    string;

  label:
    string;

  active:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`w-[150px] shrink-0 overflow-hidden rounded-xl border text-left transition sm:w-44 ${
        active
          ? "border-fuchsia-400"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <div className="relative aspect-video bg-zinc-900">
        <Image
          src={
            url
          }
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <p
        className={`truncate bg-zinc-950 px-2 py-2 text-[10px] sm:text-[11px] ${
          active
            ? "text-fuchsia-300"
            : "text-zinc-500"
        }`}
      >
        {
          label
        }
      </p>
    </button>
  );
}

function PosterButton({
  url,
  label,
  active,
  onClick,
}: {
  url:
    string;

  label:
    string;

  active:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="w-[86px] shrink-0 text-left sm:w-24"
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden rounded-lg border transition ${
          active
            ? "border-fuchsia-400"
            : "border-zinc-800 hover:border-zinc-600"
        }`}
      >
        <Image
          src={
            url
          }
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <p
        className={`mt-1.5 truncate text-[9px] sm:text-[10px] ${
          active
            ? "text-fuchsia-300"
            : "text-zinc-600"
        }`}
      >
        {
          label
        }
      </p>
    </button>
  );
}