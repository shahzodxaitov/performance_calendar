// API route to set/remove Telegram webhook
import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export async function POST(request: NextRequest) {
  try {
    const { action, url } = await request.json();

    if (action === "set") {
      // Webhookni o'rnatish
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${url}/api/telegram`,
          allowed_updates: ["message", "callback_query"],
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "delete") {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "info") {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
