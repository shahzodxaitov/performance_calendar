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
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // Performance optimization: Pre-build a lookup Map for team members to avoid O(N*M) array find lookups
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notificationsToPromises: { promise: Promise<void>; task: (typeof tasks)[0]; type: string }[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // Performance optimization: Use Date.parse() primitive timestamp avoiding Date object allocations per task
    const deadlineMs = Date.parse(deadlineStr);
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationsToPromises.push({
        promise: sendTelegramNotification(member.chat_id, message),
        task,
        type: "1day",
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationsToPromises.push({
        promise: sendTelegramNotification(member.chat_id, message),
        task,
        type: "1hour",
      });
    }
  }

  // Performance optimization: Parallelize all outgoing Telegram HTTP requests concurrently
  if (notificationsToPromises.length > 0) {
    const settleResults = await Promise.allSettled(notificationsToPromises.map((item) => item.promise));
    settleResults.forEach((res, index) => {
      const item = notificationsToPromises[index];
      const isFulfilled = res.status === "fulfilled";
      if (isFulfilled) {
        if (item.type === "1day") item.task.notified_1day = true;
        if (item.type === "1hour") item.task.notified_1hour = true;
        updated = true;
      }
      results.push({
        task: item.task.title,
        type: item.type,
        sent: isFulfilled,
      });
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
