"use client";

import {
  BookOpen,
  Gamepad2,
  Heart,
  MessageSquare,
  Palette,
  Search,
  Smartphone,
  Sparkles,
  Star,
  Tv,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

const CHANGELOG_VERSION =
  "0.3.0";

const STORAGE_KEY =
  `media-tracker-changelog-${CHANGELOG_VERSION}`;

type ChangeItemProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

export default function ChangelogModal() {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  useEffect(() => {
    let timer:
      | number
      | null =
      null;

    try {
      const seen =
        window.localStorage.getItem(
          STORAGE_KEY,
        );

      if (seen) {
        return;
      }

      timer =
        window.setTimeout(
          () => {
            setOpen(true);
          },
          450,
        );
    } catch {
      timer =
        window.setTimeout(
          () => {
            setOpen(true);
          },
          450,
        );
    }

    return () => {
      if (
        timer !==
        null
      ) {
        window.clearTimeout(
          timer,
        );
      }
    };
  }, []);

  function close() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        new Date().toISOString(),
      );
    } catch {
      // Si localStorage no está disponible,
      // simplemente cerramos el modal.
    }

    setOpen(false);
  }

  if (!open) {
    return null;
  }

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
              <Sparkles
                size={17}
              />

              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Nueva actualización
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">
              Media Tracker 0.3.0
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              8 de octubre de 2026
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
              La versión 0.3.0 supone una de las mayores
              actualizaciones de Media Tracker hasta ahora,
              con una navegación móvil renovada, nuevas fichas
              de contenido, mejoras sociales y una experiencia
              mucho más consistente entre películas, series,
              juegos y libros.
            </p>
          </div>

          {/* CHANGES */}

          <div className="mt-8 space-y-1">
            <ChangeItem
              icon={
                <Smartphone
                  size={20}
                />
              }
              title="Nueva experiencia móvil"
            >
              La navegación en teléfono ahora utiliza una barra
              inferior para acceder rápidamente a Inicio, Buscar,
              Biblioteca, Social y Perfil. También se mejoraron
              numerosos diseños y comportamientos responsivos en
              toda la plataforma.
            </ChangeItem>

            <ChangeItem
              icon={
                <Search
                  size={20}
                />
              }
              title="Búsqueda y navegación renovadas"
            >
              La búsqueda móvil ahora ocupa toda la pantalla,
              muestra contenido en tendencia antes de escribir y
              actualiza los resultados mientras buscas. Además,
              Media Tracker puede explorarse sin iniciar sesión;
              el acceso solo se solicita al realizar acciones que
              requieren una cuenta.
            </ChangeItem>

            <ChangeItem
              icon={
                <Tv
                  size={20}
                />
              }
              title="Nuevas fichas de contenido"
            >
              Las páginas de películas, series, juegos y libros
              recibieron un rediseño completo con posters y
              banners más protagonistas, mejor jerarquía de
              información, acciones unificadas, valoraciones y
              una adaptación mucho más cuidada entre escritorio
              y móvil.
            </ChangeItem>

            <ChangeItem
              icon={
                <Users
                  size={20}
                />
              }
              title="Reparto, equipo y detalles"
            >
              Las películas y series incorporan nuevas secciones
              para consultar reparto, equipo y detalles
              adicionales sin abandonar la ficha del título.
            </ChangeItem>

            <ChangeItem
              icon={
                <Gamepad2
                  size={20}
                />
              }
              title="Series y episodios mejorados"
            >
              El seguimiento de series cuenta ahora con una
              interfaz renovada para temporadas y episodios,
              imágenes de cada capítulo, progreso de
              visualización y controles más claros para marcar
              episodios vistos y registrar rewatches.
            </ChangeItem>

            <ChangeItem
              icon={
                <MessageSquare
                  size={20}
                />
              }
              title="Reviews completamente renovadas"
            >
              Las reviews tienen nuevas tarjetas y un modal
              dedicado para leerlas sin abandonar la ficha. El
              diseño se adapta a móvil y escritorio, muestra mejor
              el autor, la puntuación y la información del título,
              y las reviews también tienen mayor presencia en los
              perfiles.
            </ChangeItem>

            <ChangeItem
              icon={
                <Heart
                  size={20}
                />
              }
              title="Likes conectados con Social"
            >
              Los Me gusta de las reviews utilizan ahora el mismo
              sistema que las publicaciones de Social,
              manteniendo las interacciones sincronizadas entre
              ambas partes de Media Tracker.
            </ChangeItem>

            <ChangeItem
              icon={
                <Star
                  size={20}
                />
              }
              title="Valoraciones integradas"
            >
              Las fichas muestran ahora las valoraciones de la
              comunidad de forma más consistente en películas,
              series, juegos y libros.
            </ChangeItem>

            <ChangeItem
              icon={
                <BookOpen
                  size={20}
                />
              }
              title="Biblioteca más consistente"
            >
              Los estados de cada tipo de contenido utilizan
              ahora un lenguaje visual común. También se mejoró
              la limpieza de actividad al cambiar o eliminar
              estados para evitar registros antiguos o
              duplicados.
            </ChangeItem>

            <ChangeItem
              icon={
                <Palette
                  size={20}
                />
              }
              title="Nueva identidad visual"
            >
              Media Tracker comienza a adoptar una nueva identidad
              visual con un logotipo propio y nuevos iconos para el
              navegador, dispositivos móviles y la aplicación
              instalable. También se prepararon variantes
              específicas para PWA, Android e iOS para mantener
              una apariencia consistente en todas las plataformas.
            </ChangeItem>
          </div>

          {/* DEVELOPMENT NOTICE */}

          <div className="mt-7 rounded-xl bg-white/[0.025] p-4">
            <p className="text-xs leading-5 text-zinc-600">
              Media Tracker continúa en una etapa temprana de
              desarrollo. Algunas funciones pueden cambiar o
              contener errores.
            </p>
          </div>

          {/* FUTURE */}

          <div className="mt-3 rounded-xl bg-fuchsia-500/[0.045] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
                <Sparkles
                  size={16}
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-200">
                  ¿Qué es lo que sigue?
                </p>

                <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                  Después de esta actualización, el desarrollo se
                  centrará en estabilizar las nuevas experiencias
                  introducidas en 0.3.0, continuar mejorando la
                  plataforma y preparar su siguiente etapa.
                </p>
              </div>
            </div>
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