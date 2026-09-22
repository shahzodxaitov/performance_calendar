import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * Sends Telegram notification and returns true if request succeeded.
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
  task: ReturnType<typeof getTasks>[number];
  chatId: string;
  message: string;
  type: "1day" | "1hour";
}

export async function GET() {
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // Performance Optimization:
  // 1. Build an O(1) Map for team member lookups instead of doing O(N) team.find() inside loop
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const pendingReminders: PendingReminder[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // Performance Optimization: Use primitive Date.parse timestamp comparison
    const deadlineMs = Date.parse(deadlineStr);
    if (isNaN(deadlineMs)) continue;

    const diffMs = deadlineMs - nowMs;
    const hoursLeft = diffMs / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingReminders.push({ task, chatId: member.chat_id, message, type: "1day" });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingReminders.push({ task, chatId: member.chat_id, message, type: "1hour" });
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // Performance Optimization:
  // 2. Dispatch all Telegram HTTP notifications concurrently using Promise.allSettled
  if (pendingReminders.length > 0) {
    const notificationPromises = pendingReminders.map((reminder) =>
      sendTelegramNotification(reminder.chatId, reminder.message)
    );

    const outcomes = await Promise.allSettled(notificationPromises);

    outcomes.forEach((outcome, idx) => {
      const reminder = pendingReminders[idx];
      const isSuccess = outcome.status === "fulfilled" && outcome.value;

      if (isSuccess) {
        if (reminder.type === "1day") {
          reminder.task.notified_1day = true;
        } else if (reminder.type === "1hour") {
          reminder.task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: reminder.task.title, type: reminder.type, sent: true });
      } else {
        results.push({ task: reminder.task.title, type: reminder.type, sent: false });
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
