import { createRouter, publicProcedure } from "./middleware";
import { z } from "zod";

// Replicate API call using native fetch (Edge-compatible)
async function callReplicate(
  env: { REPLICATE_API_TOKEN: string } | undefined,
  imageUrl: string | undefined,
  prompt: string
) {
  const token = env?.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not configured");

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
    const err = await createRes.json();
    throw new Error(err.detail || "Failed to create Replicate prediction");
  }

  const prediction = await createRes.json();
  const predictionId = prediction.id;
  if (!predictionId) throw new Error("No prediction ID returned");

  // Step 2: Poll for result (max ~25s, ~15 retries)
  let result: any = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { Authorization: `Token ${token}` },
      }
    );

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();

    if (pollData.status === "succeeded") {
      result = pollData.output;
      break;
    }

    if (pollData.status === "failed" || pollData.status === "canceled") {
      throw new Error(`Prediction ${pollData.status}: ${pollData.error}`);
    }
  }

  if (!result) throw new Error("Prediction timed out");

  // Parse output - can be string URL or array of URLs
  let resultUrl: string | null = null;
  if (Array.isArray(result) && result.length > 0) {
    resultUrl = typeof result[0] === "string" ? result[0] : null;
  } else if (typeof result === "string") {
    resultUrl = result;
  }

  return resultUrl;
}

// ─── Renovate Router ───
const renovateRouter = createRouter({
  generate: publicProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        command: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const prompt = `A premium interior renovation of the following room: ${input.command}. Highly detailed, architectural photography style, 8K quality, photorealistic. Preserve the structural layout including windows, walls, and doors. Use high-end modern materials and lighting.`;

        const resultUrl = await callReplicate(ctx.env, input.imageUrl, prompt);

        return {
          success: true,
          resultUrl,
        };
      } catch (error: any) {
        console.error("Replicate error:", error.message);
        return {
          success: false,
          resultUrl: null,
          error: error.message || "AI generation failed",
        };
      }
    }),

  generateFromPrompt: publicProcedure
    .input(
      z.object({
        command: z.string().min(1),
        metrekare: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const prompt = `Premium interior renovation visualization: ${input.command}. ${input.metrekare ? `Space approximately ${input.metrekare} square meters.` : ""} Photorealistic architectural photography, 8K quality, modern luxury design, natural lighting, high-end materials.`;

        const resultUrl = await callReplicate(ctx.env, undefined, prompt);

        return {
          success: true,
          resultUrl,
        };
      } catch (error: any) {
        console.error("Replicate error:", error.message);
        return {
          success: false,
          resultUrl: null,
          error: error.message || "AI generation failed",
        };
      }
    }),
});

// ─── App Router ───
export const appRouter = createRouter({
  ping: publicProcedure.query(() => ({ ok: true, ts: Date.now() })),
  renovate: renovateRouter,
});

// ─── Type export for frontend ───
export type AppRouter = typeof appRouter;
