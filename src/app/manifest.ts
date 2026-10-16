import type {
  MetadataRoute,
} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",

    name:
      "Media Tracker",

    short_name:
      "Media Tracker",

    description:
      "Lleva un registro de tus películas, series, libros y juegos.",

    start_url:
      "/",

    scope:
      "/",

    display:
      "standalone",

    background_color:
      "#162b4d",

    theme_color:
      "#162b4d",

    orientation:
      "any",

    categories: [
      "entertainment",
      "lifestyle",
    ],

    icons: [
      {
        src:
          "/icons/icon-192.png",

        sizes:
          "192x192",

        type:
          "image/png",

        purpose:
          "any",
      },

      {
        src:
          "/icons/icon-512.png",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "any",
      },

      {
        src:
          "/icons/maskable-512.png",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "maskable",
      },
    ],
  };
}