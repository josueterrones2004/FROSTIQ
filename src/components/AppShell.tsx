"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ChevronDown,
  ImageIcon,
  Library,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import BugReportButton from "@/components/BugReportButton";
import GlobalSearch from "@/components/GlobalSearch";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";
import NotificationsButton from "@/components/NotificationsButton";
import { createClient } from "@/lib/supabase/client";

type SpecialRole = "OWNER" | "BETA_TESTER" | null;

type ShellProfile = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  special_role: SpecialRole;
};

type Props = {
  children: React.ReactNode;
  authenticated: boolean;
  profile: ShellProfile | null;
};

function isNavigationActive(
  pathname: string,
  route: string,
) {
  return route === "/"
    ? pathname === "/"
    : pathname === route ||
        pathname.startsWith(`${route}/`);
}

function isMediaDetailRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return (
    segments.length === 2 &&
    ["movies", "series", "books", "games"].includes(
      segments[0],
    )
  );
}

function getInitial(profile: ShellProfile | null) {
  return (
    profile?.display_name ??
    profile?.username ??
    "U"
  )
    .slice(0, 1)
    .toUpperCase();
}

function getMobileTitle(pathname: string) {
  if (pathname === "/") return "FROSTIQ";

  const sections: { route: string; title: string }[] = [
    { route: "/library", title: "Biblioteca" },
    { route: "/social", title: "Social" },
    { route: "/profile", title: "Perfil" },
    { route: "/notifications", title: "Notificaciones" },
    { route: "/discover", title: "Descubrir" },
    { route: "/search", title: "Buscar" },
    { route: "/auth", title: "Acceder" },
    { route: "/movies", title: "Películas" },
    { route: "/series", title: "Series" },
    { route: "/books", title: "Libros" },
    { route: "/games", title: "Videojuegos" },
    { route: "/admin", title: "Administración" },
  ];

  const section = sections.find(({ route }) =>
    isNavigationActive(pathname, route),
  );

  return section?.title ?? "FROSTIQ";
}

export default function AppShell({
  children,
  authenticated,
  profile,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const isFlushProfileRoute =
    pathname === "/profile" ||
    pathname === "/profile/customize" ||
    (pathname.startsWith("/profile/") &&
      pathname.split("/").filter(Boolean).length === 2);

  const isFlushRoute =
    isFlushProfileRoute ||
    isMediaDetailRoute(pathname);

  const displayName =
    profile?.display_name ??
    profile?.username ??
    "Usuario";

  const libraryActive =
    authenticated &&
    isNavigationActive(pathname, "/library");

  const socialActive =
    authenticated &&
    isNavigationActive(pathname, "/social");

  const homeActive = pathname === "/";

  const mobileTitle = getMobileTitle(pathname);

  const navStyle = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm transition-colors ${
      active
        ? "bg-frost-active text-frost-accent"
        : "text-frost-muted hover:bg-frost-surface hover:text-frost-text"
    }`;

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        return;
      }

      setProfileMenuOpen(false);

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Unexpected error signing out:",
        error,
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-frost-bg text-frost-text">
      <header className="relative z-100 border-b border-frost-border bg-frost-bg/95 backdrop-blur-xl desktop:sticky desktop:top-0">
        {/* NAVEGACIÓN DE ESCRITORIO */}

        <div className="hidden h-17.5 desktop:block">
          <div className="mx-auto flex h-full w-full max-w-425 items-center gap-3 px-5 xl:gap-5 xl:px-6">
            <Link
              href="/"
              onClick={() =>
                setProfileMenuOpen(false)
              }
              className="shrink-0 text-lg font-bold tracking-tight text-frost-accent xl:text-xl"
            >
              FROSTIQ
            </Link>

            <nav className="flex shrink-0 items-center gap-1">
              <Link
                href="/"
                onClick={() =>
                  setProfileMenuOpen(false)
                }
                className={navStyle(homeActive)}
              >
                Inicio
              </Link>

              {authenticated && (
                <>
                  <Link
                    href="/library"
                    onClick={() =>
                      setProfileMenuOpen(false)
                    }
                    className={`flex items-center gap-2 ${navStyle(
                      libraryActive,
                    )}`}
                  >
                    <Library size={16} />
                    Biblioteca
                  </Link>

                  <Link
                    href="/social"
                    onClick={() =>
                      setProfileMenuOpen(false)
                    }
                    className={navStyle(socialActive)}
                  >
                    Social
                  </Link>
                </>
              )}
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-2 xl:gap-3">
              <Suspense
                fallback={
                  <div className="h-11 w-57.5 rounded-xl border border-frost-border bg-frost-surface/70 xl:w-85 2xl:w-105" />
                }
              >
                <GlobalSearch className="w-57.5 xl:w-85 2xl:w-105" />
              </Suspense>

              {authenticated ? (
                <>
                  <NotificationsButton />

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setProfileMenuOpen(
                          (current) => !current,
                        )
                      }
                      className="flex h-11 items-center gap-2 rounded-xl px-2 text-frost-text transition-colors hover:bg-frost-surface"
                      aria-label="Abrir menú del perfil"
                      aria-expanded={profileMenuOpen}
                    >
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-frost-raised">
                        {profile?.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={displayName}
                            width={64}
                            height={64}
                            loading="eager"
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-frost-muted">
                            {getInitial(profile)}
                          </div>
                        )}
                      </div>

                      <span className="hidden max-w-30 truncate text-sm font-semibold xl:block">
                        {displayName}
                      </span>

                      <ChevronDown
                        size={14}
                        className={`hidden shrink-0 text-frost-muted transition-transform xl:block ${
                          profileMenuOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {profileMenuOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Cerrar menú del perfil"
                          onClick={() =>
                            setProfileMenuOpen(false)
                          }
                          className="fixed inset-0 z-40 cursor-default"
                        />

                        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-frost-border bg-frost-surface p-1.5 shadow-2xl">
                          <Link
                            href="/profile"
                            onClick={() =>
                              setProfileMenuOpen(false)
                            }
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-frost-muted transition-colors hover:bg-frost-raised hover:text-frost-text"
                          >
                            <UserRound size={17} />
                            Perfil
                          </Link>

                          {profile?.special_role === "OWNER" && (
                            <>
                              <Link
                                href="/admin/reports"
                                onClick={() =>
                                  setProfileMenuOpen(false)
                                }
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-frost-muted transition-colors hover:bg-frost-raised hover:text-frost-text"
                              >
                                <ShieldCheck size={17} />
                                Reportes
                              </Link>

                              <Link
                                href="/admin/media"
                                onClick={() =>
                                  setProfileMenuOpen(false)
                                }
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-frost-muted transition-colors hover:bg-frost-raised hover:text-frost-text"
                              >
                                <ImageIcon size={17} />
                                Editar portadas
                              </Link>
                            </>
                          )}

                          <div className="my-1 border-t border-frost-border" />

                          <button
                            type="button"
                            onClick={() =>
                              void handleLogout()
                            }
                            disabled={loggingOut}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-frost-muted transition-colors hover:bg-frost-raised hover:text-frost-danger disabled:opacity-50"
                          >
                            <LogOut size={17} />
                            {loggingOut
                              ? "Cerrando..."
                              : "Cerrar sesión"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth?mode=login"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-frost-muted transition-colors hover:bg-frost-surface hover:text-frost-text"
                  >
                    Iniciar sesión
                  </Link>

                  <Link
                    href="/auth?mode=register"
                    className="rounded-xl bg-frost-accent px-4 py-2.5 text-sm font-semibold text-frost-bg transition-colors hover:bg-frost-accent-hover"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN MÓVIL */}

        <div className="relative flex h-14.5 items-center justify-center px-4 desktop:hidden">
          <Link
            href="/"
            className="max-w-64 truncate px-12 text-center text-lg font-bold tracking-tight text-frost-accent"
          >
            {mobileTitle}
          </Link>

          {authenticated ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <NotificationsButton />
            </div>
          ) : (
            <Link
              href="/auth?mode=login"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-frost-border bg-frost-surface px-3 py-2 text-xs font-medium text-frost-muted"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}

      <div className="pb-17 desktop:pb-0">
        <main
          className={
            isFlushRoute
              ? "min-w-0 p-0"
              : "min-w-0 p-4 sm:p-6 desktop:p-8"
          }
        >
          {children}
        </main>
      </div>

      {/* REPORTE DE PROBLEMAS */}

      {authenticated && (
        <div className="hidden desktop:block">
          <BugReportButton />
        </div>
      )}

      <InstallAppPrompt />

      <MobileBottomNav
        profile={profile}
        authenticated={authenticated}
      />
    </div>
  );
}