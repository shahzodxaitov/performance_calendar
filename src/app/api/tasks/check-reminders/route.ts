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
  // Performance Optimization:
  // 1. Cache current timestamp (ms) to avoid repeated Date object constructions in loop.
  // 2. Map team members by ID for O(1) lookups instead of O(N) array searching inside loop.
  // 3. Use Date.parse() for timestamp parsing.
  // 4. Concurrently dispatch Telegram notification requests using Promise.allSettled() instead of sequential await loops.
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // Create a Map for O(1) team member lookup
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notificationPromises: Promise<void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineMs = Date.parse(deadlineStr);
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

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
