"use client";

import MediaActionBar from "@/components/media/MediaActionBar";

type SeriesStatus =
  | "IN_PROGRESS"
  | "PENDING";

interface SeriesActionBarProps {
  primaryLabel: string;

  primaryDisabled?: boolean;

  activeStatus:
    | SeriesStatus
    | null;

  statusDisabled?: boolean;

  message?: string;

  onPrimaryAction: () =>
    void |
    Promise<void>;

  onStatusChange: (
    status: SeriesStatus,
  ) =>
    void |
    Promise<void>;
}

export default function SeriesActionBar({
  primaryLabel,

  primaryDisabled = false,

  activeStatus,

  statusDisabled = false,

  message,

  onPrimaryAction,
  onStatusChange,
}: SeriesActionBarProps) {
  return (
    <MediaActionBar
      primaryLabel={
        primaryLabel
      }
      primaryDisabled={
        primaryDisabled
      }
      activeStatus={
        activeStatus
      }
      statusDisabled={
        statusDisabled
      }
      statusOptions={[
        {
          value:
            "IN_PROGRESS",

          label:
            "Viendo",
        },

        {
          value:
            "PENDING",

          label:
            "Pendiente",
        },
      ]}
      onPrimaryAction={
        onPrimaryAction
      }
      onStatusChange={(
        value,
      ) => {
        if (
          value !==
            "IN_PROGRESS" &&
          value !==
            "PENDING"
        ) {
          return;
        }

        return onStatusChange(
          value,
        );
      }}
      message={
        message
      }
    />
  );
}