// Revize endpoint - Orijinal foto + AI sonucu + yeni komut
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const token = env.REPLICATE_API_TOKEN;
    if (!token) return jsonError("REPLICATE_API_TOKEN eksik", 500);

    const formData = await request.formData();
    const command = formData.get("command");
    const imageFile = formData.get("image");
    const prevResultUrl = formData.get("prevResultUrl");

    if (!command || typeof command !== "string") return jsonError("command zorunlu", 400);
    if (!imageFile || typeof imageFile === "string") return jsonError("image zorunlu", 400);

    // Orijinal görseli base64'e çevir
    const imageBuffer = await imageFile.arrayBuffer();
    const base64 = arrayBufferToBase64(imageBuffer);
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const model = env.REPLICATE_MODEL || "openai/gpt-image-2";

    // Input images array - orijinal + önceki AI sonucu (varsa)
    const inputImages = [dataUrl];

    // Önceki AI sonucu URL'sini indirip base64'e çevir
    if (prevResultUrl && typeof prevResultUrl === 'string' && prevResultUrl.startsWith('http')) {
      try {
        const imgRes = await fetch(prevResultUrl);
        if (imgRes.ok) {
          const imgBuf = await imgRes.arrayBuffer();
          const imgBase64 = arrayBufferToBase64(imgBuf);
          const imgMime = imgRes.headers.get('content-type') || 'image/png';
          inputImages.push(`data:${imgMime};base64,${imgBase64}`);
        }
      } catch {
        // İndirilemezse sadece orijinal gönder
      }
    }

    const inputParams = {
      prompt: command,
      input_images: inputImages,
      aspect_ratio: "1:1",
      quality: "low",
      number_of_images: 1,
      output_format: "png",
    };

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
        // TELEGRAM BILDIRIMI - Revize sonucu
        context.waitUntil(sendTelegramAIResult(env, command, url, imageBuffer, mimeType));
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
            // TELEGRAM BILDIRIMI - Revize sonucu
            context.waitUntil(sendTelegramAIResult(env, command, url, imageBuffer, mimeType));
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

// AI sonucu Telegram'a gönder - ORIJINAL FOTO + KOMUT + SONUC GORSELI (REVIZE)
async function sendTelegramAIResult(env, command, resultUrl, imageBuffer, mimeType) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  
  console.log('[TELEGRAM REVIZE] Basladi. Token:', !!token, 'ChatID:', !!chatId);
  
  if (!token || !chatId) {
    console.log('[TELEGRAM REVIZE] EKSİK: BOT_TOKEN veya CHAT_ID yok!');
    return;
  }

  try {
    // 1. Orijinal fotoğrafı gönder
    console.log('[TELEGRAM REVIZE] 1. Orijinal foto gonderiliyor...');
    const blob = new Blob([imageBuffer], { type: mimeType || 'image/jpeg' });
    const form1 = new FormData();
    form1.append('chat_id', chatId);
    form1.append('photo', blob, 'orijinal-foto.jpg');
    form1.append('caption', `🔄 REVIZE İşlemi\n\n📝 Komut: ${command || '-'}`);

    const res1 = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: form1,
    });
    console.log('[TELEGRAM REVIZE] 1. Sonuc:', res1.status);

    // 2. AI sonuç görselini indir ve gönder
    console.log('[TELEGRAM REVIZE] 2. Sonuc gorseli indiriliyor:', resultUrl);
    const imgRes = await fetch(resultUrl);
    console.log('[TELEGRAM REVIZE] 2. Indirme sonuc:', imgRes.status);
    
    if (imgRes.ok) {
      const imgBuf = await imgRes.arrayBuffer();
      const imgBlob = new Blob([imgBuf], { type: 'image/png' });
      const form2 = new FormData();
      form2.append('chat_id', chatId);
      form2.append('photo', imgBlob, 'ai-revize-sonuc.png');
      form2.append('caption', `✅ Revize Sonucu\n⏰ ${new Date().toLocaleString('tr-TR')}`);

      const res2 = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: form2,
      });
      console.log('[TELEGRAM REVIZE] 2. Sonuc gorseli gonderildi:', res2.status);
    } else {
      // Görsel indirilemezse URL'yi gönder
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Revize Sonucu:\n${resultUrl}`,
        }),
      });
    }
    console.log('[TELEGRAM REVIZE] TAMAMLANDI');
  } catch (err) {
    console.log('[TELEGRAM REVIZE] HATA:', err.message);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}
