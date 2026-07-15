import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Send Telegram notification helper.
 * Returns true if successful, false otherwise.
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
  const now = new Date();
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use a Map for O(1) team member lookups (O(N+M) total complexity)
  const teamMap = new Map(team.map(m => [m.id, m]));

  const notificationPromises: Promise<{ taskIndex: number; type: "1day" | "1hour"; success: boolean }>[] = [];

  tasks.forEach((task, index) => {
    if (task.status === "done") return;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) return;

    // ⚡ Bolt: Construct deadline string and calculate time diff
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineMs = Date.parse(deadlineStr);
    const diffMs = deadlineMs - nowMs;
    const hoursLeft = diffMs / (1000 * 60 * 60);

    // ⚡ Bolt: Queue parallel notifications
    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({ taskIndex: index, type: "1day", success }))
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({ taskIndex: index, type: "1hour", success }))
      );
    }
  });

  // ⚡ Bolt: Parallelize all notification requests to minimize response latency
  const results = await Promise.allSettled(notificationPromises);

  let updated = false;
  const processedDetails: { task: string; type: string; sent: boolean }[] = [];

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value.success) {
      const { taskIndex, type } = result.value;
      const task = tasks[taskIndex];

      if (type === "1day") task.notified_1day = true;
      else if (type === "1hour") task.notified_1hour = true;

      updated = true;
      processedDetails.push({ task: task.title, type, sent: true });
    }
  });

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: processedDetails.length,
    details: processedDetails,
    checked_at: now.toISOString(),
  });
}
