import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// ─── Cloudflare Pages Functions — Hono + REST API ───
const app = new Hono<{ Bindings: { REPLICATE_API_TOKEN: string } }>();

// Middleware: CORS + Logging
app.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

app.use("/*", logger());

// ─── Routes ───

// GET /api/debug — Token + env kontrolü
app.get("/debug", async (c) => {
  const env = c.env;
  const token = env.REPLICATE_API_TOKEN;
  return c.json({
    ok: true,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health — Sağlık kontrolü
app.get("/health", (c) => {
  return c.json({ ok: true, env: !!c.env.REPLICATE_API_TOKEN });
});

// POST /api/renovate — AI görsel üretimi
app.post("/renovate", async (c) => {
  const env = c.env;
  const token = env.REPLICATE_API_TOKEN;

  if (!token) {
    return c.json({ success: false, error: "REPLICATE_API_TOKEN not configured" }, 500);
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

    // Step 1: Create Replicate prediction
    const replicateInput: any = { prompt, width: 1024, height: 1024 };
    if (imageUrl) replicateInput.image = imageUrl;

    const createRes = await fetch(
      "https://api.replicate.com/v1/models/bytedance/seedream-4/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({ input: replicateInput }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      return c.json({ success: false, error: `Replicate ${createRes.status}: ${errText.slice(0, 200)}` }, 500);
    }

    const prediction = (await createRes.json()) as any;

    // If synchronous wait succeeded
    if (prediction.status === "succeeded" && prediction.output) {
      const output = prediction.output;
      let resultUrl: string | null = null;
      if (Array.isArray(output) && output.length > 0) resultUrl = typeof output[0] === "string" ? output[0] : null;
      else if (typeof output === "string") resultUrl = output;
      return c.json({ success: true, resultUrl });
    }

    // Step 2: Poll for async result
    const predictionId = prediction.id;
    if (!predictionId) return c.json({ success: false, error: "No prediction ID" }, 500);

    let result: any = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        { headers: { Authorization: `Token ${token}` } }
      );
      if (!pollRes.ok) continue;
      const pollData = (await pollRes.json()) as any;
      if (pollData.status === "succeeded") { result = pollData.output; break; }
      if (pollData.status === "failed" || pollData.status === "canceled") {
        return c.json({ success: false, error: `Prediction ${pollData.status}` }, 500);
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
