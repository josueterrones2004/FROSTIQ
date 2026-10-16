import { redirect } from "next/navigation";

import ReportsClient from "./ReportsClient";

import {
  createClient,
} from "@/lib/supabase/server";

type ReportStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED";

type ReportCategory =
  | "BUG"
  | "UI"
  | "PERFORMANCE"
  | "OTHER";

export type AdminBugReport = {
  id: string;
  user_id: string;

  category:
    ReportCategory;

  description:
    string;

  page_url:
    | string
    | null;

  user_agent:
    | string
    | null;

  viewport_width:
    | number
    | null;

  viewport_height:
    | number
    | null;

  status:
    ReportStatus;

  created_at:
    string;

  reporter: {
    username:
      | string
      | null;

    display_name:
      | string
      | null;

    avatar_url:
      | string
      | null;
  } | null;
};

export default async function AdminReportsPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  /*
   * OWNER CHECK
   */

  const {
    data: ownerProfile,
    error: ownerError,
  } =
    await supabase
      .from("profiles")
      .select(
        "special_role"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (
    ownerError ||
    ownerProfile?.special_role !==
      "OWNER"
  ) {
    redirect("/");
  }

  /*
   * REPORTS
   */

  const {
    data: reportRows,
    error: reportError,
  } =
    await supabase
      .from(
        "bug_reports"
      )
      .select(`
        id,
        user_id,
        category,
        description,
        page_url,
        user_agent,
        viewport_width,
        viewport_height,
        status,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (
    reportError
  ) {
    throw new Error(
      reportError.message
    );
  }

  const reports =
    reportRows ?? [];

  /*
   * REPORTER PROFILES
   */

  const reporterIds = [
    ...new Set(
      reports.map(
        (report) =>
          report.user_id
      )
    ),
  ];

  const reporters =
    new Map<
      string,
      {
        username:
          | string
          | null;

        display_name:
          | string
          | null;

        avatar_url:
          | string
          | null;
      }
    >();

  if (
    reporterIds.length >
    0
  ) {
    const {
      data: profiles,
      error: profileError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(`
          id,
          username,
          display_name,
          avatar_url
        `)
        .in(
          "id",
          reporterIds
        );

    if (
      profileError
    ) {
      throw new Error(
        profileError.message
      );
    }

    for (
      const profile of
      profiles ?? []
    ) {
      reporters.set(
        profile.id,
        {
          username:
            profile.username,

          display_name:
            profile.display_name,

          avatar_url:
            profile.avatar_url,
        }
      );
    }
  }

  const initialReports:
    AdminBugReport[] =
    reports.map(
      (report) => ({
        ...report,

        reporter:
          reporters.get(
            report.user_id
          ) ?? null,
      })
    ) as AdminBugReport[];

  return (
    <ReportsClient
      initialReports={
        initialReports
      }
    />
  );
}