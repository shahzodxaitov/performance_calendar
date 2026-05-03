import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Added error handling to ensure Promise.allSettled can track failures.
 * This ensures we don't mark a task as notified if the message actually failed.
 */
async function sendTelegramNotification(chatId: string, text: string) {
  if (!chatId || !BOT_TOKEN) return;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API error: ${res.status} ${res.statusText}`);
  }
}

interface NotificationQueueItem {
  task: LocalTask;
  message: string;
  type: "1day" | "1hour";
  chatId: string;
}

export async function GET() {
  const now = new Date();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Using a Map for O(1) lookups instead of O(N) .find() inside a loop.
  // This reduces lookup complexity from O(Tasks * Team) to O(Tasks + Team).
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  const notificationQueue: NotificationQueueItem[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - now.getTime();
    const hoursLeft = diff / (1000 * 60 * 60);

    // Check for 1 day reminder
    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationQueue.push({ task, message, type: "1day", chatId: member.chat_id });
    }

    // Check for 1 hour reminder
    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationQueue.push({ task, message, type: "1hour", chatId: member.chat_id });
    }
  }

  // ⚡ Bolt: Parallelize all network requests to reduce total latency from O(N) to O(1) relative to number of tasks.
  if (notificationQueue.length > 0) {
    const notifications = notificationQueue.map(item =>
      sendTelegramNotification(item.chatId, item.message)
    );

    const outcomes = await Promise.allSettled(notifications);

    outcomes.forEach((outcome, index) => {
      const item = notificationQueue[index];
      if (outcome.status === "fulfilled") {
        // Only update flags if notification was successfully sent
        if (item.type === "1day") item.task.notified_1day = true;
        if (item.type === "1hour") item.task.notified_1hour = true;
        updated = true;
        results.push({ task: item.task.title, type: item.type, sent: true });
      } else {
        console.error(`Failed to send notification for task ${item.task.id}:`, outcome.reason);
        results.push({ task: item.task.title, type: item.type, sent: false });
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
