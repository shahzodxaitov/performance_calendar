import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * Sends telegram notification and returns boolean indicating success.
 */
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
  // ⚡ Bolt Optimization:
  // 1. Cache current timestamp once to avoid redundant Date allocations in the loop
  const now = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // 2. Index team members into a Map for O(1) lookup (reduces O(T * M) search to O(T + M))
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const pendingReminders: PendingReminder[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // 3. Use primitive Date.parse instead of new Date(deadlineStr) to eliminate heap allocations per task
    const deadlineTime = Date.parse(deadlineStr);
    if (Number.isNaN(deadlineTime)) continue;

    const diff = deadlineTime - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingReminders.push({ task, type: "1day", chatId: member.chat_id, message });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingReminders.push({ task, type: "1hour", chatId: member.chat_id, message });
    }
  }

  // 4. Dispatch Telegram requests concurrently via Promise.allSettled instead of sequential await in the loop
  // (Reduces response latency from O(N) sequential round-trips to O(1) concurrent latency)
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  if (pendingReminders.length > 0) {
    const responses = await Promise.allSettled(
      pendingReminders.map(r => sendTelegramNotification(r.chatId, r.message))
    );

    responses.forEach((res, index) => {
      const item = pendingReminders[index];
      const sent = res.status === "fulfilled" && res.value === true;
      if (sent) {
        if (item.type === "1day") item.task.notified_1day = true;
        if (item.type === "1hour") item.task.notified_1hour = true;
        updated = true;
      }
      results.push({ task: item.task.title, type: item.type, sent });
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: new Date(now).toISOString(),
  });
}
