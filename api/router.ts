import { createRouter, publicQuery } from "./middleware";
import { renovateRouter } from "./renovate";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  renovate: renovateRouter,
});

export type AppRouter = typeof appRouter;
