// Partnerlik basvuru - Telegram Bot bildirim endpoint'i
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    let body;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {};
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
    }

    const { name, phone, skills } = body;

    if (!name || !phone) {
      return jsonError("Ad ve telefon zorunludur", 400);
    }

    const skillsList = Array.isArray(skills) ? skills.join(", ") : (skills || "-");

    await sendTelegramNotification(env, { name, phone, skills: skillsList });

    return jsonSuccess({ success: true, message: "Basvuru alindi" });
  } catch (err) {
    return jsonError("Hata: " + err.message, 500);
  }
}

async function sendTelegramNotification(env, data) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("[TELEGRAM] BOT_TOKEN veya CHAT_ID eksik");
    return;
  }

  try {
    const message =
      "🔧 *Yeni Partnerlik Basvurusu*\n" +
      "------------------------------\n" +
      "👤 *Ad:* " + (data.name || "-") + "\n" +
      "📞 *Telefon:* " + (data.phone || "-") + "\n" +
      "🛠️ *Ustaliklar:* " + (data.skills || "-") + "\n" +
      "------------------------------\n" +
      "⏰ " + new Date().toLocaleString("tr-TR");

    await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.log("[TELEGRAM] Hata:", err.message);
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
