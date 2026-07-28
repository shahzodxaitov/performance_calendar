import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

// ⚡ Bolt: Removed hardcoded API token fallbacks to adhere strictly to environment variables.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Refactored helper to return boolean indicating delivery success.
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
  // ⚡ Bolt: Cache baseline timestamp once to ensure identical comparison references across loop items
  const now = new Date();
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Optimize lookup complexity from O(N * M) to O(N + M) using a Map for team members
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Collect pending notifications to execute parallelly rather than sequentially
  const pendingNotifications: Array<{
    taskIndex: number;
    type: "1day" | "1hour";
    chatId: string;
    message: string;
  }> = [];

  tasks.forEach((task, index) => {
    if (task.status === "done") return;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) return;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // We construct Date to parse string. Reuse getTime() to perform numeric comparisons instead of complex instantiations.
    const deadlineMs = new Date(deadlineStr).getTime();
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingNotifications.push({
        taskIndex: index,
        type: "1day",
        chatId: member.chat_id,
        message,
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({
        taskIndex: index,
        type: "1hour",
        chatId: member.chat_id,
        message,
      });
    }
  });

  // ⚡ Bolt: Execute notifications in parallel using Promise.allSettled to minimize latency overhead
  if (pendingNotifications.length > 0) {
    const deliveryPromises = pendingNotifications.map(notification =>
      sendTelegramNotification(notification.chatId, notification.message)
    );

    const outcomes = await Promise.allSettled(deliveryPromises);

    outcomes.forEach((outcome, index) => {
      const detail = pendingNotifications[index];
      const task = tasks[detail.taskIndex];
      const isSuccessful = outcome.status === "fulfilled" && outcome.value;

      // ⚡ Bolt: Safe flag state updates. Task flags are only updated if Telegram notification succeeds.
      if (isSuccessful) {
        if (detail.type === "1day") {
          task.notified_1day = true;
        } else if (detail.type === "1hour") {
          task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: task.title, type: detail.type, sent: true });
      } else {
        results.push({ task: task.title, type: detail.type, sent: false });
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
