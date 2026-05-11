import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";

// Cloudflare Pages Functions - tRPC API handler
// Handles all /api/* requests
export const onRequest = async (context: any) => {
  const { request, env } = context;

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: (opts) => createContext(opts, env),
  });
};
