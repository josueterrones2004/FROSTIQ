export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-[1280px] pb-24">
      <div className="animate-pulse">
        {/* HEADER */}

        <div className="border-b border-zinc-800 pb-6">
          <div className="h-3 w-40 rounded bg-zinc-900" />

          <div className="mt-4 h-10 w-64 rounded bg-zinc-900" />

          <div className="mt-3 h-4 w-24 rounded bg-zinc-900" />
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_250px]">
          {/* RESULTS */}

          <div>
            <div className="mb-8">
              <div className="mb-3 h-3 w-32 rounded bg-zinc-900" />

              <div className="flex gap-5 rounded-xl border border-zinc-900 p-5">
                <div className="h-[156px] w-[104px] shrink-0 rounded-lg bg-zinc-900" />

                <div className="flex-1 py-2">
                  <div className="h-6 w-1/2 rounded bg-zinc-900" />

                  <div className="mt-4 h-4 w-24 rounded bg-zinc-900" />

                  <div className="mt-4 h-3 w-2/3 rounded bg-zinc-900" />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-900">
              {[
                1,
                2,
                3,
                4,
                5,
                6,
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="flex gap-5 border-b border-zinc-900 py-5"
                  >
                    <div className="h-[120px] w-20 shrink-0 rounded-lg bg-zinc-900" />

                    <div className="flex-1 py-2">
                      <div className="h-5 w-1/2 rounded bg-zinc-900" />

                      <div className="mt-3 h-4 w-20 rounded bg-zinc-900" />

                      <div className="mt-4 h-3 w-2/3 rounded bg-zinc-900" />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* FILTERS */}

          <div className="hidden border-l border-zinc-900 pl-7 lg:block">
            <div className="h-3 w-20 rounded bg-zinc-900" />

            <div className="mt-6 space-y-3">
              {[
                1,
                2,
                3,
                4,
                5,
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="h-8 rounded bg-zinc-900/70"
                  />
                )
              )}
            </div>

            <div className="mt-8 border-t border-zinc-900 pt-6">
              <div className="h-3 w-28 rounded bg-zinc-900" />

              <div className="mt-5 space-y-3">
                {[
                  1,
                  2,
                  3,
                  4,
                ].map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item
                      }
                      className="h-8 rounded bg-zinc-900/70"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}