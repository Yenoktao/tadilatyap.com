// Cloudflare Pages Function — POST /generate
// Kullanıcının yüklediği görseli + prompt'u alır,
// Cloudflare Workers AI img2img modeline gönderir,
// üretilen görseli (PNG) geri döner.

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Env kontrol
    if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
      return jsonError("CF_API_TOKEN veya CF_ACCOUNT_ID environment variable eksik", 500);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return jsonError("multipart/form-data bekleniyor", 400);
    }

    const formData = await request.formData();
    const prompt = formData.get("command") || formData.get("prompt");
    const imageFile = formData.get("image");
    const strength = parseFloat(formData.get("strength") || "0.75");
    const numSteps = parseInt(formData.get("num_steps") || "20", 10);

    if (!prompt || typeof prompt !== "string") {
      return jsonError("prompt/command zorunlu", 400);
    }
    if (!imageFile || typeof imageFile === "string") {
      return jsonError("image zorunlu (dosya)", 400);
    }

    // Görseli uint8 array'e çevir
    const imageBuffer = await imageFile.arrayBuffer();
    const imageArray = Array.from(new Uint8Array(imageBuffer));

    // Cloudflare AI img2img endpoint'i
    const model = "@cf/runwayml/stable-diffusion-v1-5-img2img";
    const url = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/${model}`;

    const aiResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        image: imageArray,
        strength: clamp(strength, 0, 1),
        num_steps: clamp(numSteps, 1, 20),
        guidance: 7.5
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return jsonError(`Cloudflare AI hatası (${aiResponse.status}): ${errText}`, 502);
    }

    // Model PNG binary döner → base64'e çevir → JSON olarak gönder
    const outBuffer = await aiResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(outBuffer);
    const dataUrl = `data:image/png;base64,${base64}`;

    return jsonSuccess({ success: true, resultUrl: dataUrl, model: "cf-stable-diffusion-img2img" });
  } catch (err) {
    return jsonError(`Sunucu hatası: ${err.message}`, 500);
  }
}

// OPTIONS — CORS preflight (gerekirse)
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function jsonSuccess(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function clamp(v, min, max) {
  if (isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}
