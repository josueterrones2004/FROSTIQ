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
  const segments = pathname
    .split("/")
    .filter(Boolean);

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
  const [loggingOut, setLoggingOut] = useState(false);

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

  const navStyle = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm transition ${
      active
        ? "bg-fuchsia-500/10 text-fuchsia-300"
        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="relative z-[100] border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl lg:sticky lg:top-0">
        {/* ESCRITORIO */}

        <div className="hidden h-[70px] lg:block">
          <div className="mx-auto flex h-full w-full max-w-[1700px] items-center gap-3 px-5 xl:gap-5 xl:px-6">
            <Link
              href="/"
              onClick={() =>
                setProfileMenuOpen(false)
              }
              className="shrink-0 text-lg font-bold tracking-tight text-fuchsia-400 xl:text-xl"
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
                  <div className="h-11 w-[230px] rounded-xl border border-zinc-800 bg-zinc-900/70 xl:w-[340px] 2xl:w-[420px]" />
                }
              >
                <GlobalSearch className="w-[230px] xl:w-[340px] 2xl:w-[420px]" />
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
                      className="flex h-11 items-center gap-2 rounded-xl px-2 text-zinc-200 transition hover:bg-zinc-900"
                      aria-label="Abrir menú del perfil"
                      aria-expanded={profileMenuOpen}
                    >
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
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
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-500">
                            {getInitial(profile)}
                          </div>
                        )}
                      </div>

                      <span className="hidden max-w-[120px] truncate text-sm font-semibold xl:block">
                        {displayName}
                      </span>

                      <ChevronDown
                        size={14}
                        className={`hidden shrink-0 text-zinc-600 transition xl:block ${
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

                        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl">
                          <Link
                            href="/profile"
                            onClick={() =>
                              setProfileMenuOpen(false)
                            }
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                          >
                            <UserRound size={17} />
                            Perfil
                          </Link>

                          {profile?.special_role ===
                            "OWNER" && (
                            <>
                              <Link
                                href="/admin/reports"
                                onClick={() =>
                                  setProfileMenuOpen(false)
                                }
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                              >
                                <ShieldCheck size={17} />
                                Reportes
                              </Link>

                              <Link
                                href="/admin/media"
                                onClick={() =>
                                  setProfileMenuOpen(false)
                                }
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                              >
                                <ImageIcon size={17} />
                                Editar portadas
                              </Link>
                            </>
                          )}

                          <div className="my-1 border-t border-zinc-800" />

                          <button
                            type="button"
                            onClick={() =>
                              void handleLogout()
                            }
                            disabled={loggingOut}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-red-400 disabled:opacity-50"
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
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
                  >
                    Iniciar sesión
                  </Link>

                  <Link
                    href="/auth?mode=register"
                    className="rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MÓVIL */}

        <div className="flex h-[58px] items-center justify-between px-4 lg:hidden">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-fuchsia-400"
          >
            FROSTIQ
          </Link>

          {authenticated ? (
            <NotificationsButton />
          ) : (
            <Link
              href="/auth?mode=login"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <div className="pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0">
        <main
          className={
            isFlushRoute
              ? "min-w-0 p-0"
              : "min-w-0 p-4 sm:p-6 lg:p-8"
          }
        >
          {children}
        </main>
      </div>

      {authenticated && (
        <div className="hidden lg:block">
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