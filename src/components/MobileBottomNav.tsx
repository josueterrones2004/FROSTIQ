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

function isActive(
  pathname: string,
  href: string,
) {
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
      className={`max-w-full truncate px-0.5 text-[10px] font-medium ${
        active
          ? "text-zinc-200"
          : "text-zinc-600"
      }`}
    >
      {children}
    </span>
  );
}

function ActiveLine({
  active,
}: {
  active: boolean;
}) {
  return active ? (
    <span className="absolute top-0 h-[2px] w-5 rounded-full bg-fuchsia-400" />
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
    !searchOpen &&
    isActive(pathname, "/");

  const libraryActive =
    !searchOpen &&
    isActive(pathname, "/library");

  const socialActive =
    !searchOpen &&
    isActive(pathname, "/social");

  const profileActive =
    !searchOpen &&
    isActive(pathname, "/profile");

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
          strokeWidth={
            active ? 2.3 : 1.9
          }
          className={
            active
              ? "text-zinc-100"
              : "text-zinc-500"
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

      <nav className="fixed inset-x-0 bottom-0 z-[170] border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:hidden">
        {authenticated ? (
          <div className="grid h-[68px] grid-cols-5">
            <Link
              href="/"
              onClick={closeSearch}
              className={navItem}
            >
              {navIcon(
                House,
                homeActive,
                "Inicio",
              )}
            </Link>

            <button
              type="button"
              onClick={() =>
                setSearchOpen(true)
              }
              className={navItem}
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
              <ActiveLine
                active={profileActive}
              />

              {profile?.avatar_url ? (
                <div
                  className={`h-[23px] w-[23px] overflow-hidden rounded-full border ${
                    profileActive
                      ? "border-fuchsia-400 ring-1 ring-fuchsia-400/30"
                      : "border-zinc-700"
                  }`}
                >
                  <Image
                    src={profile.avatar_url}
                    alt={
                      profile.display_name ??
                      profile.username ??
                      "Perfil"
                    }
                    width={46}
                    height={46}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <UserRound
                  size={22}
                  strokeWidth={
                    profileActive
                      ? 2.3
                      : 1.9
                  }
                  className={
                    profileActive
                      ? "text-zinc-100"
                      : "text-zinc-500"
                  }
                />
              )}

              <NavLabel
                active={profileActive}
              >
                Perfil
              </NavLabel>
            </Link>
          </div>
        ) : (
          <div className="grid h-[68px] grid-cols-3">
            <Link
              href="/"
              onClick={closeSearch}
              className={navItem}
            >
              {navIcon(
                House,
                homeActive,
                "Inicio",
              )}
            </Link>

            <button
              type="button"
              onClick={() =>
                setSearchOpen(true)
              }
              className={navItem}
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
              {navIcon(
                LogIn,
                false,
                "Entrar",
              )}
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}