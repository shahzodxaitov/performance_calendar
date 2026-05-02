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
  // ⚡ Bolt: Hoist current timestamp outside the loop
  const now = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use a Map for O(1) team member lookups instead of O(N) Array.find()
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const notificationPromises: Promise<{ task: string; type: "1day" | "1hour"; updateFn: () => void }>[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - now;
    const hoursLeft = diff / 3600000; // 1000 * 60 * 60

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then(() => ({
          task: task.title,
          type: "1day",
          updateFn: () => { task.notified_1day = true; }
        }))
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then(() => ({
          task: task.title,
          type: "1hour",
          updateFn: () => { task.notified_1hour = true; }
        }))
      );
    }
  }

  // ⚡ Bolt: Parallelize all notifications using Promise.allSettled
  const settlements = await Promise.allSettled(notificationPromises);
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  settlements.forEach((settlement) => {
    if (settlement.status === "fulfilled") {
      const { task, type, updateFn } = settlement.value;
      updateFn();
      updated = true;
      results.push({ task, type, sent: true });
    }
  });

  // ⚡ Bolt: Persist updated notification flags
  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(now).toISOString(),
  });
}
