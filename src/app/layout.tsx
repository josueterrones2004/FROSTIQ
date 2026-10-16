import type {
  Metadata,
} from "next";

import AppShell from "@/components/AppShell";
import ChangelogModal from "@/components/ChangelogModal";

import {
  createClient,
} from "@/lib/supabase/server";

import "./globals.css";

export const metadata:
  Metadata = {
  title:
    "Media Tracker",

  description:
    "Tu biblioteca personal de películas, series, libros y juegos",

  applicationName:
    "Media Tracker",

  appleWebApp: {
    capable:
      true,

    title:
      "Media Tracker",

    statusBarStyle:
      "black-translucent",
  },

  formatDetection: {
    telephone:
      false,
  },
};

type ShellProfile = {
  username:
    | string
    | null;

  display_name:
    | string
    | null;

  avatar_url:
    | string
    | null;

  special_role:
    | "OWNER"
    | "BETA_TESTER"
    | null;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  let profile:
    | ShellProfile
    | null =
    null;

  if (user) {
    const {
      data,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(`
          username,
          display_name,
          avatar_url,
          special_role
        `)
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    profile =
      data as
        | ShellProfile
        | null;
  }

  return (
    <html
      lang="es"
      suppressHydrationWarning
    >
      <body className="bg-zinc-950 text-zinc-100">
        <AppShell
          authenticated={
            Boolean(
              user
            )
          }
          profile={
            profile
          }
        >
          {children}
        </AppShell>

        {user && (
          <ChangelogModal />
        )}
      </body>
    </html>
  );
}