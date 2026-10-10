import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramNotification(chatId: string, text: string) {
  if (!chatId || !BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

// ⚡ Bolt: Performance optimization
// - O(1) Map lookup for team members reduces O(N * M) loop overhead to O(N + M).
// - Reused timestamp numbers via Date.parse() eliminate O(N) Date object heap allocations per request.
// - Concurrently dispatched Telegram API requests via Promise.allSettled reduce network latency from O(N) sequential round-trips to O(1) batch execution time.
export async function GET() {
  const now = new Date();
  const nowTs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // Create fast lookup map for team members
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: Promise<void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineTs = Date.parse(deadlineStr);
    if (isNaN(deadlineTs)) continue;

    const diff = deadlineTs - nowTs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notifications.push(sendTelegramNotification(member.chat_id, message));
      task.notified_1day = true;
      updated = true;
      results.push({ task: task.title, type: "1day", sent: true });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notifications.push(sendTelegramNotification(member.chat_id, message));
      task.notified_1hour = true;
      updated = true;
      results.push({ task: task.title, type: "1hour", sent: true });
    }
  }

  if (notifications.length > 0) {
    await Promise.allSettled(notifications);
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
