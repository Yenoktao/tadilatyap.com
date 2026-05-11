import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

export const renovateRouter = createRouter({
  generate: publicQuery
    .input(
      z.object({
        imageUrl: z.string().url(),
        command: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const output = await replicate.run(
          "bytedance/seedream-4",
          {
            input: {
              prompt: `A premium interior renovation of the following room: ${input.command}. Highly detailed, architectural photography style, 8K quality, photorealistic. Preserve the structural layout including windows, walls, and doors. Use high-end modern materials and lighting.`,
              image: input.imageUrl,
              width: 1024,
              height: 1024,
            },
          }
        );

        // Replicate output can be string URL, array of URLs, or ReadableStream
        let resultUrl: string | null = null;
        if (Array.isArray(output) && output.length > 0) {
          resultUrl = typeof output[0] === 'string' ? output[0] : null;
        } else if (typeof output === 'string') {
          resultUrl = output;
        }

        return {
          success: true,
          resultUrl: typeof resultUrl === "string" ? resultUrl : null,
        };
      } catch (error) {
        console.error("Replicate error:", error);
        return {
          success: false,
          resultUrl: null,
          error: "AI generation failed. Please try again.",
        };
      }
    }),

  // Endpoint for manual entry (no photo) - generates from prompt only
  generateFromPrompt: publicQuery
    .input(
      z.object({
        command: z.string().min(1),
        metrekare: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const output = await replicate.run(
          "bytedance/seedream-4",
          {
            input: {
              prompt: `Premium interior renovation visualization: ${input.command}. ${input.metrekare ? `Space approximately ${input.metrekare} square meters.` : ""} Photorealistic architectural photography, 8K quality, modern luxury design, natural lighting, high-end materials.`,
              width: 1024,
              height: 1024,
            },
          }
        );

        let resultUrl: string | null = null;
        if (Array.isArray(output) && output.length > 0) {
          resultUrl = typeof output[0] === 'string' ? output[0] : null;
        } else if (typeof output === 'string') {
          resultUrl = output;
        }

        return {
          success: true,
          resultUrl: typeof resultUrl === "string" ? resultUrl : null,
        };
      } catch (error) {
        console.error("Replicate error:", error);
        return {
          success: false,
          resultUrl: null,
          error: "AI generation failed. Please try again.",
        };
      }
    }),
});
