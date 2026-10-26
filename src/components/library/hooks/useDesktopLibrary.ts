"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1280px)";

function subscribe(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(QUERY);

  mediaQuery.addEventListener(
    "change",
    onStoreChange,
  );

  return () => {
    mediaQuery.removeEventListener(
      "change",
      onStoreChange,
    );
  };
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): null {
  return null;
}

export function useDesktopLibrary(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}