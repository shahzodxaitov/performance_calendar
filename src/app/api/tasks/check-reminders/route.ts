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

export async function GET() {
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Build O(1) team lookup map to avoid O(N*M) linear scans inside loop
  const teamMap = new Map(team.map((member) => [member.id, member]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const pendingNotifications: Promise<void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    // ⚡ Bolt: Fast Map lookup O(1) instead of array find O(M)
    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Fast primitive Date.parse() timestamp comparison avoids Date object creation overhead
    const deadlineMs = Date.parse(deadlineStr);
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / 3600000; // 1000 * 60 * 60

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      // ⚡ Bolt: Queue notification promise for concurrent execution
      pendingNotifications.push(sendTelegramNotification(member.chat_id, message));
      task.notified_1day = true;
      updated = true;
      results.push({ task: task.title, type: "1day", sent: true });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      // ⚡ Bolt: Queue notification promise for concurrent execution
      pendingNotifications.push(sendTelegramNotification(member.chat_id, message));
      task.notified_1hour = true;
      updated = true;
      results.push({ task: task.title, type: "1hour", sent: true });
    }
  }

  // ⚡ Bolt: Execute notifications concurrently in parallel to avoid linear network round-trip latencies
  if (pendingNotifications.length > 0) {
    await Promise.allSettled(pendingNotifications);
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
