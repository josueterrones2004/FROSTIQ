import DiscoverSection from "@/components/home/DiscoverSection";

import {
  getDiscoverItems,
} from "@/lib/discover";

export default async function PublicLanding() {
  const discoverItems =
    await getDiscoverItems().catch(
      (
        error
      ) => {
        console.error(
          "Error loading public discover:",
          error
        );

        return [];
      }
    );

  return (
    <div className="min-w-0">
      <DiscoverSection
        items={
          discoverItems
        }
      />
    </div>
  );
}