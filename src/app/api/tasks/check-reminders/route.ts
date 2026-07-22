import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Send Telegram notifications.
 * Returns boolean indicating success of the operation.
 */
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  // ⚡ Bolt: Cache baseline timestamp to ensure a consistent reference throughout the batch process
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Convert team members lookup from O(N * M) to O(N + M) using a Map
  const teamMap = new Map(team.map((member) => [member.id, member]));

  // ⚡ Bolt: Parallelize all state-modifying network requests with Promise.allSettled
  const notificationPromises: Promise<{
    taskIndex: number;
    type: "1day" | "1hour";
    success: boolean;
  }>[] = [];

  const msInHour = 1000 * 60 * 60;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Parse the deadline to numeric timestamp for low overhead comparison (avoiding Date object overhead in loops)
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineMs = Date.parse(deadlineStr);

    if (isNaN(deadlineMs)) continue;

    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / msInHour;

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      const chatId = member.chat_id;

      notificationPromises.push(
        sendTelegramNotification(chatId, message).then((success) => ({
          taskIndex: i,
          type: "1day" as const,
          success,
        }))
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      const chatId = member.chat_id;

      notificationPromises.push(
        sendTelegramNotification(chatId, message).then((success) => ({
          taskIndex: i,
          type: "1hour" as const,
          success,
        }))
      );
    }
  }

  // ⚡ Bolt: Wait for all notifications in parallel
  if (notificationPromises.length > 0) {
    const settledResults = await Promise.allSettled(notificationPromises);

    for (const result of settledResults) {
      if (result.status === "fulfilled" && result.value.success) {
        const { taskIndex, type } = result.value;
        const task = tasks[taskIndex];

        if (type === "1day") {
          task.notified_1day = true;
        } else {
          task.notified_1hour = true;
        }

        updated = true;
        results.push({ task: task.title, type, sent: true });
      }
    }
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
