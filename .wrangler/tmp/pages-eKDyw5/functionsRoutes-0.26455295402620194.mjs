import { onRequestOptions as __api_renovate_js_onRequestOptions } from "/mnt/agents/output/app/functions/api/renovate.js"
import { onRequestPost as __api_renovate_js_onRequestPost } from "/mnt/agents/output/app/functions/api/renovate.js"

export const routes = [
    {
      routePath: "/api/renovate",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_renovate_js_onRequestOptions],
    },
  {
      routePath: "/api/renovate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_renovate_js_onRequestPost],
    },
  ]