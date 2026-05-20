// Teklif formu - Telegram Bot bildirim endpoint'i
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const contentType = request.headers.get("content-type") || "";
    let body;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {};
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
    }

    const { name, phone, email, budget, startDate, notes } = body;

    if (!name || !phone) {
      return jsonError("Ad ve telefon zorunludur", 400);
    }

    const formPayload = { name, phone, email: email || "", budget: budget || "", startDate: startDate || "", notes: notes || "" };

    // Telegram bildirimi - asenkron, hata olursa form yine basarili sayilir
    const tgResult = await sendTelegramNotification(env, formPayload);
    console.log("[TELEGRAM] Result:", tgResult);

    return jsonSuccess({ success: true, message: "Teklif talebi alindi", telegram: tgResult });
  } catch (err) {
    console.error("[TEKLIF] Hata:", err.message);
    return jsonError(`Hata: ${err.message}`, 500);
  }
}

// Telegram Bot'a mesaj gonder - duz metin, MarkdownV2 yok
async function sendTelegramNotification(env, formData) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return "SKIP: BOT_TOKEN veya CHAT_ID eksik";
  }

  try {
    // Duz metin - escape karakteri yok
    const message =
      "📋 Yeni Tadilat Teklif Talebi\n" +
      "------------------------------\n" +
      "👤 Ad: " + (formData.name || "-") + "\n" +
      "📞 Telefon: " + (formData.phone || "-") + "\n" +
      "📧 Email: " + (formData.email || "-") + "\n" +
      "💰 Butce: " + (formData.budget || "-") + "\n" +
      "📅 Baslama: " + (formData.startDate || "-") + "\n" +
      "📝 Detaylar: " + (formData.notes || "-") + "\n" +
      "------------------------------\n" +
      "⏰ " + new Date().toLocaleString("tr-TR");

    const res = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        // Markdown kullanmiyoruz - duz metin
      }),
    });

    const responseText = await res.text();
    console.log("[TELEGRAM] API status:", res.status, "Response:", responseText.substring(0, 200));

    if (!res.ok) {
      return "ERROR: " + res.status + " " + responseText.substring(0, 100);
    }

    return "OK";
  } catch (err) {
    console.error("[TELEGRAM] Exception:", err.message);
    return "ERROR: " + err.message;
  }
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
