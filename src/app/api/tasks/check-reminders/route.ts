import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramNotification(chatId: string, text: string) {
  if (!chatId || !BOT_TOKEN) return;
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  // ⚡ Bolt: Throw error for non-ok responses so Promise.allSettled can detect failures
  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.statusText}`);
  }
}

export async function GET() {
  const now = Date.now(); // ⚡ Bolt: Use numeric timestamp for faster comparisons
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Convert team array to Map for O(1) lookups, reducing complexity from O(N*M) to O(N+M)
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Parallelize notifications to significantly reduce total execution time
  const notificationPromises: Promise<void>[] = [];
  const updateCallbacks: (() => void)[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadline = new Date(deadlineStr).getTime();
    const diff = deadline - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notificationPromises.push(sendTelegramNotification(member.chat_id, message));
      updateCallbacks.push(() => {
        task.notified_1day = true;
        updated = true;
        results.push({ task: task.title, type: "1day", sent: true });
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notificationPromises.push(sendTelegramNotification(member.chat_id, message));
      updateCallbacks.push(() => {
        task.notified_1hour = true;
        updated = true;
        results.push({ task: task.title, type: "1hour", sent: true });
      });
    }
  }

  // ⚡ Bolt: Execute all notifications in parallel and only update state for successful ones
  if (notificationPromises.length > 0) {
    const settlements = await Promise.allSettled(notificationPromises);
    settlements.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        updateCallbacks[idx]();
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(now).toISOString(),
  });
}
