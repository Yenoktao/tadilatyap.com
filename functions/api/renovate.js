export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const token = env.REPLICATE_API_TOKEN;
    if (!token) {
      return jsonError("REPLICATE_API_TOKEN eksik", 500);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return jsonError("multipart/form-data bekleniyor", 400);
    }

    const formData = await request.formData();
    const command = formData.get("command");
    const imageFile = formData.get("image");
    const strength = parseFloat(formData.get("strength") || "0.35");

    if (!command || typeof command !== "string") {
      return jsonError("command zorunlu", 400);
    }
    if (!imageFile || typeof imageFile === "string") {
      return jsonError("image zorunlu (dosya)", 400);
    }

    // Goruntuyu base64'e cevir
    const imageBuffer = await imageFile.arrayBuffer();
    const base64 = arrayBufferToBase64(imageBuffer);
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Replicate flux-dev img2img
    const model = "black-forest-labs/flux-dev";
    const structuredPrompt = `Architectural renovation: ${command}. Maintain the exact same building structure, walls, roof, windows, and proportions. Only change materials, colors, and finishes. Photorealistic, high quality, detailed, natural lighting.`;

    const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          prompt: structuredPrompt,
          image: dataUrl,
          strength: Math.max(0, Math.min(1, strength)),
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
          guidance_scale: 5.0,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return jsonError(`Replicate ${res.status}: ${text.slice(0, 200)}`, 502);
    }

    const prediction = await res.json();

    if (prediction.status === "succeeded" && prediction.output) {
      let url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return jsonSuccess({ success: true, resultUrl: url, model });
    }

    // Async polling
    const id = prediction.id;
    if (id) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!poll.ok) continue;
        const d = await poll.json();
        if (d.status === "succeeded") {
          let url = Array.isArray(d.output) ? d.output[0] : d.output;
          return jsonSuccess({ success: true, resultUrl: url, model });
        }
        if (d.status === "failed" || d.status === "canceled") {
          return jsonError(`Prediction ${d.status}: ${d.error || ""}`, 500);
        }
      }
    }

    return jsonError("Timeout", 504);
  } catch (err) {
    return jsonError(`Hata: ${err.message}`, 500);
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function jsonSuccess(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
