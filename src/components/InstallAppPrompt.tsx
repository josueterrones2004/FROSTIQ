"use client";

import {
  Download,
  Share,
  SquarePlus,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

type InstallChoice = {
  outcome:
    | "accepted"
    | "dismissed";

  platform:
    string;
};

interface BeforeInstallPromptEvent
  extends Event {
  prompt:
    () =>
      Promise<void>;

  userChoice:
    Promise<InstallChoice>;
}

type NavigatorWithStandalone =
  Navigator & {
    standalone?:
      boolean;
  };

const DISMISS_KEY =
  "media-tracker-install-prompt-dismissed";

const DISMISS_TIME =
  7 *
  24 *
  60 *
  60 *
  1000;

function isStandalone() {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  const navigatorWithStandalone =
    navigator as NavigatorWithStandalone;

  return (
    window
      .matchMedia(
        "(display-mode: standalone)"
      )
      .matches ||
    navigatorWithStandalone
      .standalone ===
      true
  );
}

function detectIOS() {
  const userAgent =
    navigator.userAgent;

  const classicIOS =
    /iPad|iPhone|iPod/i.test(
      userAgent
    );

  const modernIPad =
    navigator.platform ===
      "MacIntel" &&
    navigator.maxTouchPoints >
      1;

  return (
    classicIOS ||
    modernIPad
  );
}

function detectMobile() {
  const userAgent =
    navigator.userAgent;

  const mobileUserAgent =
    /Android|iPhone|iPad|iPod|Mobile/i.test(
      userAgent
    );

  const coarsePointer =
    window
      .matchMedia(
        "(pointer: coarse)"
      )
      .matches;

  return (
    mobileUserAgent ||
    (
      coarsePointer &&
      window.innerWidth <=
        1280
    )
  );
}

function recentlyDismissed() {
  try {
    const stored =
      window.localStorage.getItem(
        DISMISS_KEY
      );

    if (
      !stored
    ) {
      return false;
    }

    const dismissedAt =
      Number(
        stored
      );

    if (
      Number.isNaN(
        dismissedAt
      )
    ) {
      return false;
    }

    return (
      Date.now() -
        dismissedAt <
      DISMISS_TIME
    );
  } catch {
    return false;
  }
}

function saveDismissal() {
  try {
    window.localStorage.setItem(
      DISMISS_KEY,
      String(
        Date.now()
      )
    );
  } catch {
    // localStorage puede no estar disponible.
  }
}

export default function InstallAppPrompt() {
  const [
    visible,
    setVisible,
  ] =
    useState(
      false
    );

  const [
    isIOS,
    setIsIOS,
  ] =
    useState(
      false
    );

  const [
    installPrompt,
    setInstallPrompt,
  ] =
    useState<
      BeforeInstallPromptEvent |
      null
    >(
      null
    );

  useEffect(
    () => {
      if (
        isStandalone() ||
        recentlyDismissed()
      ) {
        return;
      }

      if (
        !detectMobile()
      ) {
        return;
      }

      let showTimer:
        | number
        | null =
        null;

      const ios =
        detectIOS();

      if (
        ios
      ) {
        showTimer =
          window.setTimeout(
            () => {
              setIsIOS(
                true
              );

              setVisible(
                true
              );
            },
            1200
          );
      }

      function handleBeforeInstallPrompt(
        event:
          Event
      ) {
        if (
          ios
        ) {
          return;
        }

        const promptEvent =
          event as BeforeInstallPromptEvent;

        promptEvent.preventDefault();

        setInstallPrompt(
          promptEvent
        );

        if (
          showTimer !==
          null
        ) {
          window.clearTimeout(
            showTimer
          );
        }

        showTimer =
          window.setTimeout(
            () => {
              setVisible(
                true
              );
            },
            1200
          );
      }

      function handleInstalled() {
        setVisible(
          false
        );

        setInstallPrompt(
          null
        );
      }

      window.addEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.addEventListener(
        "appinstalled",
        handleInstalled
      );

      return () => {
        if (
          showTimer !==
          null
        ) {
          window.clearTimeout(
            showTimer
          );
        }

        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt
        );

        window.removeEventListener(
          "appinstalled",
          handleInstalled
        );
      };
    },
    []
  );

  function dismiss() {
    saveDismissal();

    setVisible(
      false
    );
  }

  async function install() {
    if (
      !installPrompt
    ) {
      return;
    }

    try {
      await installPrompt.prompt();

      const choice =
        await installPrompt.userChoice;

      setInstallPrompt(
        null
      );

      if (
        choice.outcome ===
        "accepted"
      ) {
        setVisible(
          false
        );

        return;
      }

      dismiss();
    } catch (
      error
    ) {
      console.error(
        "Error showing install prompt:",
        error
      );

      dismiss();
    }
  }

  if (
    !visible
  ) {
    return null;
  }

  if (
    isIOS
  ) {
    return (
      <div className="fixed inset-x-4 frost-install-floating mx-auto max-w-md overflow-hidden rounded-2xl border border-frost-border bg-frost-bg shadow-2xl shadow-black/50 lg:left-auto lg:right-6 lg:mx-0">
        <style>{`
          .frost-install-floating {
            bottom: calc(88px + env(safe-area-inset-bottom));
            z-index: 180;
          }
          .frost-install-text-10 { font-size: 10px; }
          .frost-install-track-018 { letter-spacing: 0.18em; }
          @media (min-width: 1024px) {
            .frost-install-floating { bottom: 24px; }
          }
        `}</style>
        <div className="relative p-5">
          <button
            type="button"
            onClick={
              dismiss
            }
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-frost-muted transition hover:bg-frost-surface hover:text-frost-text"
            aria-label="Cerrar"
          >
            <X
              size={
                18
              }
            />
          </button>

          <div className="pr-10">
            <p className="frost-install-text-10 font-semibold uppercase frost-install-track-018 text-frost-accent">
              Instalar app
            </p>

            <h2 className="mt-2 text-lg font-semibold text-frost-text">
              Añade FROSTIQ a tu inicio
            </h2>

            <p className="mt-1 text-sm leading-6 text-frost-muted">
              En iPhone y iPad la instalación se hace desde el menú de compartir.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <GuideStep
              number="1"
              icon={
                <Share
                  size={
                    19
                  }
                />
              }
            >
              Pulsa el botón{" "}
              <strong className="font-medium text-frost-text">
                Compartir
              </strong>{" "}
              del navegador.
            </GuideStep>

            <GuideStep
              number="2"
              icon={
                <SquarePlus
                  size={
                    19
                  }
                />
              }
            >
              Busca{" "}
              <strong className="font-medium text-frost-text">
                Añadir a pantalla de inicio
              </strong>
              .
            </GuideStep>

            <GuideStep
              number="3"
              icon={
                <Download
                  size={
                    19
                  }
                />
              }
            >
              Pulsa{" "}
              <strong className="font-medium text-frost-text">
                Añadir
              </strong>
              . FROSTIQ aparecerá junto a tus apps.
            </GuideStep>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={
                dismiss
              }
              className="rounded-xl bg-frost-accent px-5 py-2.5 text-sm font-medium text-frost-bg transition hover:bg-frost-accent-hover"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (
    !installPrompt
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 frost-install-floating mx-auto max-w-md overflow-hidden rounded-2xl border border-frost-border bg-frost-bg shadow-2xl shadow-black/50 lg:left-auto lg:right-6 lg:mx-0">
        <style>{`
          .frost-install-floating {
            bottom: calc(88px + env(safe-area-inset-bottom));
            z-index: 180;
          }
          .frost-install-text-10 { font-size: 10px; }
          .frost-install-track-018 { letter-spacing: 0.18em; }
          @media (min-width: 1024px) {
            .frost-install-floating { bottom: 24px; }
          }
        `}</style>
      <div className="relative p-5">
        <button
          type="button"
          onClick={
            dismiss
          }
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-frost-muted transition hover:bg-frost-surface hover:text-frost-text"
          aria-label="Cerrar"
        >
          <X
            size={
              18
            }
          />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-frost-accent/10 text-frost-accent">
            <Download
              size={
                23
              }
            />
          </div>

          <div>
            <p className="frost-install-text-10 font-semibold uppercase frost-install-track-018 text-frost-accent">
              Instalar app
            </p>

            <h2 className="mt-1 text-lg font-semibold text-frost-text">
              Instala FROSTIQ
            </h2>

            <p className="mt-1 text-sm leading-6 text-frost-muted">
              Accede desde tu pantalla de inicio y úsala como una aplicación.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={
              dismiss
            }
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-frost-muted transition hover:bg-frost-surface hover:text-frost-text"
          >
            Ahora no
          </button>

          <button
            type="button"
            onClick={() => {
              void install();
            }}
            className="rounded-xl bg-frost-accent px-5 py-2.5 text-sm font-medium text-frost-bg transition hover:bg-frost-accent-hover"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideStep({
  number,
  icon,
  children,
}: {
  number:
    string;

  icon:
    React.ReactNode;

  children:
    React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-frost-border/80 bg-frost-surface/50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-frost-raised text-frost-muted">
        {
          icon
        }
      </div>

      <div className="min-w-0 flex-1 text-sm leading-5 text-frost-muted">
        {
          children
        }
      </div>

      <span className="text-xs font-semibold text-frost-muted">
        {
          number
        }
      </span>
    </div>
  );
}