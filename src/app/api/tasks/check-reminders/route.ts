import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Helper to send Telegram notifications and return success status.
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
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use a Map for O(1) team member lookups instead of O(N*M) find()
  const teamMap = new Map(team.map(m => [m.id, m]));

  const notificationPromises: Promise<void>[] = [];
  const pendingUpdates: (() => void)[] = [];
  const results: { task: string; type: string; sent: boolean }[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineMs = new Date(deadlineStr).getTime();
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      const chatId = member.chat_id;
      notificationPromises.push(
        sendTelegramNotification(chatId, message).then(success => {
          if (success) {
            pendingUpdates.push(() => { task.notified_1day = true; });
            results.push({ task: task.title, type: "1day", sent: true });
          }
        })
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      const chatId = member.chat_id;
      notificationPromises.push(
        sendTelegramNotification(chatId, message).then(success => {
          if (success) {
            pendingUpdates.push(() => { task.notified_1hour = true; });
            results.push({ task: task.title, type: "1hour", sent: true });
          }
        })
      );
    }
  }

  // ⚡ Bolt: Execute all notifications in parallel to avoid sequential wait times
  if (notificationPromises.length > 0) {
    await Promise.allSettled(notificationPromises);

    if (pendingUpdates.length > 0) {
      pendingUpdates.forEach(update => update());
      saveTasks(tasks);
    }
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
