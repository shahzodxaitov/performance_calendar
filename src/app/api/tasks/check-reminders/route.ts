import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Refactored to return Promise<boolean> and handle errors internally.
 * This allows for conditional state updates based on actual notification success.
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

export async function GET() {
  const now = new Date();
  const tasks = getTasks();
  const team = getTeamMembers();
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  /**
   * ⚡ Bolt Optimization:
   * 1. Replaced O(N*M) linear search with O(N+M) Map lookup for team members.
   * 2. Parallelized Telegram notifications using Promise.allSettled to reduce latency.
   * 3. Cached baseline timestamp (nowMs) to avoid repeated object/method calls in loop.
   * 4. State updates (task.notified_...) only occur if notification is successful.
   */
  const teamMap = new Map(team.map(m => [m.id, m]));
  const nowMs = now.getTime();
  const notifications: Promise<void>[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // Use a fixed timezone offset (+05:00) as per project convention
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineMs = new Date(deadlineStr).getTime();
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    // 1 Day Reminder
    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notifications.push((async () => {
        const sent = await sendTelegramNotification(member.chat_id!, message);
        if (sent) {
          task.notified_1day = true;
          updated = true;
          results.push({ task: task.title, type: "1day", sent: true });
        }
      })());
    }

    // 1 Hour Reminder
    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notifications.push((async () => {
        const sent = await sendTelegramNotification(member.chat_id!, message);
        if (sent) {
          task.notified_1hour = true;
          updated = true;
          results.push({ task: task.title, type: "1hour", sent: true });
        }
      })());
    }
  }

  if (notifications.length > 0) {
    await Promise.allSettled(notifications);
  }

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
