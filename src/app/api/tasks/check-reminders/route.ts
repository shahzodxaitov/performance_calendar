import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

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

export async function GET() {
  const now = new Date();
  const tasks = getTasks();
  const team = getTeamMembers();
  // ⚡ Bolt: Use a Map for O(1) lookup instead of repeated .find() O(N) inside the loop
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  const notifications: {
    promise: Promise<void>;
    task: typeof tasks[0];
    type: "1day" | "1hour";
  }[] = [];

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

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notifications.push({
        promise: sendTelegramNotification(member.chat_id, message),
        task,
        type: "1day",
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notifications.push({
        promise: sendTelegramNotification(member.chat_id, message),
        task,
        type: "1hour",
      });
    }
  }

  if (notifications.length > 0) {
    // ⚡ Bolt: Parallelize notifications to reduce total latency
    const settled = await Promise.allSettled(notifications.map((n) => n.promise));
    settled.forEach((res, index) => {
      if (res.status === "fulfilled") {
        const { task, type } = notifications[index];
        if (type === "1day") task.notified_1day = true;
        else if (type === "1hour") task.notified_1hour = true;
        updated = true;
        results.push({ task: task.title, type, sent: true });
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
