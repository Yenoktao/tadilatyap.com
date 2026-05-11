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
              image_input: input.imageUrl,
              size: "2K",
              aspect_ratio: "match_input_image",
              enhance_prompt: true,
            },
          }
        );

        // Replicate output is usually a string URL or array of URLs
        const resultUrl = Array.isArray(output) ? output[0] : output;

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
              size: "2K",
              aspect_ratio: "9:16",
              enhance_prompt: true,
            },
          }
        );

        const resultUrl = Array.isArray(output) ? output[0] : output;

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
