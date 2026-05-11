import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../api/router";
import { createContext } from "../../../api/context";

// Cloudflare Pages Functions - tRPC API handler
// This file handles all /api/* requests
// tRPC endpoint is /api/trpc
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: (opts) => createContext(opts, env),
  });
};
