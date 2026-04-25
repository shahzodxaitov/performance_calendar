import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Parallelize independent network requests by returning the promise.
 */
async function sendTelegramNotification(chatId: string, text: string) {
  if (!chatId || !BOT_TOKEN) return;
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function GET() {
  const now = Date.now(); // ⚡ Bolt: Using numeric timestamps for faster arithmetic
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Replace O(M) linear search inside loop with O(1) Map lookup.
  // Reduces total algorithmic complexity from O(N * M) to O(N + M).
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notificationPromises: Promise<Response | void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr).getTime();
    const diff = deadline - now;
    const hoursLeft = diff / 3600000; // ⚡ Bolt: Pre-calculated constant (1000 * 60 * 60)

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notificationPromises.push(sendTelegramNotification(member.chat_id, message));

      task.notified_1day = true;
      updated = true;
      results.push({ task: task.title, type: "1day", sent: true });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notificationPromises.push(sendTelegramNotification(member.chat_id, message));

      task.notified_1hour = true;
      updated = true;
      results.push({ task: task.title, type: "1hour", sent: true });
    }
  }

  // ⚡ Bolt: Execute independent API calls in parallel to reduce total latency.
  // Reduces execution time from O(N * API_LATENCY) to O(max(API_LATENCY)).
  if (notificationPromises.length > 0) {
    await Promise.allSettled(notificationPromises);
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(now).toISOString(),
  });
}
