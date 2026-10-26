"use client";

import {
  LogIn,
  UserPlus,
} from "lucide-react";

import Link from "next/link";

export default function GuestMediaActions() {
  return (
    <section className="mt-6">
      <div className="max-w-xl rounded-2xl border border-frost-border bg-frost-surface/60 p-4 sm:p-5">
        <p className="text-sm font-medium text-frost-text">
          Guarda este título en tu biblioteca
        </p>

        <p className="mt-1 text-sm leading-6 text-frost-muted">
          Inicia sesión para añadirlo a pendientes,
          registrar tu progreso, marcarlo como completado
          o publicar una review.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/auth?mode=login"
            className="inline-flex items-center gap-2 rounded-xl bg-frost-accent px-4 py-2.5 text-sm font-semibold text-frost-bg transition hover:bg-frost-accent-hover"
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
            className="inline-flex items-center gap-2 rounded-xl border border-frost-border bg-frost-surface px-4 py-2.5 text-sm font-medium text-frost-text transition hover:border-frost-accent/40 hover:bg-frost-raised hover:text-frost-text"
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