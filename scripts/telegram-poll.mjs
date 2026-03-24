// Telegram Bot — Polling Mode with Next.js API Sync
// Usage: node scripts/telegram-poll.mjs

const BOT_TOKEN = "8748815281:AAGeIxoLPVLWJ0Zek4VZNoqYXI2IOzHIpmI";
const APP_URL = "http://localhost:3000";

let offset = 0;

let companies = [];
async function fetchCompanies() {
  try {
    const res = await fetch(`${APP_URL}/api/companies`);
    const data = await res.json();
    if (data.companies) companies = data.companies;
  } catch (err) {
    console.error("Failed to load companies");
  }
}

function getDailyReport(companyId) {
  const data = {
    c1: { leads: 12, sales: "3.5M UzS", tasks: "2/3 bajarildi", convRate: "22%" },
    c2: { leads: 9, sales: "2.8M UzS", tasks: "3/4 bajarildi", convRate: "18%" },
    c3: { leads: 7, sales: "1.8M UzS", tasks: "2/2 bajarildi", convRate: "16%" },
  };
  return data[companyId] || data.c1;
}

// === TELEGRAM HELPERS ===
async function sendMessage(chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (!result.ok) console.error("Send error:", result.description);
  return result;
}

async function answerCallback(callbackId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

// === KEYBOARD CONSTANTS ===
function getMainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📊 Hisobot olish", callback_data: "select_company" }],
      [{ text: "📈 Barcha loyihalar", callback_data: "all_stats" }],
      [{ text: "🔗 Hisobot linki", callback_data: "select_report_link" }],
      [{ text: "📋 Mening vazifalarim", callback_data: "my_tasks" }],
    ],
  };
}

function getCompanyKeyboard(prefix) {
  return {
    inline_keyboard: [
      ...companies.map((c) => [{ text: c.name, callback_data: `${prefix}_${c.id}` }]),
      [{ text: "⬅️ Ortga", callback_data: "back_main" }],
    ],
  };
}

// API dan olib klaviatura yasash
async function getTeamKeyboard() {
  try {
    const res = await fetch(`${APP_URL}/api/team`);
    const data = await res.json();
    const team = data.team || [];
    return {
      inline_keyboard: team.map((m) => [{
        text: `${m.chat_id ? "✅" : "⬜"} ${m.full_name} (${m.role})`,
        callback_data: `register_${m.id}`,
      }]),
    };
  } catch(e) {
    return { inline_keyboard: [[{ text: "Server xatosi. Keyinroq urinib ko'ring.", callback_data: "back_main" }]] };
  }
}

function formatReport(companyName, data, date) {
  return `📊 <b>${companyName} — Kunlik Hisobot</b>\n📅 ${date}\n\n━━━━━━━━━━━━━━━━━\n📥 <b>Leadlar:</b> ${data.leads}\n💰 <b>Sotuvlar:</b> ${data.sales}\n✅ <b>Ishlar:</b> ${data.tasks}\n📈 <b>Konversiya:</b> ${data.convRate}\n━━━━━━━━━━━━━━━━━`;
}

function getAllStats() {
  const today = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
  let text = `📈 <b>Barcha Loyihalar</b>\n📅 ${today}\n\n`;
  companies.forEach((c) => {
    const d = getDailyReport(c.id);
    text += `<b>${c.name}</b>\n   📥 ${d.leads} lead  •  💰 ${d.sales}  •  📈 ${d.convRate}\n\n`;
  });
  return text;
}

// === UPDATE HANDLER ===
async function handleUpdate(update) {
  const today = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });

  if (update.message?.text) {
    await fetchCompanies();
    const chatId = update.message.chat.id.toString();
    const text = update.message.text;
    const name = update.message.from?.first_name || "Foydalanuvchi";

    console.log(`📩 ${name} (${chatId}): ${text}`);

    if (text === "/start") {
      // API dan chat_id ni izlaymiz
      const tRes = await fetch(`${APP_URL}/api/team`);
      const tData = await tRes.json();
      const member = (tData.team || []).find(m => m.chat_id === chatId);

      const greeting = member
        ? `👋 <b>Xush kelibsiz, ${member.full_name}!</b>\n\nSiz platformaga ulangansiz ✅`
        : `👋 <b>Xush kelibsiz, ${name}!</b>\n\nBu <b>Performance Agency</b> marketing platformasining botidir.`;

      await sendMessage(chatId,
        `${greeting}\n\n📊 Hisobotlar, vazifalar va statistikani oling.\n📨 Yangi vazifalar avtomatik bot orqali keladi.\n\n${!member ? "👤 Avval o'zingizni ro'yxatdan o'tkazing: /connect" : ""}\n\n👇 Quyidagi tugmalarni bosing:`,
        getMainKeyboard()
      );
    } else if (text === "/connect") {
      await sendMessage(chatId,
        `👤 <b>Ro'yxatdan o'tish</b>\n\nO'zingizni tanlang (Admin qoshgan ismlar):`,
        await getTeamKeyboard()
      );
    } else if (text === "/hisobot" || text === "/report") {
      await sendMessage(chatId, "📊 Qaysi loyiha?", getCompanyKeyboard("report"));
    } else if (text === "/stats") {
      await sendMessage(chatId, getAllStats());
    } else if (text === "/mytasks" || text === "/vazifalar") {
      const tRes = await fetch(`${APP_URL}/api/team`);
      const tData = await tRes.json();
      const member = (tData.team || []).find(m => m.chat_id === chatId);

      if (!member) {
        await sendMessage(chatId, "❌ Avval /connect buyrug'i bilan ro'yxatdan o'ting.");
        return;
      }

      const tasksRes = await fetch(`${APP_URL}/api/tasks`);
      const tasksData = await tasksRes.json();
      const myTasks = (tasksData.tasks || []).filter((t) => t.assignee_id === member.id && t.status !== "done");

      if (myTasks.length === 0) {
        await sendMessage(chatId, "📋 Sizga hozircha vazifa yoki hamma vazifalar bajarilgan.");
        return;
      }
      
      let msg = `📋 <b>${member.full_name} — Faol Vazifalaringiz</b>\n\n`;
      myTasks.forEach((t, i) => {
        const d = new Date(t.due_date);
        msg += `${i + 1}. <b>${t.title}</b>\n   🏢 ${t.company_name} · 📅 ${d.toLocaleDateString("uz-UZ")}${t.due_time ? ' ' + t.due_time : ''}\n\n`;
      });
      await sendMessage(chatId, msg);
    } else if (text === "/help") {
      await sendMessage(chatId, `📖 <b>Buyruqlar:</b>\n\n/start — Botni boshlash\n/connect — Ro'yxatdan o'tish\n/hisobot — Loyiha hisoboti\n/stats — Umumiy statistika\n/mytasks — Mening vazifalarim\n/help — Yordam`);
    } else {
      await sendMessage(chatId, "❓ Noma'lum buyruq. /help ni bosing.", getMainKeyboard());
    }
  }

  if (update.callback_query) {
    await fetchCompanies();
    const cb = update.callback_query;
    const chatId = cb.message?.chat.id.toString();
    const data = cb.data || "";

    if (!chatId) return;
    console.log(`🔘 ${data} from ${cb.from?.first_name}`);
    await answerCallback(cb.id);

    if (data.startsWith("register_")) {
      const memberId = data.replace("register_", "");
      
      // API ga PATCH req yuboramiz
      try {
        const patchRes = await fetch(`${APP_URL}/api/team`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: memberId, chat_id: chatId }),
        });
        const patchData = await patchRes.json();
        
        if (patchData.error) throw new Error(patchData.error);
        
        const member = patchData.member;
        console.log(`✅ ${member.full_name} ulandi: chat_id = ${chatId}`);
        await sendMessage(chatId,
          `✅ <b>Muvaffaqiyatli!</b>\n\nSiz <b>${member.full_name}</b> sifatida ulangansiz.\n\n📨 Endi sizga yangi vazifalar va eslatmalar avtomatik keladi!\n\n👇 Asosiy menyuga qayting:`,
          getMainKeyboard()
        );
      } catch(e) {
        await sendMessage(chatId, "❌ Bog'lanishda xatolik yuz berdi.");
      }
      
    } else if (data === "select_company") {
      await sendMessage(chatId, "📊 Qaysi loyiha?", getCompanyKeyboard("report"));
    } else if (data === "select_report_link") {
      await sendMessage(chatId, "🔗 Qaysi loyiha linki?", getCompanyKeyboard("link"));
    } else if (data.startsWith("report_")) {
      const cId = data.replace("report_", "");
      const c = companies.find((x) => x.id === cId);
      if (c) {
        const r = getDailyReport(cId);
        await sendMessage(chatId, formatReport(c.name, r, today), {
          inline_keyboard: [
            [{ text: "🔗 Hisobot linki", callback_data: `link_${cId}` }],
            [{ text: "⬅️ Ortga", callback_data: "back_main" }],
          ],
        });
      }
    } else if (data.startsWith("link_")) {
      const cId = data.replace("link_", "");
      const c = companies.find((x) => x.id === cId);
      if (c) {
        const url = `${APP_URL}/reports/share/${c.token}-daily-23`;
        await sendMessage(chatId, `🔗 <b>${c.name}</b> hisobot:\n\n${url}`, {
          inline_keyboard: [[{ text: "⬅️ Ortga", callback_data: "back_main" }]],
        });
      }
    } else if (data === "all_stats") {
      await sendMessage(chatId, getAllStats(), {
        inline_keyboard: [[{ text: "⬅️ Ortga", callback_data: "back_main" }]],
      });
    } else if (data === "my_tasks") {
      // Re-trigger text command logically
      update.message = { chat: { id: chatId }, text: "/mytasks" };
      await handleUpdate(update);
    } else if (data === "back_main") {
      await sendMessage(chatId, "👇 Tugmalarni bosing:", getMainKeyboard());
    }
  }
}

// === DEADLINE REMINDER CHECK ===
async function triggerReminders() {
  try {
    const res = await fetch(`${APP_URL}/api/tasks/check-reminders`);
    const data = await res.json();
    if (data.reminders_sent > 0) {
      console.log(`⏰ Eslatmalar yuborildi: ${data.reminders_sent} ta`);
    }
  } catch(e) {
    // console.log("Reminder API xatoligi", e.message);
  }
}

// === POLLING LOOP ===
async function getUpdates() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`
    );
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error("Poll error:", err.message);
  }
}

// === START ===
async function start() {
  console.log("🤖 Performance Bot ishga tushmoqda...\n");

  const delRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
  const delData = await delRes.json();
  console.log("Webhook:", delData.ok ? "o'chirildi ✅" : "❌");

  const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
  const meData = await meRes.json();
  if (meData.ok) {
    console.log(`Bot: @${meData.result.username}`);
  } else {
    console.error("❌ Token xato:", meData);
    process.exit(1);
  }

  // Buyruqlar menyusi
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "start", description: "Botni boshlash" },
        { command: "connect", description: "Ro'yxatdan o'tish" },
        { command: "hisobot", description: "Loyiha hisoboti" },
        { command: "stats", description: "Umumiy statistika" },
        { command: "mytasks", description: "Mening vazifalarim" },
        { command: "help", description: "Yordam" },
      ],
    }),
  });
  console.log("Buyruqlar menyusi sozlandi ✅");

  console.log("📡 Polling + API Server Reminder boshlandi...\n");

  // Har 60 sekundda Next.js API ga signal yuboramiz
  setInterval(triggerReminders, 60 * 1000);

  // Polling loop
  while (true) {
    await getUpdates();
  }
}

start();
