// Telegram Bot Webhook Handler — Vercel da ishlaydi
import { NextRequest, NextResponse } from "next/server";
import { getTeamMembers, saveTeamMembers, getCompanies } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://performance-calendar.vercel.app";

// ===== TELEGRAM HELPERS =====
async function sendMessage(chatId: number | string, text: string, reply_markup?: any) {
  if (!BOT_TOKEN) {
    console.error("Telegram bot token not configured");
    return { ok: false, error: "Bot token not configured" };
  }
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(reply_markup ? { reply_markup } : {}),
    }),
  });
  const data = await res.json();
  if (!data.ok) console.error("sendMessage error:", data.description);
  return data;
}

async function answerCallback(callbackId: string, text?: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text: text || "" }),
  });
}

// ===== KEYBOARDS =====
function getMainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📊 Hisobot olish", callback_data: "select_company" }],
      [{ text: "📈 Barcha loyihalar", callback_data: "all_stats" }],
      [{ text: "👤 Ro'yxatdan o'tish", callback_data: "register_start" }],
      [{ text: "📋 Mening vazifalarim", callback_data: "my_tasks" }],
    ],
  };
}

function getCompanyKeyboard(prefix: string, companies: { id: string; name: string }[]) {
  return {
    inline_keyboard: [
      ...companies.map((c) => [{ text: c.name, callback_data: `${prefix}_${c.id}` }]),
      [{ text: "⬅️ Ortga", callback_data: "back_main" }],
    ],
  };
}

function getTeamKeyboard(team: { id: string; full_name: string; role: string; chat_id: string | null }[]) {
  return {
    inline_keyboard: [
      ...team.map((m) => [{
        text: `${m.chat_id ? "✅" : "⬜"} ${m.full_name} (${m.role})`,
        callback_data: `reg_${m.id}`,
      }]),
      [{ text: "⬅️ Ortga", callback_data: "back_main" }],
    ],
  };
}

// ===== MAIN WEBHOOK HANDLER =====
export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    // TEXT MESSAGES
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const name = update.message.from?.first_name || "Foydalanuvchi";

      console.log(`📩 [${chatId}] ${name}: ${text}`);

      if (text === "/start" || text.startsWith("/start ")) {
        const team = getTeamMembers();
        const existing = team.find((m) => m.chat_id === String(chatId));

        if (existing) {
          await sendMessage(chatId,
            `👋 <b>Xush kelibsiz, ${existing.full_name}!</b>\n\nSiz platformaga ulangansiz ✅\n\n🔑 Sizning Chat ID: <code>${chatId}</code>\n\n👇 Tugmalarni bosing:`,
            getMainKeyboard()
          );
        } else {
          const team2 = getTeamMembers();
          await sendMessage(chatId,
            `👋 <b>Xush kelibsiz, ${name}!</b>\n\nBu <b>Performance Agency</b> marketing platformasining botidir.\n\n🔑 <b>Sizning Chat ID:</b> <code>${chatId}</code>\n\n👇 O'zingizni ro'yxatdan o'tkating:`,
            getTeamKeyboard(team2)
          );
        }
      } else if (text === "/connect" || text === "/register") {
        const team = getTeamMembers();
        await sendMessage(chatId,
          `👤 <b>Ro'yxatdan o'tish</b>\n\nO'zingizni tanlang:`,
          getTeamKeyboard(team)
        );
      } else if (text === "/mytasks" || text === "/vazifalar") {
        const team = getTeamMembers();
        const member = team.find((m) => m.chat_id === String(chatId));
        if (!member) {
          await sendMessage(chatId, "❌ Avval ro'yxatdan o'ting. /start buyrug'ini bosing va ismingizni tanlang.");
          return NextResponse.json({ ok: true });
        }
        await sendMessage(chatId, `📋 <b>${member.full_name}</b> — platformaga kiring va vazifalarni ko'ring.\n\n🔗 ${APP_URL}/tasks`);
      } else if (text === "/help") {
        await sendMessage(chatId,
          `📖 <b>Buyruqlar:</b>\n\n/start — Botni boshlash\n/connect — Ro'yxatdan o'tish\n/mytasks — Mening vazifalarim\n/help — Yordam`,
          getMainKeyboard()
        );
      } else {
        await sendMessage(chatId, "❓ Noma'lum buyruq. /help ni bosing.", getMainKeyboard());
      }
    }

    // CALLBACK QUERIES (tugmalar)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id || cb.from?.id;
      const data = cb.data || "";
      const name = cb.from?.first_name || "Foydalanuvchi";

      if (!chatId) return NextResponse.json({ ok: true });
      await answerCallback(cb.id);

      // RO'YXATDAN O'TISH
      if (data === "register_start") {
        const team = getTeamMembers();
        await sendMessage(chatId,
          `👤 <b>Ro'yxatdan o'tish</b>\n\nQuyidagi ro'yxatdan o'z ismingizni tanlang:`,
          getTeamKeyboard(team)
        );

      } else if (data.startsWith("reg_")) {
        const memberId = data.replace("reg_", "");
        const team = getTeamMembers();
        const member = team.find((m) => m.id === memberId);

        if (!member) {
          await sendMessage(chatId, "❌ A'zo topilmadi.");
          return NextResponse.json({ ok: true });
        }

        // chat_id ni yangilaymiz
        const idx = team.findIndex((m) => m.id === memberId);
        team[idx] = { ...team[idx], chat_id: String(chatId) };
        saveTeamMembers(team);

        console.log(`✅ ${member.full_name} ulandi: chat_id=${chatId}`);
        await sendMessage(chatId,
          `✅ <b>Muvaffaqiyatli ro'yxatdan o'tdingiz!</b>\n\nSiz <b>${member.full_name}</b> sifatida ulandingiz.\n\n📨 Endi yangi vazifalar va eslatmalar sizga avtomatik keladi!\n\n🔑 Sizning Chat ID: <code>${chatId}</code>`,
          getMainKeyboard()
        );

      } else if (data === "my_tasks") {
        const team = getTeamMembers();
        const member = team.find((m) => m.chat_id === String(chatId));
        if (!member) {
          await sendMessage(chatId, "❌ Avval ro'yxatdan o'ting.", { inline_keyboard: [[{ text: "👤 Ro'yxatdan o'tish", callback_data: "register_start" }]] });
        } else {
          await sendMessage(chatId, `📋 <b>${member.full_name}</b>\n\nVazifalarni platformada ko'ring:\n🔗 ${APP_URL}/tasks`);
        }

      } else if (data === "select_company") {
        const companies = getCompanies();
        await sendMessage(chatId, "📊 Qaysi loyiha bo'yicha?", getCompanyKeyboard("report", companies));

      } else if (data === "select_report_link") {
        const companies = getCompanies();
        await sendMessage(chatId, "🔗 Qaysi loyiha linki?", getCompanyKeyboard("link", companies));

      } else if (data.startsWith("report_")) {
        const companies = getCompanies();
        const cId = data.replace("report_", "");
        const c = companies.find((x) => x.id === cId);
        if (c) {
          await sendMessage(chatId,
            `📊 <b>${c.name}</b> hisobotini platformada ko'ring:\n\n🔗 ${APP_URL}/reports`,
            { inline_keyboard: [[{ text: "⬅️ Ortga", callback_data: "back_main" }]] }
          );
        }

      } else if (data.startsWith("link_")) {
        const companies = getCompanies();
        const cId = data.replace("link_", "");
        const c = companies.find((x) => x.id === cId);
        if (c) {
          await sendMessage(chatId,
            `🔗 <b>${c.name}</b> hisobot sahifasi:\n\n${APP_URL}/reports`,
            { inline_keyboard: [[{ text: "⬅️ Ortga", callback_data: "back_main" }]] }
          );
        }

      } else if (data === "all_stats") {
        const companies = getCompanies();
        let text = `📈 <b>Barcha Loyihalar</b>\n\n`;
        companies.forEach((c) => {
          text += `🏢 <b>${c.name}</b>\n`;
        });
        text += `\n🔗 Batafsil: ${APP_URL}`;
        await sendMessage(chatId, text, { inline_keyboard: [[{ text: "⬅️ Ortga", callback_data: "back_main" }]] });

      } else if (data === "back_main") {
        await sendMessage(chatId, "👇 Asosiy menyu:", getMainKeyboard());
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET — webhook holati
export async function GET() {
  return NextResponse.json({
    status: "Telegram Bot Webhook faol",
    bot: BOT_TOKEN ? "✅ Token mavjud" : "❌ TELEGRAM_BOT_TOKEN yo'q",
    webhook_url: `${APP_URL}/api/telegram`,
  });
}
