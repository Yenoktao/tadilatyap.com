// Cloudflare Pages Functions — Raw API (no Hono, no framework)
// Handles all /api/* requests

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET /api/debug — Token kontrolü
  if (path === "/api/debug" && request.method === "GET") {
    return new Response(
      JSON.stringify({
        ok: true,
        hasToken: !!env.REPLICATE_API_TOKEN,
        tokenLength: env.REPLICATE_API_TOKEN?.length || 0,
        timestamp: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );
  }

  // GET /api/health — Sağlık kontrolü
  if (path === "/api/health" && request.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, env: !!env.REPLICATE_API_TOKEN }),
      { headers: corsHeaders }
    );
  }

  // POST /api/renovate — AI görsel üretimi
  if (path === "/api/renovate" && request.method === "POST") {
    const token = env.REPLICATE_API_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "REPLICATE_API_TOKEN not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    try {
      // Parse request body
      const body = await request.json();
      const { imageUrl, command } = body;

      if (!command) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing 'command' field" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const prompt = `A premium interior renovation: ${command}. Highly detailed, architectural photography style, 8K quality, photorealistic.`;

      // Call Replicate API
      const replicateInput: any = {
        prompt,
        width: 1024,
        height: 1024,
      };
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
        return new Response(
          JSON.stringify({ success: false, error: `Replicate error ${createRes.status}: ${errText.slice(0, 200)}` }),
          { status: 500, headers: corsHeaders }
        );
      }

      const prediction = (await createRes.json()) as any;

      // If synchronous wait succeeded
      if (prediction.status === "succeeded" && prediction.output) {
        const output = prediction.output;
        let resultUrl: string | null = null;
        if (Array.isArray(output) && output.length > 0) {
          resultUrl = typeof output[0] === "string" ? output[0] : null;
        } else if (typeof output === "string") {
          resultUrl = output;
        }
        return new Response(
          JSON.stringify({ success: true, resultUrl }),
          { headers: corsHeaders }
        );
      }

      // Async: poll for result
      const predictionId = prediction.id;
      if (!predictionId) {
        return new Response(
          JSON.stringify({ success: false, error: "No prediction ID" }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Poll
      let result: any = null;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const pollRes = await fetch(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          { headers: { Authorization: `Token ${token}` } }
        );
        if (!pollRes.ok) continue;
        const pollData = (await pollRes.json()) as any;
        if (pollData.status === "succeeded") {
          result = pollData.output;
          break;
        }
        if (pollData.status === "failed" || pollData.status === "canceled") {
          return new Response(
            JSON.stringify({ success: false, error: `Prediction ${pollData.status}` }),
            { status: 500, headers: corsHeaders }
          );
        }
      }

      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: "Prediction timed out" }),
          { status: 504, headers: corsHeaders }
        );
      }

      let resultUrl: string | null = null;
      if (Array.isArray(result) && result.length > 0) {
        resultUrl = typeof result[0] === "string" ? result[0] : null;
      } else if (typeof result === "string") {
        resultUrl = result;
      }

      return new Response(
        JSON.stringify({ success: true, resultUrl }),
        { headers: corsHeaders }
      );

    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err.message || "Unknown error" }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // 404 for unknown paths
  return new Response(
    JSON.stringify({ error: "Not found", path }),
    { status: 404, headers: corsHeaders }
  );
};
