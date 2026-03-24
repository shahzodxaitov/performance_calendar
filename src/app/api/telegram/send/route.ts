// API route to send messages via Telegram bot
import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export async function POST(request: NextRequest) {
  try {
    const { chat_id, text, parse_mode } = await request.json();

    if (!chat_id || !text) {
      return NextResponse.json({ error: "chat_id va text kerak" }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode: parse_mode || "HTML",
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
