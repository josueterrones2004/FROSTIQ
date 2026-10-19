import DiscoverSection from "@/components/home/DiscoverSection";

import { getDiscoverItems } from "@/lib/discover";

export default async function PublicLanding() {
  const discoverItems = await getDiscoverItems().catch(
    (error) => {
      console.error(
        "Error loading public discover:",
        error,
      );

      return [];
    },
  );

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1440px] overflow-x-hidden pb-14">
      <DiscoverSection items={discoverItems} />
    </main>
  );
}