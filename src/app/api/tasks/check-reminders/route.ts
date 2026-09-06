import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt Optimization: Helper returns boolean status to ensure task flags
// are updated only when the Telegram API HTTP call succeeds.
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

interface PendingNotification {
  taskIndex: number;
  type: "1day" | "1hour";
  title: string;
  chatId: string;
  message: string;
}

export async function GET() {
  const now = new Date();
  // ⚡ Bolt Optimization: Cache baseline timestamp once to avoid repeated getTime() calls
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt Optimization: Create O(1) Map for team member lookups.
  // Reduces lookup complexity across N tasks from O(N*M) to O(N+M).
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const pendingNotifications: PendingNotification[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineTime = new Date(deadlineStr).getTime();
    const diff = deadlineTime - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingNotifications.push({
        taskIndex: i,
        type: "1day",
        title: task.title,
        chatId: member.chat_id,
        message,
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({
        taskIndex: i,
        type: "1hour",
        title: task.title,
        chatId: member.chat_id,
        message,
      });
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt Optimization: Dispatch pending notifications concurrently with Promise.allSettled.
  // This converts latency from sum of round trips O(N * latency) to single max round trip O(max(latency)).
  if (pendingNotifications.length > 0) {
    const notificationPromises = pendingNotifications.map((notification) =>
      sendTelegramNotification(notification.chatId, notification.message)
    );

    const outcomes = await Promise.allSettled(notificationPromises);

    outcomes.forEach((outcome, idx) => {
      const notification = pendingNotifications[idx];
      const task = tasks[notification.taskIndex];
      const sent = outcome.status === "fulfilled" && outcome.value === true;

      if (sent) {
        if (notification.type === "1day") {
          task.notified_1day = true;
        } else if (notification.type === "1hour") {
          task.notified_1hour = true;
        }
        updated = true;
      }

      results.push({
        task: notification.title,
        type: notification.type,
        sent,
      });
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
