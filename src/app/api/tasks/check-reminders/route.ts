import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask, type TeamMember } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Sends a notification to Telegram API and returns boolean indicating success.
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
  const nowTime = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Pre-index team members by ID into a Map for O(1) lookups instead of O(N * M) team.find()
  const teamMemberMap = new Map<string, TeamMember>();
  for (let i = 0; i < team.length; i++) {
    teamMemberMap.set(team[i].id, team[i]);
  }

  const pendingReminders: PendingReminder[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    const member = teamMemberMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Use Date.parse() to avoid allocating new Date objects in the loop
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineTimestamp = Date.parse(deadlineStr);
    if (Number.isNaN(deadlineTimestamp)) continue;

    const diff = deadlineTimestamp - nowTime;
    const hoursLeft = diff / 3600000; // 1000 * 60 * 60

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingReminders.push({ task, type: "1day", chatId: member.chat_id, message });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingReminders.push({ task, type: "1hour", chatId: member.chat_id, message });
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Dispatch all notifications concurrently using Promise.allSettled()
  // Reduces network latency from O(K) sequential round-trips to O(1) concurrent latency
  if (pendingReminders.length > 0) {
    const dispatchResults = await Promise.allSettled(
      pendingReminders.map((r) => sendTelegramNotification(r.chatId, r.message))
    );

    for (let i = 0; i < pendingReminders.length && i < dispatchResults.length; i++) {
      const reminder = pendingReminders[i];
      const result = dispatchResults[i];
      const sent = result.status === "fulfilled" && result.value === true;

      if (sent) {
        if (reminder.type === "1day") {
          reminder.task.notified_1day = true;
        } else if (reminder.type === "1hour") {
          reminder.task.notified_1hour = true;
        }
        updated = true;
      }

      results.push({
        task: reminder.task.title,
        type: reminder.type,
        sent,
      });
    }
  }

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: new Date(nowTime).toISOString(),
  });
}
