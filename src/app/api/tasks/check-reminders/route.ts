import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Refactored to return Promise<boolean> and handle errors internally.
 * This allows the caller to conditionally update state only on success.
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
  } catch {
    return false;
  }
}

export async function GET() {
  const now = new Date();
  const nowMs = now.getTime(); // ⚡ Bolt: Cache timestamp to avoid repeated .getTime() calls
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use Map for O(1) lookups instead of O(N) .find inside the loop.
  // Reduces algorithmic complexity from O(N*M) to O(N+M).
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Collect all pending notifications to send them in parallel.
  // This avoids sequential await in the loop which blocks the process.
  const pendingNotifications: {
    task: LocalTask;
    type: "1day" | "1hour";
    chatId: string;
    message: string;
  }[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingNotifications.push({ task, type: "1day", chatId: member.chat_id, message });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({ task, type: "1hour", chatId: member.chat_id, message });
    }
  }

  // ⚡ Bolt: Send all notifications in parallel for maximum performance.
  const notificationResults = await Promise.allSettled(
    pendingNotifications.map((n) => sendTelegramNotification(n.chatId, n.message))
  );

  // ⚡ Bolt: Only update task flags for successful notifications.
  notificationResults.forEach((res, i) => {
    if (res.status === "fulfilled" && res.value) {
      const { task, type } = pendingNotifications[i];
      if (type === "1day") task.notified_1day = true;
      if (type === "1hour") task.notified_1hour = true;
      updated = true;
      results.push({ task: task.title, type, sent: true });
    }
  });

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
