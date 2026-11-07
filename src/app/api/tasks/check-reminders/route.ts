import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const MS_PER_HOUR = 1000 * 60 * 60;

// ⚡ Bolt: Send notification and return status boolean to guard task flag updates
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
  chatId: string;
  message: string;
}

export async function GET() {
  // ⚡ Bolt: Cache current timestamp once to prevent redundant Date object allocations in loop
  const nowTime = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Pre-index team members into a Map for O(1) lookups instead of O(N * M) team.find(...)
  const teamMap = new Map(team.map((m) => [m.id, m]));
  const pendingReminders: PendingReminder[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Use Date.parse() primitive timestamp to eliminate Date heap allocations per task
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineTime = Date.parse(deadlineStr);
    const diff = deadlineTime - nowTime;
    const hoursLeft = diff / MS_PER_HOUR;

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingReminders.push({ task, type: "1day", chatId: member.chat_id, message });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingReminders.push({ task, type: "1hour", chatId: member.chat_id, message });
    }
  }

  // ⚡ Bolt: Execute notification HTTP requests concurrently using Promise.allSettled()
  // Reduces latency from O(K) sequential round-trips to O(1) concurrent latency
  let updated = false;
  const results: { task: string; type: string; sent: boolean }[] = [];

  if (pendingReminders.length > 0) {
    const settleResults = await Promise.allSettled(
      pendingReminders.map(async (r) => {
        const sent = await sendTelegramNotification(r.chatId, r.message);
        return { reminder: r, sent };
      })
    );

    for (const res of settleResults) {
      if (res.status === "fulfilled") {
        const { reminder, sent } = res.value;
        if (sent) {
          if (reminder.type === "1day") {
            reminder.task.notified_1day = true;
          } else {
            reminder.task.notified_1hour = true;
          }
          updated = true;
        }
        results.push({ task: reminder.task.title, type: reminder.type, sent });
      }
    }
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: new Date(nowTime).toISOString(),
  });
}
