// Stand-in for the `server-only` package under Vitest (aliased in
// vitest.config.ts). Next.js itself replaces `server-only` with an empty
// module for server bundles and a throwing one for client bundles; outside
// Next's webpack/turbopack build (i.e. under plain Node/Vitest) the real
// package throws unconditionally on import, so tests alias it to this no-op.
export {};
