"use client";

import {
  LogIn,
  UserPlus,
} from "lucide-react";

import Link from "next/link";

export default function GuestMediaActions() {
  return (
    <section className="mt-6">
      <div className="max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
        <p className="text-sm font-medium text-zinc-200">
          Guarda este título en tu biblioteca
        </p>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Inicia sesión para añadirlo a pendientes,
          registrar tu progreso, marcarlo como completado
          o publicar una review.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/auth?mode=login"
            className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
          >
            <LogIn
              size={
                16
              }
            />

            Iniciar sesión
          </Link>

          <Link
            href="/auth?mode=register"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
          >
            <UserPlus
              size={
                16
              }
            />

            Registrarse
          </Link>
        </div>
      </div>
    </section>
  );
}