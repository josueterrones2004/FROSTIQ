const SUPABASE_HOST =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
      ).hostname
    : null;

const OPTIMIZED_HOSTS = [
  "image.tmdb.org",
  "covers.openlibrary.org",
  SUPABASE_HOST,
];

export function shouldUseOriginalImage(
  source: string,
): boolean {
  if (
    source.startsWith("data:") ||
    source.startsWith("blob:")
  ) {
    return true;
  }

  if (
    source.startsWith("/") &&
    !source.startsWith("//")
  ) {
    return false;
  }

  try {
    const url = new URL(source);

    if (
      url.pathname
        .toLowerCase()
        .endsWith(".gif")
    ) {
      return true;
    }

    return (
      url.protocol !== "https:" ||
      !OPTIMIZED_HOSTS.includes(
        url.hostname,
      )
    );
  } catch {
    return true;
  }
}

export type PosterImageConfig = {
  src: string;
  unoptimized: boolean;
};

export function getPosterImageConfig(
  source: string,
): PosterImageConfig {
  let src = source;
  let direct = false;

  try {
    const url = new URL(source);

    if (url.protocol === "https:") {
      if (url.hostname === "image.tmdb.org") {
        const size = url.pathname.match(
          /^\/t\/p\/(original|w\d+)\//,
        );

        if (size) {
          const originalSize = size[1];

          if (
            originalSize === "original" ||
            Number(originalSize.slice(1)) > 500
          ) {
            url.pathname = url.pathname.replace(
              /^\/t\/p\/(original|w\d+)\//,
              "/t/p/w500/",
            );
          }

          src = url.toString();
          direct = true;
        }
      } else if (
        url.hostname === "covers.openlibrary.org"
      ) {
        const smallOrMedium =
          /^\/b\/[^/]+\/[^/]+-[SM]\.(?:jpg|jpeg|png)$/i.test(
            url.pathname,
          );

        if (smallOrMedium) {
          direct = true;
        }
      }
    }
  } catch {
    // Conservar la URL original si no se reconoce.
  }

  return {
    src,
    unoptimized:
      direct || shouldUseOriginalImage(source),
  };
}