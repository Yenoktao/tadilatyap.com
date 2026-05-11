import { Hono } from "hono";

// ─── Simple REST API for Cloudflare Pages ───
const app = new Hono<{ Bindings: { REPLICATE_API_TOKEN: string } }>();

// Health check
app.get("/health", (c) => c.json({ ok: true }));

// Replicate AI generation endpoint
app.post("/renovate", async (c) => {
  const env = c.env;
  const token = env.REPLICATE_API_TOKEN;
  if (!token) {
    return c.json({ success: false, error: "REPLICATE_API_TOKEN not configured" }, 500);
  }

  try {
    const body = await c.req.json();
    const { imageUrl, command } = body;

    const prompt = `A premium interior renovation of the following room: ${command}. Highly detailed, architectural photography style, 8K quality, photorealistic. Preserve the structural layout including windows, walls, and doors. Use high-end modern materials and lighting.`;

    // Step 1: Create prediction
    const createRes = await fetch(
      "https://api.replicate.com/v1/models/bytedance/seedream-4/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt,
            ...(imageUrl ? { image: imageUrl } : {}),
            width: 1024,
            height: 1024,
          },
        }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      return c.json({ success: false, error: `Replicate error: ${createRes.status} - ${errText}` }, 500);
    }

    const prediction = await createRes.json() as any;
    const predictionId = prediction.id;
    if (!predictionId) {
      return c.json({ success: false, error: "No prediction ID" }, 500);
    }

    // Step 2: Poll for result
    let result: any = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        { headers: { Authorization: `Token ${token}` } }
      );

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json() as any;

      if (pollData.status === "succeeded") {
        result = pollData.output;
        break;
      }
      if (pollData.status === "failed" || pollData.status === "canceled") {
        return c.json({ success: false, error: `Prediction ${pollData.status}` }, 500);
      }
    }

    if (!result) {
      return c.json({ success: false, error: "Prediction timed out" }, 504);
    }

    // Parse output
    let resultUrl: string | null = null;
    if (Array.isArray(result) && result.length > 0) {
      resultUrl = typeof result[0] === "string" ? result[0] : null;
    } else if (typeof result === "string") {
      resultUrl = result;
    }

    return c.json({ success: true, resultUrl });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || "AI generation failed" }, 500);
  }
});

// ─── Cloudflare Pages export ───
export const onRequest = (context: any) => {
  return app.fetch(context.request, context.env);
};
