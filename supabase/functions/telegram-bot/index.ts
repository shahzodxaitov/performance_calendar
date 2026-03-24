// Supabase Edge Function for Telegram Bot
// Path: supabase/functions/telegram-bot/index.ts

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

interface WebhookPayload {
  message?: {
    chat: { id: number };
    text: string;
  };
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const chatId = payload.message?.chat.id;
    const text = payload.message?.text;

    if (text === "/start") {
      await sendMessage(chatId!, "Xush kelibsiz! BPG Ish Kalendari boti orqali sizga vazifalar va hisobotlar yuboriladi. Iltimos, profilingizdagi chat ID ni ruxsat bering.");
    }

    // Har kuni ertalabki eslatma (Bu cron orqali alohida chaqiriladi)
    if (req.headers.get("X-Type") === "daily-report") {
       // Ma'lumotlar bazasidan bugungi vazifalarni olib, hammasiga yuborish kodi shu yerda bo'ladi
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});

async function sendMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
