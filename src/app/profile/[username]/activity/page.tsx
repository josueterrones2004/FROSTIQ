import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  ArrowLeft,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import ProfileActivity from "../../ProfileActivity";

interface ActivityPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ActivityPage({
  params,
}: ActivityPageProps) {
  const { username } =
    await params;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name
      `)
      .eq(
        "username",
        username
      )
      .maybeSingle();

  if (!profile) {
    notFound();
  }

  const displayName =
    profile.display_name ??
    profile.username ??
    "Usuario";

  return (
    <main className="mx-auto max-w-5xl pb-20">
      <Link
        href={`/profile/${username}`}
        className="inline-flex items-center gap-2 text-sm text-frost-muted transition hover:text-frost-text"
      >
        <ArrowLeft size={16} />

        Volver al perfil
      </Link>

      <div className="mt-7">
        <h1 className="text-3xl font-bold">
          Actividad reciente
        </h1>

        <p className="mt-2 text-frost-muted">
          Toda la actividad de{" "}
          <span className="text-frost-text">
            {displayName}
          </span>
        </p>
      </div>

      <div className="mt-8">
        <ProfileActivity
          profileUserId={
            profile.id
          }
          username={
            username
          }
          mode="full"
        />
      </div>
    </main>
  );
}