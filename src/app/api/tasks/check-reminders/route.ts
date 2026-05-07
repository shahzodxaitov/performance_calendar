import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Returns success boolean to enable reliable state updates in batch operations.
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
    console.error("Telegram notification failed:", error);
    return false;
  }
}

export async function GET() {
  const now = Date.now(); // ⚡ Bolt: Hoist timestamp to avoid repeated Date object creation
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use Map for O(1) team member lookups, reducing complexity from O(N*M) to O(N+M)
  const teamMap = new Map(team.map(m => [m.id, m]));

  const notifications: Promise<{ taskIndex: number; type: "1day" | "1hour"; success: boolean }>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadline = new Date(deadlineStr).getTime();
    const diff = deadline - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({
          taskIndex: i,
          type: "1day",
          success
        }))
      );
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      // ⚡ Bolt: Using 'else if' because both notifications shouldn't trigger simultaneously
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({
          taskIndex: i,
          type: "1hour",
          success
        }))
      );
    }
  }

  // ⚡ Bolt: Parallelize independent network requests to reduce total latency from sum to max
  const results = await Promise.allSettled(notifications);

  let updated = false;
  const details: { task: string; type: string; sent: boolean }[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      const { taskIndex, type } = result.value;
      const task = tasks[taskIndex];

      if (type === "1day") task.notified_1day = true;
      if (type === "1hour") task.notified_1hour = true;

      updated = true;
      details.push({ task: task.title, type, sent: true });
    }
  }

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: details.length,
    details: details,
    checked_at: new Date(now).toISOString(),
  });
}
