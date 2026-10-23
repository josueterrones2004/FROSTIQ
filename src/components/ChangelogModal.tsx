
"use client";

import {
  LogOut,
  MessageSquare,
  MousePointer2,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

const CHANGELOG_VERSION = "0.3.1";

const STORAGE_KEY =
  `media-tracker-changelog-${CHANGELOG_VERSION}`;

type ChangeItemProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

export default function ChangelogModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer: number | null = null;

    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);

      if (seen) return;

      timer = window.setTimeout(() => {
        setOpen(true);
      }, 450);
    } catch {
      timer = window.setTimeout(() => {
        setOpen(true);
      }, 450);
    }

    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  function close() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        new Date().toISOString(),
      );
    } catch {
      // El changelog puede cerrarse sin localStorage.
    }

    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-200"
          aria-label="Cerrar changelog"
        >
          <X size={20} />
        </button>

        <div className="p-5 sm:p-7">
          {/* HEADER */}

          <div className="pr-12">
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Sparkles size={17} />

              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Nueva actualización
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">
              FROSTIQ {CHANGELOG_VERSION}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              19 de octubre de 2026
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
              Esta pequeña actualización se centra en corregir
              errores, mejorar la estabilidad y unificar la
              experiencia de uso de FROSTIQ, especialmente
              al registrar reviews desde teléfonos y computadoras.
            </p>
          </div>

          {/* CHANGES */}

          <div className="mt-8 space-y-1">
            <ChangeItem
              icon={<MessageSquare size={20} />}
              title="Reviews unificadas"
            >
              Películas, series, juegos y libros ahora comparten
              un mismo formulario para registrar reviews, con una
              presentación consistente y controles adaptados a
              cada tipo de contenido.
            </ChangeItem>

            <ChangeItem
              icon={<Smartphone size={20} />}
              title="Mejor experiencia en móvil"
            >
              Se reorganizaron los formularios para aprovechar
              mejor el espacio disponible, con una distribución
              específica para pantallas verticales y horizontales.
              También se mejoró la jerarquía visual en escritorio.
            </ChangeItem>

            <ChangeItem
              icon={<Star size={20} />}
              title="Valoraciones más intuitivas"
            >
              Ahora puedes puntuar deslizando el dedo o arrastrando
              el cursor sobre las estrellas, en incrementos de
              media estrella. También puedes seleccionar una
              puntuación directamente o dejarla vacía.
            </ChangeItem>

            <ChangeItem
              icon={<ShieldCheck size={20} />}
              title="Protección de reviews sin guardar"
            >
              Al intentar cerrar una review con cambios
              pendientes, aparece una confirmación para evitar
              descartar accidentalmente el contenido escrito.
            </ChangeItem>

            <ChangeItem
              icon={<LogOut size={20} />}
              title="Corrección del cierre de sesión"
            >
              Se corrigió un problema que podía dejar el botón
              bloqueado en «Cerrando...» después de salir de
              una cuenta.
            </ChangeItem>

            <ChangeItem
              icon={<Search size={20} />}
              title="Inicio público corregido"
            >
              Se ajustó la presentación de la página de inicio
              para visitantes sin cuenta, manteniendo una
              distribución más consistente con la experiencia
              de los usuarios registrados.
            </ChangeItem>

            <ChangeItem
              icon={<MousePointer2 size={20} />}
              title="Correcciones de estabilidad"
            >
              Se solucionó un error relacionado con la interacción
              de las estrellas y se eliminaron formularios
              antiguos que provocaban diferencias entre categorías.
            </ChangeItem>
          </div>

          {/* DEVELOPMENT NOTICE */}

          <div className="mt-7 rounded-xl bg-white/[0.025] p-4">
            <p className="text-xs leading-5 text-zinc-600">
              FROSTIQ continúa en una etapa temprana de
              desarrollo. Algunas funciones pueden cambiar o
              contener errores.
            </p>
          </div>

          {/* CONFIRM */}

          <div className="mt-7 flex justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-xl bg-fuchsia-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-400"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeItem({
  icon,
  title,
  children,
}: ChangeItemProps) {
  return (
    <div className="flex gap-4 rounded-xl px-2 py-3 transition hover:bg-white/[0.025]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-zinc-200">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {children}
        </p>
      </div>
    </div>
  );
}