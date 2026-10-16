"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ProfileMediaHeader, {
  CroppedProfileImage,
  type ProfileCrop,
} from "@/app/profile/ProfileMediaHeader";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  createClient,
} from "@/lib/supabase/client";

import ImageCropModal, {
  type SavedCrop,
} from "./ImageCropModal";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type ActivityType =
  | "ADDED_PENDING"
  | "STARTED"
  | "EPISODE_WATCHED"
  | "COMPLETED"
  | "REVIEWED";

type MediaTarget =
  | "avatar"
  | "banner";

type ProfileSection = {
  section_key:
    SectionKey;

  visible:
    boolean;

  position:
    number;
};

type Favorite = {
  id:
    string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  poster_position_x?:
    number;

  poster_position_y?:
    number;

  poster_zoom?:
    number;

  position:
    number;
};

type ActivityEvent = {
  id:
    string;

  activity_type:
    ActivityType;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  poster_position_x?:
    number;

  poster_position_y?:
    number;

  poster_zoom?:
    number;

  created_at:
    string;
};

type SearchResult = {
  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  year:
    | string
    | null;

  subtitle:
    | string
    | null;
};

interface ProfileCustomizeEditorProps {
  userId:
    string;

  initialProfile: {
    username:
      | string
      | null;

    displayName:
      | string
      | null;

    bio:
      | string
      | null;

    avatarUrl:
      | string
      | null;

    bannerUrl:
      | string
      | null;

    avatarCrop:
      | ProfileCrop
      | null;

    bannerCrop:
      | ProfileCrop
      | null;
  };

  initialSections:
    ProfileSection[];

  initialFavorites:
    Favorite[];

  recentActivity:
    ActivityEvent[];
}

const USERNAME_PATTERN =
  /^[A-Za-z0-9_]{3,20}$/;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const AVATAR_MAX_SIZE =
  4 *
  1024 *
  1024;

const BANNER_MAX_SIZE =
  8 *
  1024 *
  1024;

const SECTION_DATA: Record<
  SectionKey,
  {
    title:
      string;

    description:
      string;

    mediaType?:
      MediaType;
  }
> = {
  ACTIVITY: {
    title:
      "Actividad reciente",

    description:
      "Tus últimas actividades.",
  },

  FAVORITE_MOVIES: {
    title:
      "Películas favoritas",

    description:
      "Hasta 6 películas.",

    mediaType:
      "MOVIE",
  },

  FAVORITE_SERIES: {
    title:
      "Series favoritas",

    description:
      "Hasta 6 series.",

    mediaType:
      "SERIES",
  },

  FAVORITE_BOOKS: {
    title:
      "Libros favoritos",

    description:
      "Hasta 6 libros.",

    mediaType:
      "BOOK",
  },

  FAVORITE_GAMES: {
    title:
      "Juegos favoritos",

    description:
      "Hasta 6 juegos.",

    mediaType:
      "GAME",
  },
};

function getExtension(
  file:
    File
) {
  const extension =
    file.name
      .split(
        "."
      )
      .pop()
      ?.toLowerCase();

  if (
    extension
  ) {
    return extension;
  }

  const extensions: Record<
    string,
    string
  > = {
    "image/jpeg":
      "jpg",

    "image/png":
      "png",

    "image/webp":
      "webp",

    "image/gif":
      "gif",
  };

  return (
    extensions[
      file.type
    ] ??
    "img"
  );
}

function getStoragePathFromUrl(
  url:
    | string
    | null
) {
  if (!url) {
    return null;
  }

  const marker =
    "/storage/v1/object/public/profile-media/";

  const index =
    url.indexOf(
      marker
    );

  if (
    index ===
    -1
  ) {
    return null;
  }

  return decodeURIComponent(
    url.slice(
      index +
        marker.length
    )
  );
}

function getErrorMessage(
  error:
    unknown
) {
  if (
    typeof error ===
      "object" &&
    error !== null &&
    "message" in
      error &&
    typeof error.message ===
      "string"
  ) {
    return error.message;
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  return "Error desconocido.";
}

export default function ProfileCustomizeEditor({
  userId,
  initialProfile,
  initialSections,
  initialFavorites,
  recentActivity,
}: ProfileCustomizeEditorProps) {
  const router =
    useRouter();

  const [
    supabase,
  ] =
    useState(
      () =>
        createClient()
    );

  const avatarInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const bannerInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    username,
    setUsername,
  ] =
    useState(
      initialProfile.username ??
        ""
    );

  const [
    savedUsername,
    setSavedUsername,
  ] =
    useState(
      initialProfile.username ??
        ""
    );

  const [
    displayName,
    setDisplayName,
  ] =
    useState(
      initialProfile.displayName ??
        ""
    );

  const [
    bio,
    setBio,
  ] =
    useState(
      initialProfile.bio ??
        ""
    );

  const [
    avatarUrl,
    setAvatarUrl,
  ] =
    useState(
      initialProfile.avatarUrl
    );

  const [
    bannerUrl,
    setBannerUrl,
  ] =
    useState(
      initialProfile.bannerUrl
    );

  const [
    avatarPreview,
    setAvatarPreview,
  ] =
    useState(
      initialProfile.avatarUrl
    );

  const [
    bannerPreview,
    setBannerPreview,
  ] =
    useState(
      initialProfile.bannerUrl
    );

  const [
    avatarCrop,
    setAvatarCrop,
  ] =
    useState<
      SavedCrop |
      null
    >(
      initialProfile.avatarCrop
    );

  const [
    bannerCrop,
    setBannerCrop,
  ] =
    useState<
      SavedCrop |
      null
    >(
      initialProfile.bannerCrop
    );

  const [
    avatarFile,
    setAvatarFile,
  ] =
    useState<
      File |
      null
    >(
      null
    );

  const [
    bannerFile,
    setBannerFile,
  ] =
    useState<
      File |
      null
    >(
      null
    );

  const [
    removeBanner,
    setRemoveBanner,
  ] =
    useState(
      false
    );

  const [
    cropTarget,
    setCropTarget,
  ] =
    useState<
      MediaTarget |
      null
    >(
      null
    );

  const [
    cropImage,
    setCropImage,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    pendingFile,
    setPendingFile,
  ] =
    useState<
      File |
      null
    >(
      null
    );

  const [
    sections,
    setSections,
  ] =
    useState(
      () =>
        [...initialSections]
          .sort(
            (
              a,
              b
            ) =>
              a.position -
              b.position
          )
    );

  const [
    favorites,
    setFavorites,
  ] =
    useState(
      initialFavorites
    );

  const [
    searchSection,
    setSearchSection,
  ] =
    useState<
      SectionKey |
      null
    >(
      null
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<
      SearchResult[]
    >(
      []
    );

  const [
    searching,
    setSearching,
  ] =
    useState(
      false
    );

  const [
    searchError,
    setSearchError,
  ] =
    useState(
      ""
    );

  const [
    dirty,
    setDirty,
  ] =
    useState(
      false
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

  const [
    pendingNavigation,
    setPendingNavigation,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    showLeaveConfirm,
    setShowLeaveConfirm,
  ] =
    useState(
      false
    );

  const activeSearchType =
    searchSection
      ? SECTION_DATA[
          searchSection
        ].mediaType ??
        null
      : null;

  /*
   * WARN ABOUT UNSAVED CHANGES
   *
   * - Navegación interna:
   *   modal personalizado.
   *
   * - Recargar/cerrar pestaña:
   *   diálogo nativo del navegador.
   */

  useEffect(() => {
    function beforeUnload(
      event:
        BeforeUnloadEvent
    ) {
      if (
        !dirty
      ) {
        return;
      }

      event.preventDefault();

      event.returnValue =
        "";
    }

    function interceptLinks(
      event:
        MouseEvent
    ) {
      if (
        !dirty ||
        event.defaultPrevented
      ) {
        return;
      }

      if (
        event.button !==
          0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target =
        event.target;

      if (
        !(target instanceof Element)
      ) {
        return;
      }

      const anchor =
        target.closest(
          "a[href]"
        ) as HTMLAnchorElement | null;

      if (
        !anchor ||
        anchor.target ===
          "_blank" ||
        anchor.hasAttribute(
          "download"
        )
      ) {
        return;
      }

      const destination =
        new URL(
          anchor.href,
          window.location.href
        );

      if (
        destination.origin !==
        window.location.origin
      ) {
        return;
      }

      const current =
        new URL(
          window.location.href
        );

      if (
        destination.pathname ===
          current.pathname &&
        destination.search ===
          current.search &&
        destination.hash ===
          current.hash
      ) {
        return;
      }

      event.preventDefault();

      event.stopPropagation();

      setPendingNavigation(
        `${destination.pathname}${destination.search}${destination.hash}`
      );

      setShowLeaveConfirm(
        true
      );
    }

    window.addEventListener(
      "beforeunload",
      beforeUnload
    );

    document.addEventListener(
      "click",
      interceptLinks,
      true
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        beforeUnload
      );

      document.removeEventListener(
        "click",
        interceptLinks,
        true
      );
    };
  }, [
    dirty,
  ]);

  function cancelLeave() {
    setShowLeaveConfirm(
      false
    );

    setPendingNavigation(
      null
    );
  }

  function confirmLeave() {
    const destination =
      pendingNavigation;

    setShowLeaveConfirm(
      false
    );

    setPendingNavigation(
      null
    );

    setDirty(
      false
    );

    if (
      destination
    ) {
      router.push(
        destination
      );
    }
  }

  /*
   * FAVORITE SEARCH
   */

  useEffect(() => {
    const query =
      search.trim();

    if (
      !activeSearchType ||
      query.length <
        2
    ) {
      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        async () => {
          setSearching(
            true
          );

          setSearchError(
            ""
          );

          try {
            const params =
              new URLSearchParams({
                q:
                  query,

                type:
                  activeSearchType,
              });

            const response =
              await fetch(
                `/api/favorites-search?${params.toString()}`,
                {
                  signal:
                    controller.signal,
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                "No se pudo completar la búsqueda."
              );
            }

            const data =
              await response.json();

            if (
              controller.signal.aborted
            ) {
              return;
            }

            setSearchResults(
              data.results ??
                []
            );
          } catch (
            error
          ) {
            if (
              controller.signal.aborted
            ) {
              return;
            }

            setSearchResults(
              []
            );

            setSearchError(
              error instanceof Error
                ? error.message
                : "No se pudo completar la búsqueda."
            );
          } finally {
            if (
              !controller.signal.aborted
            ) {
              setSearching(
                false
              );
            }
          }
        },
        300
      );

    return () => {
      window.clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [
    search,
    activeSearchType,
  ]);

  const availableResults =
    useMemo(
      () =>
        searchResults.filter(
          (
            result
          ) =>
            !favorites.some(
              (
                favorite
              ) =>
                favorite.media_type ===
                  result.media_type &&
                favorite.external_id ===
                  result.external_id
            )
        ),
      [
        searchResults,
        favorites,
      ]
    );

  function markDirty() {
    setDirty(
      true
    );

    setMessage(
      ""
    );
  }

  function validateImage(
    file:
      File,

    maxSize:
      number
  ) {
    if (
      !ACCEPTED_TYPES.includes(
        file.type
      )
    ) {
      return "Solo se permiten JPG, PNG, WebP y GIF.";
    }

    if (
      file.size >
      maxSize
    ) {
      return `El archivo supera el límite de ${
        maxSize /
        1024 /
        1024
      } MB.`;
    }

    return null;
  }

  function handleImage(
    type:
      MediaTarget,

    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    const maxSize =
      type ===
      "avatar"
        ? AVATAR_MAX_SIZE
        : BANNER_MAX_SIZE;

    const validationError =
      validateImage(
        file,
        maxSize
      );

    if (
      validationError
    ) {
      setMessage(
        validationError
      );

      return;
    }

    const preview =
      URL.createObjectURL(
        file
      );

    setPendingFile(
      file
    );

    setCropTarget(
      type
    );

    setCropImage(
      preview
    );
  }

  function cancelCrop() {
    if (
      pendingFile &&
      cropImage?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        cropImage
      );
    }

    setPendingFile(
      null
    );

    setCropTarget(
      null
    );

    setCropImage(
      null
    );
  }

  function applyCrop(
    crop:
      SavedCrop
  ) {
    if (
      !cropTarget ||
      !cropImage ||
      !pendingFile
    ) {
      return;
    }

    if (
      cropTarget ===
      "avatar"
    ) {
      if (
        avatarPreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }

      setAvatarPreview(
        cropImage
      );

      setAvatarFile(
        pendingFile
      );

      setAvatarCrop(
        crop
      );
    } else {
      if (
        bannerPreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          bannerPreview
        );
      }

      setBannerPreview(
        cropImage
      );

      setBannerFile(
        pendingFile
      );

      setBannerCrop(
        crop
      );

      setRemoveBanner(
        false
      );
    }

    setPendingFile(
      null
    );

    setCropTarget(
      null
    );

    setCropImage(
      null
    );

    markDirty();
  }

  function deleteBanner() {
    if (
      bannerPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        bannerPreview
      );
    }

    setBannerPreview(
      null
    );

    setBannerFile(
      null
    );

    setBannerCrop(
      null
    );

    setRemoveBanner(
      true
    );

    markDirty();
  }

  function moveSection(
    sectionKey:
      SectionKey,

    direction:
      | "up"
      | "down"
  ) {
    setSections(
      (
        current
      ) => {
        const ordered =
          [...current]
            .sort(
              (
                a,
                b
              ) =>
                a.position -
                b.position
            );

        const index =
          ordered.findIndex(
            (
              section
            ) =>
              section.section_key ===
              sectionKey
          );

        if (
          index ===
          -1
        ) {
          return current;
        }

        const targetIndex =
          direction ===
          "up"
            ? index -
              1
            : index +
              1;

        if (
          targetIndex <
            0 ||
          targetIndex >=
            ordered.length
        ) {
          return current;
        }

        [
          ordered[
            index
          ],
          ordered[
            targetIndex
          ],
        ] = [
          ordered[
            targetIndex
          ],
          ordered[
            index
          ],
        ];

        return ordered.map(
          (
            section,
            position
          ) => ({
            ...section,

            position:
              position +
              1,
          })
        );
      }
    );

    markDirty();
  }

  function toggleSection(
    sectionKey:
      SectionKey
  ) {
    setSections(
      (
        current
      ) =>
        current.map(
          (
            section
          ) =>
            section.section_key ===
            sectionKey
              ? {
                  ...section,

                  visible:
                    !section.visible,
                }
              : section
        )
    );

    markDirty();
  }

  function openSearch(
    sectionKey:
      SectionKey
  ) {
    if (
      searchSection ===
      sectionKey
    ) {
      setSearchSection(
        null
      );

      setSearch(
        ""
      );

      setSearchResults(
        []
      );

      return;
    }

    setSearchSection(
      sectionKey
    );

    setSearch(
      ""
    );

    setSearchResults(
      []
    );

    setSearchError(
      ""
    );
  }

  function addFavorite(
    result:
      SearchResult
  ) {
    const currentCategory =
      favorites.filter(
        (
          favorite
        ) =>
          favorite.media_type ===
          result.media_type
      );

    if (
      currentCategory.length >=
      6
    ) {
      setMessage(
        "Solo puedes elegir 6 favoritos por categoría."
      );

      return;
    }

    setFavorites(
      (
        current
      ) => [
        ...current,
        {
          id:
            `temp-${result.media_type}-${result.external_id}`,

          media_type:
            result.media_type,

          external_id:
            result.external_id,

          title:
            result.title,

          cover_url:
            result.cover_url,

          poster_position_x:
            50,

          poster_position_y:
            50,

          poster_zoom:
            1,

          position:
            currentCategory.length +
            1,
        },
      ]
    );

    markDirty();
  }

  function removeFavorite(
    mediaType:
      MediaType,

    externalId:
      string
  ) {
    setFavorites(
      (
        current
      ) => {
        const remaining =
          current.filter(
            (
              favorite
            ) =>
              !(
                favorite.media_type ===
                  mediaType &&
                favorite.external_id ===
                  externalId
              )
          );

        return remaining.map(
          (
            favorite
          ) => {
            if (
              favorite.media_type !==
              mediaType
            ) {
              return favorite;
            }

            const category =
              remaining
                .filter(
                  (
                    item
                  ) =>
                    item.media_type ===
                    mediaType
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    a.position -
                    b.position
                );

            const index =
              category.findIndex(
                (
                  item
                ) =>
                  item.external_id ===
                  favorite.external_id
              );

            return {
              ...favorite,

              position:
                index +
                1,
            };
          }
        );
      }
    );

    markDirty();
  }

  async function uploadImage(
    file:
      File,

    type:
      MediaTarget
  ) {
    const path =
      `${userId}/${type}-${Date.now()}.${getExtension(
        file
      )}`;

    const {
      error,
    } =
      await supabase.storage
        .from(
          "profile-media"
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            contentType:
              file.type,

            upsert:
              false,
          }
        );

    if (
      error
    ) {
      throw new Error(
        error.message
      );
    }

    const {
      data,
    } =
      supabase.storage
        .from(
          "profile-media"
        )
        .getPublicUrl(
          path
        );

    return {
      path,

      url:
        data.publicUrl,
    };
  }

  async function removeOldFile(
    url:
      | string
      | null
  ) {
    const path =
      getStoragePathFromUrl(
        url
      );

    if (
      !path
    ) {
      return;
    }

    await supabase.storage
      .from(
        "profile-media"
      )
      .remove([
        path,
      ]);
  }

  async function saveAll() {
    if (
      saving ||
      !dirty
    ) {
      return;
    }

    const cleanUsername =
      username.trim();

    const usernameChanged =
      cleanUsername !==
      savedUsername;

    if (
      usernameChanged &&
      !USERNAME_PATTERN.test(
        cleanUsername
      )
    ) {
      setMessage(
        "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y guion bajo."
      );

      return;
    }

    if (
      displayName.trim()
        .length >
      50
    ) {
      setMessage(
        "El nombre no puede superar los 50 caracteres."
      );

      return;
    }

    if (
      bio.trim()
        .length >
      300
    ) {
      setMessage(
        "La biografía no puede superar los 300 caracteres."
      );

      return;
    }

    setSaving(
      true
    );

    setMessage(
      "Guardando cambios..."
    );

    const uploadedPaths:
      string[] =
      [];

    try {
      let newAvatarUrl =
        avatarUrl;

      let newBannerUrl =
        removeBanner
          ? null
          : bannerUrl;

      if (
        avatarFile
      ) {
        const upload =
          await uploadImage(
            avatarFile,
            "avatar"
          );

        uploadedPaths.push(
          upload.path
        );

        newAvatarUrl =
          upload.url;
      }

      if (
        bannerFile
      ) {
        const upload =
          await uploadImage(
            bannerFile,
            "banner"
          );

        uploadedPaths.push(
          upload.path
        );

        newBannerUrl =
          upload.url;
      }

      const {
        data:
          savedProfile,

        error:
          profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            username:
              cleanUsername,

            display_name:
              displayName.trim() ||
              null,

            bio:
              bio.trim() ||
              null,

            avatar_url:
              newAvatarUrl,

            banner_url:
              newBannerUrl,

            avatar_crop:
              avatarCrop,

            banner_crop:
              newBannerUrl
                ? bannerCrop
                : null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            userId
          )
          .select(`
            username,
            avatar_url,
            banner_url,
            avatar_crop,
            banner_crop
          `)
          .single();

      if (
        profileError
      ) {
        throw profileError;
      }

      if (
        avatarFile
      ) {
        await removeOldFile(
          avatarUrl
        );
      }

      if (
        bannerFile ||
        removeBanner
      ) {
        await removeOldFile(
          bannerUrl
        );
      }

      /*
       * TEMP SECTION POSITIONS
       */

      for (
        let index =
          0;
        index <
        sections.length;
        index++
      ) {
        const section =
          sections[
            index
          ];

        const {
          error,
        } =
          await supabase
            .from(
              "profile_sections"
            )
            .update({
              position:
                100 +
                index,
            })
            .eq(
              "user_id",
              userId
            )
            .eq(
              "section_key",
              section.section_key
            );

        if (
          error
        ) {
          throw error;
        }
      }

      for (
        let index =
          0;
        index <
        sections.length;
        index++
      ) {
        const section =
          sections[
            index
          ];

        const {
          error,
        } =
          await supabase
            .from(
              "profile_sections"
            )
            .upsert(
              {
                user_id:
                  userId,

                section_key:
                  section.section_key,

                visible:
                  section.visible,

                position:
                  index +
                  1,

                updated_at:
                  new Date()
                    .toISOString(),
              },
              {
                onConflict:
                  "user_id,section_key",
              }
            );

        if (
          error
        ) {
          throw error;
        }
      }

      /*
       * FAVORITES
       */

      const {
        error:
          deleteFavoritesError,
      } =
        await supabase
          .from(
            "profile_favorites"
          )
          .delete()
          .eq(
            "user_id",
            userId
          );

      if (
        deleteFavoritesError
      ) {
        throw deleteFavoritesError;
      }

      const favoriteRows =
        (
          [
            "MOVIE",
            "SERIES",
            "BOOK",
            "GAME",
          ] as MediaType[]
        ).flatMap(
          (
            mediaType
          ) =>
            favorites
              .filter(
                (
                  favorite
                ) =>
                  favorite.media_type ===
                  mediaType
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  a.position -
                  b.position
              )
              .slice(
                0,
                6
              )
              .map(
                (
                  favorite,
                  index
                ) => ({
                  user_id:
                    userId,

                  media_type:
                    favorite.media_type,

                  external_id:
                    favorite.external_id,

                  title:
                    favorite.title,

                  cover_url:
                    favorite.cover_url,

                  position:
                    index +
                    1,
                })
              )
        );

      if (
        favoriteRows.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "profile_favorites"
            )
            .insert(
              favoriteRows
            );

        if (
          error
        ) {
          throw error;
        }
      }

      setSavedUsername(
        savedProfile.username
      );

      setUsername(
        savedProfile.username
      );

      setAvatarUrl(
        savedProfile.avatar_url
      );

      setAvatarPreview(
        savedProfile.avatar_url
      );

      setAvatarCrop(
        savedProfile.avatar_crop
      );

      setBannerUrl(
        savedProfile.banner_url
      );

      setBannerPreview(
        savedProfile.banner_url
      );

      setBannerCrop(
        savedProfile.banner_crop
      );

      setAvatarFile(
        null
      );

      setBannerFile(
        null
      );

      setRemoveBanner(
        false
      );

      setDirty(
        false
      );

      setMessage(
        "Cambios guardados."
      );

      router.refresh();
    } catch (
      error
    ) {
      if (
        uploadedPaths.length >
        0
      ) {
        console.warn(
          "Uploaded files may require cleanup:",
          uploadedPaths
        );
      }

      setMessage(
        `Error: ${getErrorMessage(
          error
        )}`
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] bg-zinc-950 lg:border-x lg:border-zinc-900">
      {/* STICKY EDITOR HEADER */}

      <div className="sticky top-[70px] z-[90] flex min-h-16 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur-xl sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center">
          <Link
            href="/profile"
            className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-white sm:mr-3"
            aria-label="Volver al perfil"
          >
            <ArrowLeft
              size={
                20
              }
            />
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-zinc-100 sm:text-xl">
              Editar perfil
            </h1>

            {(dirty ||
              saving ||
              message) && (
              <p
                role="status"
                className={`mt-0.5 truncate text-xs ${
                  message.startsWith(
                    "Error:"
                  )
                    ? "text-red-400"
                    : saving
                      ? "text-zinc-500"
                      : dirty
                        ? "text-amber-400/80"
                        : "text-emerald-400/80"
                }`}
              >
                {message.startsWith(
                  "Error:"
                )
                  ? message
                  : saving
                    ? "Guardando cambios..."
                    : dirty
                      ? "Cambios sin guardar"
                      : message}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={
            !dirty ||
            saving
          }
          onClick={() => {
            void saveAll();
          }}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-600 sm:px-4"
        >
          {saving ? (
            <Loader2
              size={
                17
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                17
              }
            />
          )}

          <span>
            {saving
              ? "Guardando..."
              : "Guardar"}
          </span>
        </button>
      </div>

      {/* PROFILE PREVIEW */}

      <ProfileMediaHeader
        banner={
          <div className="relative h-full w-full">
            {bannerPreview ? (
              <CroppedProfileImage
                src={
                  bannerPreview
                }
                crop={
                  bannerCrop
                }
                alt="Banner"
              />
            ) : (
              <div className="h-full w-full bg-zinc-900" />
            )}

            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/15">
              <button
                type="button"
                onClick={() =>
                  bannerInputRef.current?.click()
                }
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black/80"
                aria-label="Cambiar banner"
              >
                <Camera
                  size={
                    19
                  }
                />
              </button>

              {bannerPreview && (
                <button
                  type="button"
                  onClick={
                    deleteBanner
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-red-500/90"
                  aria-label="Quitar banner"
                >
                  <Trash2
                    size={
                      19
                    }
                  />
                </button>
              )}
            </div>
          </div>
        }
        avatar={
          <div className="relative h-full w-full">
            {avatarPreview ? (
              <CroppedProfileImage
                src={
                  avatarPreview
                }
                crop={
                  avatarCrop
                }
                alt="Foto de perfil"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-zinc-500">
                {(displayName ||
                  savedUsername ||
                  "?")
                  .slice(
                    0,
                    1
                  )
                  .toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                avatarInputRef.current?.click()
              }
              className="absolute inset-0 flex items-center justify-center bg-black/25 text-white"
              aria-label="Cambiar foto"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/65 backdrop-blur">
                <Camera
                  size={
                    18
                  }
                />
              </span>
            </button>
          </div>
        }
      >
        <div className="max-w-2xl text-left">
          <h2 className="text-2xl font-bold text-zinc-100">
            {displayName ||
              savedUsername ||
              "Usuario"}
          </h2>

          {username && (
            <p className="mt-1 text-sm text-zinc-500">
              @{username}
            </p>
          )}

          {bio.trim() && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
              {
                bio
              }
            </p>
          )}
        </div>
      </ProfileMediaHeader>

      {/* HIDDEN FILE INPUTS */}

      <input
        ref={
          avatarInputRef
        }
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(
          event
        ) =>
          handleImage(
            "avatar",
            event
          )
        }
      />

      <input
        ref={
          bannerInputRef
        }
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(
          event
        ) =>
          handleImage(
            "banner",
            event
          )
        }
      />

      {/* PROFILE FIELDS */}

      <section className="border-t border-zinc-900 px-4 py-7 sm:px-5 lg:px-8 lg:py-9">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-zinc-200">
            Información del perfil
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            Cambia cómo te ven los demás en Media Tracker.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <EditorField
            label="Nombre"
          >
            <input
              value={
                displayName
              }
              maxLength={
                50
              }
              onChange={(
                event
              ) => {
                setDisplayName(
                  event.target.value
                );

                markDirty();
              }}
              className="w-full bg-transparent py-1 text-base text-zinc-100 outline-none"
            />
          </EditorField>

          <EditorField
            label="Nombre de usuario"
          >
            <div className="flex">
              <span className="py-1 text-zinc-600">
                @
              </span>

              <input
                value={
                  username
                }
                onChange={(
                  event
                ) => {
                  setUsername(
                    event.target.value
                  );

                  markDirty();
                }}
                className="min-w-0 flex-1 bg-transparent px-1 py-1 text-base text-zinc-100 outline-none"
              />
            </div>
          </EditorField>

          <div className="lg:col-span-2">
            <EditorField
              label="Biografía"
            >
              <textarea
                value={
                  bio
                }
                maxLength={
                  300
                }
                rows={
                  4
                }
                placeholder="Cuéntanos algo sobre ti"
                onChange={(
                  event
                ) => {
                  setBio(
                    event.target.value
                  );

                  markDirty();
                }}
                className="w-full resize-none bg-transparent py-1 text-base leading-6 text-zinc-100 outline-none placeholder:text-zinc-700"
              />

              <p className="text-right text-xs text-zinc-700">
                {
                  bio.length
                }
                /300
              </p>
            </EditorField>
          </div>
        </div>
      </section>

      {/* SECTIONS */}

      <section className="border-t border-zinc-800">
        <div className="px-4 pb-3 pt-7 sm:px-5 lg:px-8 lg:pt-9">
          <h2 className="text-base font-semibold text-zinc-200">
            Secciones del perfil
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            Elige qué mostrar y en qué orden aparece.
          </p>
        </div>

        {sections
          .slice()
          .sort(
            (
              a,
              b
            ) =>
              a.position -
              b.position
          )
          .map(
            (
              section,
              index
            ) => (
              <ProfileSectionEditor
                key={
                  section.section_key
                }
                section={
                  section
                }
                index={
                  index
                }
                total={
                  sections.length
                }
                favorites={
                  favorites
                }
                activity={
                  recentActivity
                }
                searchSection={
                  searchSection
                }
                search={
                  search
                }
                searching={
                  searching
                }
                searchResults={
                  availableResults
                }
                searchError={
                  searchError
                }
                onMove={
                  moveSection
                }
                onToggle={
                  toggleSection
                }
                onOpenSearch={
                  openSearch
                }
                onSearchChange={(
                  value
                ) => {
                  setSearch(
                    value
                  );

                  setSearchResults(
                    []
                  );

                  setSearchError(
                    ""
                  );
                }}
                onAddFavorite={
                  addFavorite
                }
                onRemoveFavorite={
                  removeFavorite
                }
              />
            )
          )}
      </section>

      <div className="h-16" />

      {/* CUSTOM UNSAVED CHANGES MODAL */}

      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-profile-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
            <button
              type="button"
              onClick={
                cancelLeave
              }
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Cerrar"
            >
              <X
                size={
                  19
                }
              />
            </button>

            <div className="p-6 sm:p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle
                  size={
                    22
                  }
                />
              </div>

              <h2
                id="leave-profile-title"
                className="mt-5 pr-10 text-xl font-semibold text-zinc-100"
              >
                ¿Salir sin guardar?
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Tienes cambios en tu perfil que todavía no se han guardado.
                Si sales ahora, esos cambios se perderán.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 bg-zinc-950/80 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  cancelLeave
                }
                className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
              >
                Seguir editando
              </button>

              <button
                type="button"
                onClick={
                  confirmLeave
                }
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-400"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {cropTarget &&
        cropImage && (
          <ImageCropModal
            image={
              cropImage
            }
            type={
              cropTarget
            }
            onCancel={
              cancelCrop
            }
            onApply={
              applyCrop
            }
          />
        )}
    </div>
  );
}

function EditorField({
  label,
  children,
}: {
  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-zinc-800 px-4 py-2 transition focus-within:border-fuchsia-500">
      <span className="text-xs text-zinc-500">
        {
          label
        }
      </span>

      {
        children
      }
    </label>
  );
}

interface ProfileSectionEditorProps {
  section:
    ProfileSection;

  index:
    number;

  total:
    number;

  favorites:
    Favorite[];

  activity:
    ActivityEvent[];

  searchSection:
    | SectionKey
    | null;

  search:
    string;

  searching:
    boolean;

  searchResults:
    SearchResult[];

  searchError:
    string;

  onMove:
    (
      key:
        SectionKey,

      direction:
        | "up"
        | "down"
    ) => void;

  onToggle:
    (
      key:
        SectionKey
    ) => void;

  onOpenSearch:
    (
      key:
        SectionKey
    ) => void;

  onSearchChange:
    (
      value:
        string
    ) => void;

  onAddFavorite:
    (
      result:
        SearchResult
    ) => void;

  onRemoveFavorite:
    (
      mediaType:
        MediaType,

      externalId:
        string
    ) => void;
}

function ProfileSectionEditor({
  section,
  index,
  total,
  favorites,
  activity,
  searchSection,
  search,
  searching,
  searchResults,
  searchError,
  onMove,
  onToggle,
  onOpenSearch,
  onSearchChange,
  onAddFavorite,
  onRemoveFavorite,
}: ProfileSectionEditorProps) {
  const data =
    SECTION_DATA[
      section.section_key
    ];

  const mediaType =
    data.mediaType;

  const sectionFavorites =
    mediaType
      ? favorites
          .filter(
            (
              favorite
            ) =>
              favorite.media_type ===
              mediaType
          )
          .sort(
            (
              a,
              b
            ) =>
              a.position -
              b.position
          )
      : [];

  const searchOpen =
    searchSection ===
    section.section_key;

  return (
    <section
      className={`border-b border-zinc-800 px-4 py-7 transition lg:px-6 ${
        section.visible
          ? ""
          : "opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-zinc-100">
            {
              data.title
            }
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            {
              data.description
            }
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <SectionIconButton
            label="Subir sección"
            disabled={
              index ===
              0
            }
            onClick={() =>
              onMove(
                section.section_key,
                "up"
              )
            }
          >
            <ArrowUp
              size={
                17
              }
            />
          </SectionIconButton>

          <SectionIconButton
            label="Bajar sección"
            disabled={
              index ===
              total -
                1
            }
            onClick={() =>
              onMove(
                section.section_key,
                "down"
              )
            }
          >
            <ArrowDown
              size={
                17
              }
            />
          </SectionIconButton>

          <SectionIconButton
            label={
              section.visible
                ? "Ocultar sección"
                : "Mostrar sección"
            }
            onClick={() =>
              onToggle(
                section.section_key
              )
            }
          >
            {section.visible ? (
              <Eye
                size={
                  18
                }
              />
            ) : (
              <EyeOff
                size={
                  18
                }
              />
            )}
          </SectionIconButton>
        </div>
      </div>

      <div className="mt-5">
        {section.section_key ===
        "ACTIVITY" ? (
          <ActivityPreview
            activity={
              activity
            }
          />
        ) : (
          <FavoritePreview
            items={
              sectionFavorites
            }
            onRemove={
              onRemoveFavorite
            }
          />
        )}
      </div>

      {mediaType && (
        <div className="mt-5">
          <button
            type="button"
            disabled={
              sectionFavorites.length >=
              6
            }
            onClick={() =>
              onOpenSearch(
                section.section_key
              )
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-fuchsia-400 transition hover:text-fuchsia-300 disabled:cursor-not-allowed disabled:text-zinc-700"
          >
            {searchOpen ? (
              <X
                size={
                  16
                }
              />
            ) : (
              <Plus
                size={
                  16
                }
              />
            )}

            {searchOpen
              ? "Cerrar búsqueda"
              : `Añadir ${data.title.toLowerCase()}`}
          </button>

          {searchOpen && (
            <div className="mt-4">
              <div className="relative">
                {searching ? (
                  <Loader2
                    size={
                      17
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-500"
                  />
                ) : (
                  <Search
                    size={
                      17
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />
                )}

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    onSearchChange(
                      event.target.value
                    )
                  }
                  placeholder={`Buscar ${data.title.toLowerCase()}...`}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-fuchsia-500"
                />
              </div>

              {searchError && (
                <p className="mt-3 text-sm text-red-400">
                  {
                    searchError
                  }
                </p>
              )}

              {searchResults.length >
                0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {searchResults
                    .slice(
                      0,
                      10
                    )
                    .map(
                      (
                        result
                      ) => (
                        <SearchResultCard
                          key={`${result.media_type}-${result.external_id}`}
                          result={
                            result
                          }
                          onAdd={
                            onAddFavorite
                          }
                        />
                      )
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SectionIconButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label:
    string;

  disabled?:
    boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={
        label
      }
      title={
        label
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-25"
    >
      {
        children
      }
    </button>
  );
}

function FavoritePreview({
  items,
  onRemove,
}: {
  items:
    Favorite[];

  onRemove:
    (
      mediaType:
        MediaType,

      externalId:
        string
    ) => void;
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <div className="border-y border-dashed border-zinc-900 py-7 text-center text-sm text-zinc-700">
        Todavía no hay favoritos.
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map(
        (
          item
        ) => (
          <div
            key={`${item.media_type}-${item.external_id}`}
            className="w-[108px] shrink-0 sm:w-[120px]"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900">
              {item.cover_url ? (
                <Image
                  src={
                    item.cover_url
                  }
                  alt={
                    item.title
                  }
                  width={
                    300
                  }
                  height={
                    450
                  }
                  unoptimized={
                    shouldUseOriginalImage(
                      item.cover_url
                    )
                  }
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition:
                      `${item.poster_position_x ?? 50}% ${item.poster_position_y ?? 50}%`,

                    transform:
                      `scale(${item.poster_zoom ?? 1})`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
                  Sin portada
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  onRemove(
                    item.media_type,
                    item.external_id
                  )
                }
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur transition hover:bg-red-500"
                aria-label={`Quitar ${item.title}`}
              >
                <X
                  size={
                    14
                  }
                />
              </button>
            </div>

            <p className="mt-2 h-9 line-clamp-2 text-xs font-medium leading-[18px] text-zinc-300">
              {
                item.title
              }
            </p>
          </div>
        )
      )}
    </div>
  );
}

function ActivityPreview({
  activity,
}: {
  activity:
    ActivityEvent[];
}) {
  if (
    activity.length ===
    0
  ) {
    return (
      <div className="border-y border-dashed border-zinc-900 py-7 text-center text-sm text-zinc-700">
        Tu actividad reciente aparecerá aquí.
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {activity.map(
        (
          item
        ) => (
          <div
            key={
              item.id
            }
            className="w-[108px] shrink-0 sm:w-[120px]"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900">
              {item.cover_url ? (
                <Image
                  src={
                    item.cover_url
                  }
                  alt={
                    item.title
                  }
                  fill
                  sizes="120px"
                  unoptimized={
                    shouldUseOriginalImage(
                      item.cover_url
                    )
                  }
                  className="object-cover"
                  style={{
                    objectPosition:
                      `${item.poster_position_x ?? 50}% ${item.poster_position_y ?? 50}%`,

                    transform:
                      `scale(${item.poster_zoom ?? 1})`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
                  Sin portada
                </div>
              )}
            </div>

            <p className="mt-2 h-9 line-clamp-2 text-xs font-medium leading-[18px] text-zinc-400">
              {
                item.title
              }
            </p>
          </div>
        )
      )}
    </div>
  );
}

function SearchResultCard({
  result,
  onAdd,
}: {
  result:
    SearchResult;

  onAdd:
    (
      result:
        SearchResult
    ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onAdd(
          result
        )
      }
      className="w-[108px] shrink-0 text-left sm:w-[120px]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900">
        {result.cover_url ? (
          <Image
            src={
              result.cover_url
            }
            alt={
              result.title
            }
            width={
              300
            }
            height={
              450
            }
            unoptimized={
              shouldUseOriginalImage(
                result.cover_url
              )
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
            Sin portada
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition hover:bg-black/55 hover:opacity-100">
          <span className="rounded-full bg-fuchsia-500 p-2 text-white">
            <Check
              size={
                17
              }
            />
          </span>
        </div>
      </div>

      <p className="mt-2 h-9 line-clamp-2 text-xs font-medium leading-[18px] text-zinc-300">
        {
          result.title
        }
      </p>

      {(result.year ||
        result.subtitle) && (
        <p className="mt-1 truncate text-[11px] text-zinc-600">
          {
            result.year ??
            result.subtitle
          }
        </p>
      )}
    </button>
  );
}