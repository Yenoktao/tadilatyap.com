import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../api/router";
import { createContext } from "../../../api/context";

// Cloudflare Pages Functions - catch-all for /api/* routes
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Only handle /api/trpc/* requests
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/trpc")) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: (opts) => createContext(opts, env),
  });
};
