"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useState,
} from "react";
import {
  House,
  Library,
  LogIn,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import MobileSearch from "@/components/MobileSearch";

type Profile = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Props = {
  profile: Profile | null;
  authenticated: boolean;
};

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href ||
        pathname.startsWith(`${href}/`);
}

function NavLabel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`max-w-full truncate px-0.5 frost-audit-text-10 font-medium ${
        active
          ? "text-frost-text"
          : "text-frost-muted"
      }`}
    >
      {children}
    </span>
  );
}

function ActiveLine({ active }: { active: boolean }) {
  return active ? (
    <span className="absolute top-0 h-0.5 w-5 rounded-full bg-frost-accent" />
  ) : null;
}

export default function MobileBottomNav({
  profile,
  authenticated,
}: Props) {
  const pathname = usePathname();

  const [searchOpen, setSearchOpen] =
    useState(false);

  const closeSearch = useCallback(
    () => setSearchOpen(false),
    [],
  );

  const homeActive =
    !searchOpen && isActive(pathname, "/");

  const libraryActive =
    !searchOpen && isActive(pathname, "/library");

  const socialActive =
    !searchOpen && isActive(pathname, "/social");

  const profileActive =
    !searchOpen && isActive(pathname, "/profile");

  const navItem =
    "relative flex min-w-0 flex-col items-center justify-center gap-1";

  function navIcon(
    Icon: typeof House,
    active: boolean,
    label: string,
  ) {
    return (
      <>
        <ActiveLine active={active} />

        <Icon
          size={21}
          strokeWidth={active ? 2.3 : 1.9}
          className={
            active
              ? "text-frost-accent"
              : "text-frost-muted"
          }
        />

        <NavLabel active={active}>
          {label}
        </NavLabel>
      </>
    );
  }

  return (
    <>
      <MobileSearch
        open={searchOpen}
        onClose={closeSearch}
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-170 border-t border-frost-border bg-frost-bg shadow-2xl desktop:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {authenticated ? (
          <div className="grid h-17 grid-cols-5">
            <Link
              href="/"
              onClick={closeSearch}
              className={navItem}
            >
              {navIcon(House, homeActive, "Inicio")}
            </Link>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={navItem}
              aria-label="Buscar"
            >
              {navIcon(
                Search,
                searchOpen,
                "Buscar",
              )}
            </button>

            <Link
              href="/library"
              onClick={closeSearch}
              className={navItem}
            >
              {navIcon(
                Library,
                libraryActive,
                "Biblioteca",
              )}
            </Link>

            <Link
              href="/social"
              onClick={closeSearch}
              className={navItem}
            >
              {navIcon(
                Users,
                socialActive,
                "Social",
              )}
            </Link>

            <Link
              href="/profile"
              onClick={closeSearch}
              className={navItem}
            >
              <ActiveLine active={profileActive} />

              {profile?.avatar_url ? (
                <span
                  className={`relative block size-6 shrink-0 overflow-hidden rounded-full border ${
                    profileActive
                      ? "border-frost-accent ring-1 ring-frost-accent/30"
                      : "border-frost-border"
                  }`}
                >
                  <Image
                    src={profile.avatar_url}
                    alt={
                      profile.display_name ??
                      profile.username ??
                      "Perfil"
                    }
                    fill
                    sizes="24px"
                    unoptimized
                    className="object-cover"
                  />
                </span>
              ) : (
                <UserRound
                  size={22}
                  strokeWidth={
                    profileActive ? 2.3 : 1.9
                  }
                  className={
                    profileActive
                      ? "text-frost-accent"
                      : "text-frost-muted"
                  }
                />
              )}

              <NavLabel active={profileActive}>
                Perfil
              </NavLabel>
            </Link>
          </div>
        ) : (
          <div className="grid h-17 grid-cols-3">
            <Link
              href="/"
              onClick={closeSearch}
              className={navItem}
            >
              {navIcon(House, homeActive, "Inicio")}
            </Link>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={navItem}
              aria-label="Buscar"
            >
              {navIcon(
                Search,
                searchOpen,
                "Buscar",
              )}
            </button>

            <Link
              href="/auth?mode=login"
              onClick={closeSearch}
              className={navItem}
            >
              {navIcon(LogIn, false, "Entrar")}
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}