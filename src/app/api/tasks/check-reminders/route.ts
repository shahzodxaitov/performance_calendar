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
  const now = new Date();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Convert team array to a Map for O(1) lookups instead of O(N) .find() inside the loop.
  // This reduces overall complexity from O(Tasks * Team) to O(Tasks + Team).
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: Promise<{
    taskIndex: number;
    type: "1day" | "1hour";
    title: string;
    success: boolean;
  }>[] = [];

  tasks.forEach((task, index) => {
    if (task.status === "done") return;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) return;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - now.getTime();
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then(() => ({
          taskIndex: index,
          type: "1day",
          title: task.title,
          success: true,
        }))
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then(() => ({
          taskIndex: index,
          type: "1hour",
          title: task.title,
          success: true,
        }))
      );
    }
  });

  // ⚡ Bolt: Parallelize Telegram notifications to reduce execution time from sum(latency) to max(latency).
  const settled = await Promise.allSettled(notifications);
  let updated = false;

  settled.forEach((res) => {
    if (res.status === "fulfilled") {
      const { taskIndex, type, title } = res.value;
      const task = tasks[taskIndex];
      if (type === "1day") task.notified_1day = true;
      if (type === "1hour") task.notified_1hour = true;
      updated = true;
      results.push({ task: title, type, sent: true });
    }
  });

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
