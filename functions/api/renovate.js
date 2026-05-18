export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const token = env.REPLICATE_API_TOKEN;
    if (!token) return jsonError("REPLICATE_API_TOKEN eksik", 500);

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return jsonError("multipart/form-data bekleniyor", 400);
    }

    const formData = await request.formData();
    const command = formData.get("command");
    const imageFile = formData.get("image");

    if (!command || typeof command !== "string") return jsonError("command zorunlu", 400);
    if (!imageFile || typeof imageFile === "string") return jsonError("image zorunlu (dosya)", 400);

    // Görseli base64'e çevir
    const imageBuffer = await imageFile.arrayBuffer();
    const base64 = arrayBufferToBase64(imageBuffer);
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Model adını env'den al (varsayılan: flux-kontext-pro - tek görsel)
    const model = env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-pro";

    // Model'e göre parametreleri ayarla
    const inputParams = {
      prompt: command,
    };

    // img2image modelleri için image parametreleri
    if (model.includes("gpt-image")) {
      inputParams.input_images = [dataUrl];
      inputParams.aspect_ratio = "1:1";
      inputParams.quality = "medium";
      inputParams.number_of_images = 1;
      inputParams.output_format = "png";
    } else if (model.includes("flux-kontext-apps/multi-image")) {
      // Multi-image kontext - iki görsel gerekli
      inputParams.input_image_1 = dataUrl;
      inputParams.input_image_2 = dataUrl; // Aynı görsel ikinci input olarak
      inputParams.aspect_ratio = "1:1";
      inputParams.output_format = "png";
      inputParams.safety_tolerance = 2;
    } else if (model.includes("black-forest-labs/flux-kontext-pro")) {
      // FLUX Kontext Pro - tek görsel, prompt editing
      inputParams.input_image = dataUrl;
      inputParams.aspect_ratio = "match_input_image";
      inputParams.output_format = "png";
      inputParams.safety_tolerance = 2;
    } else if (model.includes("flux-dev")) {
      inputParams.image = dataUrl;
      inputParams.num_outputs = 1;
      inputParams.aspect_ratio = "1:1";
      inputParams.output_format = "png";
      inputParams.guidance_scale = 5.0;
    } else {
      // Varsayılan: image referans olarak gönder
      inputParams.image = dataUrl;
      inputParams.num_outputs = 1;
      inputParams.aspect_ratio = "1:1";
      inputParams.output_format = "png";
    }

    const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input: inputParams }),
    });

    if (!res.ok) {
      const text = await res.text();
      return jsonError(`Replicate ${res.status}: ${text.slice(0, 200)}`, 502);
    }

    const prediction = await res.json();

    if (prediction.status === "succeeded" && prediction.output) {
      let url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      if (typeof url === "string" && url.startsWith("http")) return jsonSuccess({ success: true, resultUrl: url, model });
      if (typeof url === "object" && url.url) return jsonSuccess({ success: true, resultUrl: url.url, model });
    }

    // Async poll
    const id = prediction.id;
    if (id) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!poll.ok) continue;
        const d = await poll.json();
        if (d.status === "succeeded") {
          let url = Array.isArray(d.output) ? d.output[0] : d.output;
          if (typeof url === "string" && url.startsWith("http")) return jsonSuccess({ success: true, resultUrl: url, model });
          if (typeof url === "object" && url.url) return jsonSuccess({ success: true, resultUrl: url.url, model });
        }
        if (d.status === "failed" || d.status === "canceled") return jsonError(`Prediction ${d.status}: ${d.error || ""}`, 500);
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
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function jsonSuccess(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}
