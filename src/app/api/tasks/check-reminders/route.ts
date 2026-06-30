import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Refactored to return success status and handle errors gracefully
 * to support reliable parallelization and state updates.
 */
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const now = new Date();
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  /**
   * ⚡ Bolt: O(N+M) optimization
   * Use a Map for O(1) team member lookups instead of O(M) .find() inside the O(N) loop.
   */
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notificationsToProcess: { taskIdx: number, type: 'notified_1day' | 'notified_1hour', message: string, chatId: string }[] = [];

  tasks.forEach((task, idx) => {
    if (task.status === "done") return;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) return;

    // ⚡ Bolt: Single point of date construction per task
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineMs = new Date(deadlineStr).getTime();
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationsToProcess.push({
        taskIdx: idx,
        type: 'notified_1day',
        message,
        chatId: member.chat_id
      });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationsToProcess.push({
        taskIdx: idx,
        type: 'notified_1hour',
        message,
        chatId: member.chat_id
      });
    }
  });

  /**
   * ⚡ Bolt: Parallel notification processing
   * Using Promise.allSettled to send all notifications concurrently.
   */
  if (notificationsToProcess.length > 0) {
    const notificationResults = await Promise.allSettled(
      notificationsToProcess.map(n => sendTelegramNotification(n.chatId, n.message))
    );

    let updated = false;
    notificationResults.forEach((res, i) => {
      const success = res.status === 'fulfilled' && res.value;
      if (success) {
        const item = notificationsToProcess[i];
        const task = tasks[item.taskIdx];
        task[item.type] = true;
        updated = true;
        results.push({
          task: task.title,
          type: item.type === 'notified_1day' ? "1day" : "1hour",
          sent: true
        });
      }
    });

    if (updated) saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
