import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Refactored to return Promise<boolean> and handle errors internally
 * to enable conditional state updates in batch jobs.
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
  // ⚡ Bolt: Cache baseline timestamp to ensure consistency and avoid redundant instantiations
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: O(N+M) complexity using Map for team members instead of O(N*M) lookups
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notificationPromises: Promise<void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Task deadlines usually include a specific timezone offset (+05:00)
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineMs = new Date(deadlineStr).getTime();
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      const promise = sendTelegramNotification(member.chat_id, message).then(success => {
        if (success) {
          task.notified_1day = true;
          updated = true;
          results.push({ task: task.title, type: "1day", sent: true });
        }
      });
      notificationPromises.push(promise);
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      const promise = sendTelegramNotification(member.chat_id, message).then(success => {
        if (success) {
          task.notified_1hour = true;
          updated = true;
          results.push({ task: task.title, type: "1hour", sent: true });
        }
      });
      notificationPromises.push(promise);
    }
  }

  // ⚡ Bolt: Parallelize independent network requests to reduce total execution time
  if (notificationPromises.length > 0) {
    await Promise.allSettled(notificationPromises);
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
