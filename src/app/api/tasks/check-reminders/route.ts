import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Refactored to return Promise<boolean> for reliable state updates.
 * Internal error handling ensures batch processing doesn't crash on single failure.
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
  // ⚡ Bolt: Caching current timestamp to ensure consistent baseline across all comparisons
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Using a Map for O(1) team member lookups, reducing total complexity from O(N*M) to O(N+M)
  const memberMap = new Map(team.map(m => [m.id, m]));

  const pendingNotifications: {
    task: LocalTask;
    type: "1day" | "1hour";
    promise: Promise<boolean>;
  }[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = memberMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadline = new Date(deadlineStr).getTime();
    const diff = deadline - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    // logic: 2 < hoursLeft <= 28 (1 day reminder)
    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingNotifications.push({
        task,
        type: "1day",
        promise: sendTelegramNotification(member.chat_id, message)
      });
    }

    // logic: hoursLeft <= 1.5 (1 hour reminder)
    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({
        task,
        type: "1hour",
        promise: sendTelegramNotification(member.chat_id, message)
      });
    }
  }

  let updated = false;
  const results: { task: string; type: string; sent: boolean }[] = [];

  // ⚡ Bolt: Parallelizing notifications using Promise.allSettled to minimize total execution time
  if (pendingNotifications.length > 0) {
    const settlements = await Promise.allSettled(pendingNotifications.map(p => p.promise));

    settlements.forEach((result, idx) => {
      const { task, type } = pendingNotifications[idx];
      const success = result.status === 'fulfilled' && result.value === true;

      if (success) {
        if (type === "1day") task.notified_1day = true;
        if (type === "1hour") task.notified_1hour = true;
        updated = true;
      }

      results.push({
        task: task.title,
        type,
        sent: success
      });
    });
  }

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
