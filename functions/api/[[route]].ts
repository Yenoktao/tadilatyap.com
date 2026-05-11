import { Hono } from "hono";
import { cors } from "hono/cors";

// ─── Simple REST API for Cloudflare Pages ───
const app = new Hono<{ Bindings: { REPLICATE_API_TOKEN: string } }>();

// CORS - allow all origins (Cloudflare Pages handles this internally,
// but we add it for safety when testing)
app.use("/*", cors({ origin: "*" }));

// Health check
app.get("/health", (c) => c.json({ ok: true, env: !!c.env.REPLICATE_API_TOKEN }));

// Debug endpoint - verify API is reachable
app.get("/debug", (c) => {
  return c.json({
    ok: true,
    message: "API is reachable",
    timestamp: new Date().toISOString(),
    hasToken: !!c.env.REPLICATE_API_TOKEN,
    tokenLength: c.env.REPLICATE_API_TOKEN?.length || 0,
  });
});

// Replicate AI generation endpoint
app.post("/renovate", async (c) => {
  console.log("[/api/renovate] POST received");

  const env = c.env;
  const token = env.REPLICATE_API_TOKEN;

  if (!token) {
    console.error("[/api/renovate] REPLICATE_API_TOKEN not configured");
    return c.json({ success: false, error: "REPLICATE_API_TOKEN not configured in Cloudflare environment variables" }, 500);
  }

  // Parse request body
  let body: { imageUrl?: string; command?: string };
  try {
    body = await c.req.json();
    console.log("[/api/renovate] Body parsed:", { imageUrl: body.imageUrl?.slice(0, 50), command: body.command?.slice(0, 50) });
  } catch (parseErr) {
    console.error("[/api/renovate] Failed to parse request body:", parseErr);
    return c.json({ success: false, error: "Invalid JSON in request body" }, 400);
  }

  const { imageUrl, command } = body;

  if (!command) {
    return c.json({ success: false, error: "Missing 'command' field" }, 400);
  }

  try {
    const prompt = `A premium interior renovation of the following room: ${command}. Highly detailed, architectural photography style, 8K quality, photorealistic. Preserve the structural layout including windows, walls, and doors. Use high-end modern materials and lighting.`;

    console.log("[/api/renovate] Creating Replicate prediction...");

    // Step 1: Create prediction
    const replicateInput: any = {
      prompt,
      width: 1024,
      height: 1024,
    };

    if (imageUrl) {
      replicateInput.image = imageUrl;
    }

    const createRes = await fetch(
      "https://api.replicate.com/v1/models/bytedance/seedream-4/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
          "Prefer": "wait", // Try synchronous first (up to 60s)
        },
        body: JSON.stringify({ input: replicateInput }),
      }
    );

    console.log("[/api/renovate] Replicate create response status:", createRes.status);

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[/api/renovate] Replicate create error:", createRes.status, errText);
      return c.json({ success: false, error: `Replicate API error ${createRes.status}: ${errText.slice(0, 200)}` }, 500);
    }

    const prediction = await createRes.json() as any;
    console.log("[/api/renovate] Prediction created:", prediction.id, "status:", prediction.status);

    // If synchronous wait succeeded immediately
    if (prediction.status === "succeeded" && prediction.output) {
      let resultUrl: string | null = null;
      const output = prediction.output;
      if (Array.isArray(output) && output.length > 0) {
        resultUrl = typeof output[0] === "string" ? output[0] : null;
      } else if (typeof output === "string") {
        resultUrl = output;
      }
      console.log("[/api/renovate] Synchronous result:", resultUrl?.slice(0, 80));
      return c.json({ success: true, resultUrl });
    }

    const predictionId = prediction.id;
    if (!predictionId) {
      return c.json({ success: false, error: "No prediction ID returned" }, 500);
    }

    // Step 2: Poll for result
    console.log("[/api/renovate] Polling for result...");
    let result: any = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        { headers: { Authorization: `Token ${token}` } }
      );

      if (!pollRes.ok) {
        console.log(`[/api/renovate] Poll ${i}: HTTP ${pollRes.status}`);
        continue;
      }

      const pollData = await pollRes.json() as any;
      console.log(`[/api/renovate] Poll ${i}: status=${pollData.status}`);

      if (pollData.status === "succeeded") {
        result = pollData.output;
        break;
      }
      if (pollData.status === "failed" || pollData.status === "canceled") {
        return c.json({ success: false, error: `Prediction ${pollData.status}: ${pollData.error || "Unknown error"}` }, 500);
      }
    }

    if (!result) {
      return c.json({ success: false, error: "Prediction timed out after 60 seconds" }, 504);
    }

    // Parse output
    let resultUrl: string | null = null;
    if (Array.isArray(result) && result.length > 0) {
      resultUrl = typeof result[0] === "string" ? result[0] : null;
    } else if (typeof result === "string") {
      resultUrl = result;
    }

    console.log("[/api/renovate] Result URL:", resultUrl?.slice(0, 80));
    return c.json({ success: true, resultUrl });

  } catch (err: any) {
    console.error("[/api/renovate] Unhandled error:", err.message);
    return c.json({ success: false, error: err.message || "AI generation failed" }, 500);
  }
});

// ─── Cloudflare Pages export ───
export const onRequest = (context: any) => {
  return app.fetch(context.request, context.env);
};
