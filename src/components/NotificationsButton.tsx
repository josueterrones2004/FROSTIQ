"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

interface NotificationsButtonProps {
  onNavigate?: () => void;
}

export default function NotificationsButton({
  onNavigate,
}: NotificationsButtonProps) {
  const [supabase] = useState(() => createClient());

  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error(
          "Error loading unread notifications:",
          error,
        );
        return;
      }

      setUnreadCount(count ?? 0);
    },
    [supabase],
  );

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadUnreadCount();
    }, 0);

    function handleFocus() {
      void loadUnreadCount();
    }

    function handleNotificationsRead() {
      setUnreadCount(0);
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "notifications-read",
      handleNotificationsRead,
    );

    return () => {
      window.clearTimeout(initialLoad);

      window.removeEventListener(
        "focus",
        handleFocus,
      );

      window.removeEventListener(
        "notifications-read",
        handleNotificationsRead,
      );
    };
  }, [loadUnreadCount]);

  return (
    <Link
      href="/notifications"
      onClick={onNavigate}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center text-frost-muted transition-colors hover:text-frost-accent focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-frost-accent"
      aria-label="Notificaciones"
    >
      <Bell size={21} />

      {unreadCount > 0 && (
        <span className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-frost-accent px-1 frost-audit-text-10 font-bold leading-none text-frost-bg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}