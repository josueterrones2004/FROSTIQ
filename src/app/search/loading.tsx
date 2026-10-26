export default function SearchLoading() {
  return (
    <main
      className="mx-auto pb-24"
      style={{ maxWidth: 1280 }}
    >
      <style>{`
        @media (min-width: 1024px) {
          .frost-search-results-layout {
            grid-template-columns: minmax(0, 1fr) 250px;
          }
        }
      `}</style>

      <div className="animate-pulse">
        {/* HEADER */}

        <div className="border-b border-frost-border pb-6">
          <div className="h-3 w-40 rounded bg-frost-surface" />
          <div className="mt-4 h-10 w-64 rounded bg-frost-surface" />
          <div className="mt-3 h-4 w-24 rounded bg-frost-surface" />
        </div>

        <div className="frost-search-results-layout mt-8 grid gap-12">
          {/* RESULTS */}

          <div>
            <div className="mb-8">
              <div className="mb-3 h-3 w-32 rounded bg-frost-surface" />

              <div className="flex gap-5 rounded-xl border border-frost-border p-5">
                <div
                  className="shrink-0 rounded-lg bg-frost-surface"
                  style={{
                    height: 156,
                    width: 104,
                  }}
                />

                <div className="flex-1 py-2">
                  <div className="h-6 w-1/2 rounded bg-frost-surface" />
                  <div className="mt-4 h-4 w-24 rounded bg-frost-surface" />
                  <div className="mt-4 h-3 w-2/3 rounded bg-frost-surface" />
                </div>
              </div>
            </div>

            <div className="border-t border-frost-border">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="flex gap-5 border-b border-frost-border py-5"
                >
                  <div
                    className="w-20 shrink-0 rounded-lg bg-frost-surface"
                    style={{ height: 120 }}
                  />

                  <div className="flex-1 py-2">
                    <div className="h-5 w-1/2 rounded bg-frost-surface" />
                    <div className="mt-3 h-4 w-20 rounded bg-frost-surface" />
                    <div className="mt-4 h-3 w-2/3 rounded bg-frost-surface" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FILTERS */}

          <div className="hidden border-l border-frost-border pl-7 lg:block">
            <div className="h-3 w-20 rounded bg-frost-surface" />

            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-8 rounded bg-frost-surface/70"
                />
              ))}
            </div>

            <div className="mt-8 border-t border-frost-border pt-6">
              <div className="h-3 w-28 rounded bg-frost-surface" />

              <div className="mt-5 space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-8 rounded bg-frost-surface/70"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}