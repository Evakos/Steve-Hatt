// Next.js aliases the real "server-only" package to a no-op on the server build and keeps its
// throwing behaviour only for client bundles. Outside that webpack pipeline (i.e. under
// Vitest/plain Node), the real package always throws — see vitest.config.ts's alias.
export {};
