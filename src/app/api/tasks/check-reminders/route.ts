import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Optimized Telegram notification helper.
 * Returns Promise<boolean> to ensure state updates only occur on successful delivery.
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
  } catch (error) {
    console.error("⚡ Bolt: Telegram notification failed", error);
    return false;
  }
}

export async function GET() {
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: O(N+M) lookup instead of O(N*M)
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: Promise<{ task: LocalTask; type: string; success: boolean }>[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // Use specific timezone offset for consistent deadline calculation
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadlineMs = new Date(deadlineStr).getTime();
    const diffMs = deadlineMs - nowMs;
    const hoursLeft = diffMs / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({
          task, type: "1day", success
        }))
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      notifications.push(
        sendTelegramNotification(member.chat_id, message).then(success => ({
          task, type: "1hour", success
        }))
      );
    }
  }

  // ⚡ Bolt: Parallelize independent network requests to reduce total latency
  const settled = await Promise.allSettled(notifications);
  let updated = false;

  settled.forEach(res => {
    if (res.status === "fulfilled" && res.value.success) {
      const { task, type } = res.value;
      if (type === "1day") task.notified_1day = true;
      if (type === "1hour") task.notified_1hour = true;
      updated = true;
      results.push({ task: task.title, type, sent: true });
    }
  });

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
