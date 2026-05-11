import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

// Cloudflare Pages environment type
export interface Env {
  REPLICATE_API_TOKEN: string;
  DATABASE_URL?: string;
}

// Build context for each request
export function createContext(
  _opts: FetchCreateContextFnOptions,
  env?: Env
) {
  return {
    env,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
