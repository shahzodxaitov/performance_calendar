import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Helper to send Telegram notifications and return response status
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface PendingReminder {
  task: LocalTask;
  type: "1day" | "1hour";
  message: string;
  chatId: string;
}

export async function GET() {
  // ⚡ Bolt: Use Date.now() timestamp to avoid redundant Date allocations
  const now = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Build O(1) hash map of member chat IDs to eliminate O(N * M) nested find calls
  const memberChatMap = new Map<string, string>();
  for (const m of team) {
    if (m.chat_id) {
      memberChatMap.set(m.id, m.chat_id);
    }
  }

  const pendingReminders: PendingReminder[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const chatId = memberChatMap.get(task.assignee_id);
    if (!chatId) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Parse timestamp directly to eliminate O(N) Date heap allocations
    const deadlineTime = Date.parse(deadlineStr);
    if (isNaN(deadlineTime)) continue;

    const diff = deadlineTime - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingReminders.push({ task, type: "1day", message, chatId });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_date : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingReminders.push({ task, type: "1hour", message, chatId });
    }
  }

  // ⚡ Bolt: Parallelize Telegram notification dispatches with Promise.allSettled
  // Converts sequential O(K) round-trip network latency into O(1) concurrent latency
  const dispatchResults = await Promise.allSettled(
    pendingReminders.map(async (reminder) => {
      const sent = await sendTelegramNotification(reminder.chatId, reminder.message);
      return { reminder, sent };
    })
  );

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  for (const res of dispatchResults) {
    if (res.status === "fulfilled") {
      const { reminder, sent } = res.value;
      if (sent) {
        if (reminder.type === "1day") {
          reminder.task.notified_1day = true;
        } else if (reminder.type === "1hour") {
          reminder.task.notified_1hour = true;
        }
        updated = true;
      }
      results.push({ task: reminder.task.title, type: reminder.type, sent });
    }
  }

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: new Date(now).toISOString(),
  });
}
