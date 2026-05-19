import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Updated to return a boolean indicating success.
 * This allows us to only mark tasks as notified if the message was actually sent.
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
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}

export async function GET() {
  // ⚡ Bolt: Hoist current timestamp to avoid repeated new Date() calls in the loop.
  const now = new Date();
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Convert team array to a Map for O(1) lookups.
  // Reduces complexity from O(N*M) to O(N+M).
  const teamMap = new Map(team.map(m => [m.id, m]));

  const pendingNotifications: Promise<{ task: LocalTask; type: "1day" | "1hour"; success: boolean }>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Using numeric comparison is faster than full Date objects for repeated checks.
    const deadlineMs = new Date(deadlineStr).getTime();
    const diffMs = deadlineMs - nowMs;
    const hoursLeft = diffMs / (1000 * 60 * 60);

    // 1 day reminder
    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      pendingNotifications.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({
          task,
          type: "1day",
          success
        }))
      );
    }

    // 1 hour reminder
    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      pendingNotifications.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({
          task,
          type: "1hour",
          success
        }))
      );
    }
  }

  // ⚡ Bolt: Parallelize all notifications.
  // This reduces total execution time from O(K*RTT) to O(RTT).
  const results = await Promise.allSettled(pendingNotifications);

  const processedResults = results.map(res => {
    if (res.status === "fulfilled" && res.value.success) {
      const { task, type } = res.value;
      if (type === "1day") task.notified_1day = true;
      if (type === "1hour") task.notified_1hour = true;
      updated = true;
      return { task: task.title, type, sent: true };
    }
    return { task: "Unknown", type: "Unknown", sent: false };
  }).filter(r => r.sent);

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: processedResults.length,
    details: processedResults,
    checked_at: now.toISOString(),
  });
}
