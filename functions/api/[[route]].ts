import { Hono } from "hono";
import { cors } from "hono/cors";

// ─── Cloudflare Pages Functions — Hono REST API ───
// IMPORTANT: This file is served at /api/* via Cloudflare Pages Functions.
// Hono basePath is set to "/api" so routes are relative to /api/.
// e.g., app.get("/debug") handles GET /api/debug

const app = new Hono<{ Bindings: { REPLICATE_API_TOKEN: string } }>();

// CORS
app.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

// ─── Routes (relative to /api) ───

// GET /api/debug
app.get("/debug", async (c) => {
  const token = c.env.REPLICATE_API_TOKEN;
  return c.json({
    ok: true,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health
app.get("/health", (c) => c.json({ ok: true }));

// POST /api/renovate
app.post("/renovate", async (c) => {
  const token = c.env.REPLICATE_API_TOKEN;

  if (!token) {
    return c.json({
      success: false,
      error: "REPLICATE_API_TOKEN not configured. Set it in Cloudflare Dashboard > Workers & Pages > tadilatyap > Settings > Environment Variables",
    }, 500);
  }

  // Parse request body
  let body: { imageUrl?: string; command?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { imageUrl, command } = body;

  if (!command) {
    return c.json({ success: false, error: "Missing 'command' field" }, 400);
  }

  try {
    const prompt = `A premium interior renovation: ${command}. Highly detailed, architectural photography style, 8K quality, photorealistic. Preserve windows, walls, doors.`;

    const input: any = { prompt, width: 1024, height: 1024 };
    if (imageUrl) input.image = imageUrl;

    const res = await fetch(
      "https://api.replicate.com/v1/models/bytedance/seedream-4/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({ input }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return c.json({ success: false, error: `Replicate ${res.status}: ${text.slice(0, 200)}` }, 500);
    }

    const prediction = (await res.json()) as any;

    // If synchronous wait succeeded
    if (prediction.status === "succeeded" && prediction.output) {
      const out = prediction.output;
      let resultUrl: string | null = null;
      if (Array.isArray(out) && out.length > 0) resultUrl = typeof out[0] === "string" ? out[0] : null;
      else if (typeof out === "string") resultUrl = out;
      return c.json({ success: true, resultUrl });
    }

    // Poll for async result
    const id = prediction.id;
    if (!id) return c.json({ success: false, error: "No prediction ID" }, 500);

    let result: any = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!poll.ok) continue;
      const data = (await poll.json()) as any;
      if (data.status === "succeeded") { result = data.output; break; }
      if (data.status === "failed" || data.status === "canceled") {
        return c.json({ success: false, error: `Prediction ${data.status}` }, 500);
      }
    }

    if (!result) return c.json({ success: false, error: "Timeout" }, 504);

    let resultUrl: string | null = null;
    if (Array.isArray(result) && result.length > 0) resultUrl = typeof result[0] === "string" ? result[0] : null;
    else if (typeof result === "string") resultUrl = result;

    return c.json({ success: true, resultUrl });

  } catch (err: any) {
    return c.json({ success: false, error: err.message || "AI failed" }, 500);
  }
});

// ─── Cloudflare Pages Export ───
export const onRequest = (context: any) => {
  return app.fetch(context.request, context.env);
};
