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

    // Model adını env'den al (varsayılan: openai/gpt-image-2 - tek görsel)
    const model = env.REPLICATE_MODEL || "openai/gpt-image-2";

    // Model'e göre parametreleri ayarla
    const inputParams = {
      prompt: command,
    };

    // img2image modelleri için image parametreleri
    if (model.includes("gpt-image")) {
      inputParams.input_images = [dataUrl];
      inputParams.aspect_ratio = "1:1";
      inputParams.quality = "low";
      inputParams.number_of_images = 1;
      inputParams.output_format = "png";
    } else if (model.includes("flux-kontext-apps/multi-image")) {
      // Multi-image kontext - iki görsel gerekli
      inputParams.input_image_1 = dataUrl;
      inputParams.input_image_2 = dataUrl; // Aynı görsel ikinci input olarak
      inputParams.aspect_ratio = "1:1";
      inputParams.output_format = "png";
      inputParams.safety_tolerance = 2;
    } else if (model.includes("openai/gpt-image-2")) {
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
      if (typeof url === "object" && url.url) url = url.url;
      if (typeof url === "string" && url.startsWith("http")) {
        // TELEGRAM BILDIRIMI - orijinal foto + komut + sonuc
        sendTelegramAIResult(env, command, url, imageBuffer, mimeType);
        return jsonSuccess({ success: true, resultUrl: url, model });
      }
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
          if (typeof url === "object" && url.url) url = url.url;
          if (typeof url === "string" && url.startsWith("http")) {
            // TELEGRAM BILDIRIMI - orijinal foto + komut + sonuc
            sendTelegramAIResult(env, command, url, imageBuffer, mimeType);
            return jsonSuccess({ success: true, resultUrl: url, model });
          }
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

// AI sonucu Telegram'a gönder - ORIJINAL FOTO + KOMUT + SONUC GORSELI
async function sendTelegramAIResult(env, command, resultUrl, imageBuffer, mimeType) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    // 1. Orijinal fotoğrafı gönder
    const blob = new Blob([imageBuffer], { type: mimeType || 'image/jpeg' });
    const form1 = new FormData();
    form1.append('chat_id', chatId);
    form1.append('photo', blob, 'orijinal-foto.jpg');
    form1.append('caption', `🎨 AI Tadilat İşlemi\n\n📝 Komut: ${command || '-'}`);

    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: form1,
    });

    // 2. AI sonuç görselini indir ve gönder (URL degil, görsel kendisi)
    const imgRes = await fetch(resultUrl);
    if (imgRes.ok) {
      const imgBuf = await imgRes.arrayBuffer();
      const imgBlob = new Blob([imgBuf], { type: 'image/png' });
      const form2 = new FormData();
      form2.append('chat_id', chatId);
      form2.append('photo', imgBlob, 'ai-sonuc.png');
      form2.append('caption', `✅ AI Sonucu\n⏰ ${new Date().toLocaleString('tr-TR')}`);

      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: form2,
      });
    } else {
      // Görsel indirilemezse URL'yi gönder
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ AI Sonucu:\n${resultUrl}`,
        }),
      });
    }
  } catch (err) {
    // Hata olsa bile sessizce devam et
  }
}

// Telegram Bot'a mesaj gönder (form bildirimleri için)
async function sendTelegramNotification(token, chatId, formData) {
  try {
    const message = `📋 *Yeni Tadilat Teklif Talebi*\n\n` +
      `👤 *Ad:* ${formData.name || '-'}` +
      `📞 *Telefon:* ${formData.phone || '-'}` +
      `📧 *Email:* ${formData.email || '-'}` +
      `💰 *Bütçe:* ${formData.budget || '-'}` +
      `📅 *Başlama:* ${formData.startDate || '-'}` +
      `📝 *Detaylar:* ${formData.notes || '-'}\n\n` +
      `⏰ ${new Date().toLocaleString('tr-TR')}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.log('[TELEGRAM] Error:', err.message);
  }
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
