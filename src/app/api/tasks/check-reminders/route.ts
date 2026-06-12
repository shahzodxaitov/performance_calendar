import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  // ⚡ Bolt: Return success status to allow conditional state updates.
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
  const nowMs = now.getTime(); // ⚡ Bolt: Cache timestamp to avoid repeated getTime() calls.
  const tasks = getTasks();
  const team = getTeamMembers();
  // ⚡ Bolt: Use a Map for O(1) lookup instead of O(N) find in a loop. Reduces complexity from O(N*M) to O(N+M).
  const teamMap = new Map(team.map((m) => [m.id, m]));
  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: Promise<{ success: boolean; task: LocalTask; type: string }>[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => ({ success, task, type: "1day" }))
      );
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => ({ success, task, type: "1hour" }))
      );
    }
  }

  // ⚡ Bolt: Parallelize notifications to reduce total execution time.
  if (notifications.length > 0) {
    const settled = await Promise.allSettled(notifications);
    let updated = false;

    settled.forEach((res) => {
      if (res.status === "fulfilled" && res.value.success) {
        const { task, type } = res.value;
        if (type === "1day") task.notified_1day = true;
        if (type === "1hour") task.notified_1hour = true;
        updated = true;
        results.push({ task: task.title, type, sent: true });
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
