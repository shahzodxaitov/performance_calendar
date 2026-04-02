// Telegram Bot API Route — webhook handler
import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface TelegramMessage {
  message_id: number;
  chat: { id: number; first_name?: string; last_name?: string; username?: string };
  text?: string;
  from?: { id: number; first_name?: string; last_name?: string; username?: string };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    message?: TelegramMessage;
    data?: string;
    from?: { id: number; first_name?: string };
  };
}

// Loyihalar data
const companies = [
  { id: "c1", name: "Mondelux", token: "mondelux" },
  { id: "c2", name: "Chinar Group", token: "chinar" },
  { id: "c3", name: "Sunnat Umra", token: "sunnat" },
];

// Demo hisobot data (keyinchalik DB dan olinadi)
function getDailyReport(companyId: string) {
  const data: Record<string, { leads: number; sales: string; tasks: string; convRate: string }> = {
    c1: { leads: 12, sales: "3.5M UzS", tasks: "2/3 bajarildi", convRate: "22%" },
    c2: { leads: 9, sales: "2.8M UzS", tasks: "3/4 bajarildi", convRate: "18%" },
    c3: { leads: 7, sales: "1.8M UzS", tasks: "2/2 bajarildi", convRate: "16%" },
  };
  return data[companyId] || data.c1;
}

// Telegram API helper
async function sendMessage(chatId: number, text: string, options?: { reply_markup?: any; parse_mode?: string }) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || "HTML",
      reply_markup: options?.reply_markup,
    }),
  });
  return res.json();
}

async function answerCallback(callbackId: string, text?: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

// /start buyrug'i
function getStartMessage(name: string, chatId: number) {
  return `👋 <b>Xush kelibsiz, ${name}!</b>

Bu <b>Performance Agency</b> marketing platformasining rasmiy botidir.

🔑 <b>Sizning Chat ID raqamingiz:</b> <code>${chatId}</code>

<i>Bildirishnomalar qabul qilish uchun platformaga kiring: Jamoa (yoki Sozlamalar) bo'limida ushbu Chat ID raqamini o'z ismingiz yoniga kiriting. Shundan so'ng barcha yangi vazifalar sizga keladi.</i>

👇 Boshqa buyruqlar:`;
}

function getMainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📊 Hisobot olish", callback_data: "select_company" }],
      [{ text: "📈 Barcha loyihalar", callback_data: "all_stats" }],
      [{ text: "🔗 Hisobot linki", callback_data: "select_report_link" }],
    ],
  };
}

function getCompanyKeyboard(prefix: string) {
  return {
    inline_keyboard: [
      ...companies.map((c) => [{ text: c.name, callback_data: `${prefix}_${c.id}` }]),
      [{ text: "⬅️ Ortga", callback_data: "back_main" }],
    ],
  };
}

function formatReport(companyName: string, data: ReturnType<typeof getDailyReport>, date: string) {
  return `📊 <b>${companyName} — Kunlik Hisobot</b>
📅 ${date}

━━━━━━━━━━━━━━━━━
📥 <b>Leadlar:</b> ${data.leads}
💰 <b>Sotuvlar:</b> ${data.sales}
✅ <b>Ishlar:</b> ${data.tasks}
📈 <b>Konversiya:</b> ${data.convRate}
━━━━━━━━━━━━━━━━━

✨ Batafsil: platformada ko'ring`;
}

function getAllStats() {
  const today = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
  let text = `📈 <b>Barcha Loyihalar — Umumiy Ko'rinish</b>\n📅 ${today}\n\n`;

  companies.forEach((c) => {
    const d = getDailyReport(c.id);
    text += `<b>${c.name}</b>\n`;
    text += `   📥 ${d.leads} lead  •  💰 ${d.sales}  •  📈 ${d.convRate}\n\n`;
  });

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    const today = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });

    // Matn xabarlarini qayta ishlash
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const name = update.message.from?.first_name || "Foydalanuvchi";

      if (text === "/start") {
        await sendMessage(chatId, getStartMessage(name, chatId), { reply_markup: getMainKeyboard() });
      } else if (text === "/hisobot" || text === "/report") {
        await sendMessage(chatId, "📊 Qaysi loyiha bo'yicha hisobot kerak?", {
          reply_markup: getCompanyKeyboard("report"),
        });
      } else if (text === "/stats") {
        await sendMessage(chatId, getAllStats());
      } else if (text === "/help") {
        await sendMessage(chatId, `📖 <b>Buyruqlar:</b>

/start — Botni boshlash
/hisobot — Loyiha hisoboti
/stats — Umumiy statistika
/help — Yordam`);
      } else {
        await sendMessage(chatId, "❓ Noma'lum buyruq. /help ni bosing.", { reply_markup: getMainKeyboard() });
      }
    }

    // Callback (tugma bosilganda)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat.id;
      const data = cb.data || "";

      if (!chatId) return NextResponse.json({ ok: true });

      await answerCallback(cb.id);

      if (data === "select_company") {
        await sendMessage(chatId, "📊 Qaysi loyiha bo'yicha hisobot kerak?", {
          reply_markup: getCompanyKeyboard("report"),
        });
      } else if (data === "select_report_link") {
        await sendMessage(chatId, "🔗 Qaysi loyihaning hisobot linkini yuboray?", {
          reply_markup: getCompanyKeyboard("link"),
        });
      } else if (data.startsWith("report_")) {
        const companyId = data.replace("report_", "");
        const company = companies.find((c) => c.id === companyId);
        if (company) {
          const report = getDailyReport(companyId);
          const text = formatReport(company.name, report, today);
          await sendMessage(chatId, text, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔗 Hisobot linki", callback_data: `link_${companyId}` }],
                [{ text: "⬅️ Ortga", callback_data: "back_main" }],
              ],
            },
          });
        }
      } else if (data.startsWith("link_")) {
        const companyId = data.replace("link_", "");
        const company = companies.find((c) => c.id === companyId);
        if (company) {
          const token = `${company.token}-daily-23`;
          const url = `${APP_URL}/reports/share/${token}`;
          await sendMessage(chatId, `🔗 <b>${company.name}</b> — Kunlik Hisobot:\n\n${url}\n\n👆 Linkni bosib, to'liq hisobotni ko'ring.`, {
            reply_markup: {
              inline_keyboard: [[{ text: "⬅️ Ortga", callback_data: "back_main" }]],
            },
          });
        }
      } else if (data === "all_stats") {
        await sendMessage(chatId, getAllStats(), {
          reply_markup: { inline_keyboard: [[{ text: "⬅️ Ortga", callback_data: "back_main" }]] },
        });
      } else if (data === "back_main") {
        await sendMessage(chatId, "👇 Quyidagi tugmalarni bosing:", { reply_markup: getMainKeyboard() });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET — webhook tekshiruv
export async function GET() {
  return NextResponse.json({
    status: "Bot webhook is active",
    bot: BOT_TOKEN ? "configured" : "missing TELEGRAM_BOT_TOKEN",
  });
}
