"use client";

import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  Layers3,
  ListFilter,
  MonitorSmartphone,
  Paintbrush,
  Repeat2,
  Sparkles,
  Tv,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const CHANGELOG_VERSION = "0.4.1";

const STORAGE_KEY =
  `frostiq-changelog-${CHANGELOG_VERSION}`;

const changes = [
  {
    icon: Paintbrush,
    title: "Nueva identidad Cobalt Ink",
    description:
      "La web ahora tiene una nueva paleta de colores. ¿Extrañas la paleta anterior? En la próxima actualización se implementará una opción para que puedas elegir tu propia paleta de colores.",
  },
  {
    icon: Layers3,
    title: "Biblioteca renovada",
    description:
      "Además de nuevos colores, se ha renovado completamente la biblioteca. Ahora está unificada en una sola para todos los medios.",
  },
  {
    icon: ListFilter,
    title: "Filtros y organización",
    description:
      "Además de unificar la biblioteca, se han agregado filtros para que sea más fácil navegar en ella.",
  },
  {
    icon: MonitorSmartphone,
    title: "Una mejor experiencia en móvil",
    description:
      "La biblioteca también recibió varios ajustes para teléfonos. Ahora las portadas se adaptan mejor a la pantalla y los filtros son más cómodos de utilizar.",
  },
  {
    icon: Layers3,
    title: "Portadas protagonistas",
    description:
      "Se mejoró la presentación de las portadas y sus efectos al pasar el cursor. También se ajustaron las tarjetas y los menús para mostrar la información sin estorbar.",
  },
  {
    icon: CheckCircle2,
    title: "Estados de tu colección",
    description:
      "Ahora es más fácil encontrar lo que tienes pendiente, lo que estás disfrutando, lo que terminaste y lo que decidiste abandonar.",
  },
  {
    icon: Tv,
    title: "Seguimiento de series",
    description:
      "Se refinó la forma de registrar episodios y temporadas desde la biblioteca, para que puedas continuar tus series sin perder de vista tu progreso.",
  },
  {
    icon: BookOpen,
    title: "Progreso de lectura",
    description:
      "El registro de páginas y ediciones también recibió ajustes. Puedes consultar y actualizar tu avance sin salir de la biblioteca.",
  },
  {
    icon: Repeat2,
    title: "Reviews y nuevas experiencias",
    description:
      "Se revisó la integración de las reviews con los estados de la biblioteca. Tus registros anteriores se conservan cuando vuelves a ver, leer o jugar una obra.",
  },
  {
    icon: Sparkles,
    title: "Correcciones y mejoras visuales",
    description:
      "También se corrigieron detalles de contraste, navegación, tarjetas y ventanas. Seguimos trabajando para que FROSTIQ se sienta cada vez más consistente.",
  },
];

export default function ChangelogModal() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        new Date().toISOString(),
      );
    } catch {
      // El modal puede cerrarse sin localStorage.
    }

    setOpen(false);
  }, []);

  useEffect(() => {
    let timer: number | null = null;

    try {
      const seen =
        window.localStorage.getItem(STORAGE_KEY);

      if (
        seen &&
        process.env.NODE_ENV !== "development"
      ) {
        return;
      }
    } catch {
      // También funciona sin localStorage.
    }

    timer = window.setTimeout(() => {
      setOpen(true);
    }, 450);

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 bg-black/85 sm:flex sm:items-center sm:justify-center sm:p-5 sm:backdrop-blur-sm">
      <style>{`
        .frost-changelog-panel {
          scrollbar-width: none;
        }

        .frost-changelog-panel::-webkit-scrollbar {
          display: none;
        }

        @media (min-width: 640px) {
          .frost-changelog-panel {
            max-height: 90dvh;
          }
        }
      `}</style>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="frost-changelog-title"
        className="frost-changelog-panel relative h-dvh w-full overflow-y-auto bg-frost-bg text-frost-text sm:h-auto sm:max-w-5xl sm:rounded-2xl sm:border sm:border-frost-border sm:shadow-2xl"
      >
        {/* CIERRE - SIN BARRA DE NAVEGACION */}

        <button
          type="button"
          onClick={close}
          aria-label="Cerrar novedades"
          className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-frost-border bg-frost-raised text-frost-muted shadow-lg transition hover:text-frost-text sm:absolute"
        >
          <X size={19} />
        </button>

        {/* PRESENTACION */}

        <div className="flex flex-col">
          <div className="px-5 pb-9 pt-16 sm:px-9 sm:py-11 lg:px-10 lg:py-12">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-frost-accent">
              <Sparkles size={16} />
              ACTUALIZACIÓN {CHANGELOG_VERSION}
            </div>

            <h2
              id="frost-changelog-title"
              className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-frost-text sm:text-4xl lg:text-5xl"
            >
              BIENVENIDOS A FROSTIQ
            </h2>

            <div className="mt-5 h-1 w-12 rounded-full bg-frost-accent" />

            <div className="mt-6 max-w-3xl space-y-4">
              <p className="text-sm leading-7 text-frost-muted sm:text-base">
                Media Tracker está cada vez más cerca de su versión
                beta. Como parte de esta evolución, la web ahora
                tiene una nueva identidad y un nombre propio.
              </p>

              <p className="text-sm leading-7 text-frost-muted sm:text-base">
                Esta actualización también trae una biblioteca
                renovada y varios cambios para que organizar tus
                películas, series, videojuegos y libros sea más
                sencillo.
              </p>
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-widest text-frost-muted">
              OCTUBRE DE 2026
            </p>
          </div>

          {/* CAPTURAS */}

          <div className="border-t border-frost-border/60 bg-frost-surface/30 px-5 py-9 sm:px-10 lg:px-10 lg:py-12">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-frost-accent">
              La nueva Biblioteca
            </p>

            <div className="relative mx-auto w-full max-w-4xl pb-5 pt-3">
              {/* COMPUTADORA */}

              <div className="block w-4/5 rounded-xl border-2 border-frost-border bg-frost-raised p-1.5 shadow-2xl">
                <span className="relative block aspect-video overflow-hidden rounded-md bg-frost-bg">
                  <Image
                    src="/changelog/library-desktop.png"
                    alt="Biblioteca de FROSTIQ en computadora"
                    fill
                    sizes="(max-width: 640px) 76vw, 750px"
                    className="object-contain object-top"
                  />
                </span>
              </div>

              {/* TELEFONO */}

              <div className="absolute bottom-0 right-0 w-1/4 rounded-2xl border-2 border-frost-border bg-frost-bg p-1 shadow-2xl sm:rounded-3xl">
                <span
                  className="relative block overflow-hidden rounded-xl bg-frost-surface sm:rounded-2xl"
                  style={{
                    aspectRatio: "9 / 19.5",
                  }}
                >
                  <Image
                    src="/changelog/library-mobile.png"
                    alt="Biblioteca de FROSTIQ en teléfono"
                    fill
                    sizes="(max-width: 640px) 24vw, 140px"
                    className="object-contain object-top"
                  />
                </span>
              </div>
            </div>


          </div>
        </div>

        {/* NOVEDADES */}

        <div className="border-t border-frost-border px-5 pb-10 pt-9 sm:px-9 sm:pt-11 lg:px-10">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-frost-accent">
              VERSIÓN {CHANGELOG_VERSION}
            </span>

            <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              NOVEDADES
            </h3>

            <p className="mt-2 text-sm text-frost-muted">
              Estos son los cambios que hemos estado preparando.
            </p>
          </div>

          <div className="grid gap-x-10 sm:grid-cols-2">
            {changes.map((change) => {
              const Icon = change.icon;

              return (
                <article
                  key={change.title}
                  className="flex gap-4 border-t border-frost-border/70 py-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-frost-accent/10 text-frost-accent">
                    <Icon size={19} aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-frost-text">
                      {change.title}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-frost-muted">
                      {change.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* NOTA FINAL */}

          <div className="mt-7 border-t border-frost-border pt-7">
            <h3 className="text-base font-bold">
              Esto es solo el comienzo.
            </h3>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-frost-muted">
                FROSTIQ 0.4.1
              </span>

              <button
                type="button"
                onClick={close}
                className="rounded-xl bg-frost-accent px-6 py-2.5 text-sm font-semibold text-frost-bg transition hover:bg-frost-accent-hover"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}