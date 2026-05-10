import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return response.ok;
  } catch (error) {
    console.error("⚡ Bolt: Telegram notification failed", error);
    return false;
  }
}

export async function GET() {
  // ⚡ Bolt: Use numeric timestamp for faster comparison and avoid repeated Date object creation
  const now = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Complexity O(N+M) instead of O(N*M) by using a Map for team lookups
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: Promise<void>[] = [];
  const pendingUpdates: (() => void)[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineTime = new Date(deadlineStr).getTime();
    const diff = deadlineTime - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    // 1-day reminder logic
    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1day = true;
            pendingUpdates.push(() => {
              results.push({ task: task.title, type: "1day", sent: true });
            });
          }
        })
      );
    }

    // 1-hour reminder logic
    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1hour = true;
            pendingUpdates.push(() => {
              results.push({ task: task.title, type: "1hour", sent: true });
            });
          }
        })
      );
    }
  }

  // ⚡ Bolt: Execute all notifications in parallel to reduce total latency from O(N) to O(max(N))
  if (notifications.length > 0) {
    await Promise.allSettled(notifications);
    pendingUpdates.forEach(update => update());
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(now).toISOString(),
  });
}
