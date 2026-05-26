import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Helper to send Telegram notifications with success indicator.
 */
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return response.ok;
  } catch (error) {
    // ⚡ Bolt: Gracefully handle network errors to prevent batch job crashes.
    console.error("Telegram notification error:", error);
    return false;
  }
}

export async function GET() {
  const now = new Date();
  const nowMs = now.getTime(); // ⚡ Bolt: Cache timestamp for consistency and performance
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use Map for O(1) lookups instead of O(N) array finds in a loop (O(N+M) total complexity)
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: Promise<void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Parsing ISO-like strings is fast, but we reuse the Date object indirectly by getting getTime()
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      // ⚡ Bolt: Queue notifications for parallel execution
      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1day = true;
            updated = true;
            results.push({ task: task.title, type: "1day", sent: true });
          }
        })
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      // ⚡ Bolt: Queue notifications for parallel execution
      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1hour = true;
            updated = true;
            results.push({ task: task.title, type: "1hour", sent: true });
          }
        })
      );
    }
  }

  // ⚡ Bolt: Execute all notifications in parallel to drastically reduce batch processing time
  if (notifications.length > 0) {
    await Promise.allSettled(notifications);
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
