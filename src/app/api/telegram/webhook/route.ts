// API route to set/remove Telegram webhook
import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Validate URL to prevent SSRF attacks
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow https protocol
    if (url.protocol !== 'https:') return false;
    // Block private IP ranges
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)) return false;
    if (/^(\[?(::1|fe80:|fc00:|fd00:)\]?)/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authToken = authHeader.substring(7);
    if (authToken !== process.env.API_SECRET_KEY) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram bot token not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { action, url } = body;

    // Validate action
    if (!action || !['set', 'delete', 'info'].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'set', 'delete', or 'info'" }, { status: 400 });
    }

    if (action === "set") {
      // Validate and sanitize URL to prevent SSRF
      if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: "Valid URL is required" }, { status: 400 });
      }

      if (!isValidUrl(url)) {
        return NextResponse.json({ error: "Invalid URL. Only HTTPS URLs are allowed" }, { status: 400 });
      }

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
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
