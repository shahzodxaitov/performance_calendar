import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Refactored to return success status and handle errors for reliable state updates.
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
    console.error("⚡ Bolt: Telegram notification error:", error);
    return false;
  }
}

export async function GET() {
  // ⚡ Bolt: Hoist current timestamp as a number to avoid repeated Date object overhead in loops.
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use a Map for O(1) member lookups, reducing overall complexity from O(N*M) to O(N+M).
  const teamMap = new Map(team.map(m => [m.id, m]));

  const pendingNotifications: Promise<void>[] = [];
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Use numeric timestamp comparison to avoid unnecessary Date object instantiation.
    const deadlineMs = new Date(deadlineStr).getTime();
    const diffMs = deadlineMs - nowMs;
    const hoursLeft = diffMs / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      // ⚡ Bolt: Queue notifications for parallel execution instead of sequential blocking.
      pendingNotifications.push(
        sendTelegramNotification(member.chat_id, message).then((sent) => {
          if (sent) {
            task.notified_1day = true;
            updated = true;
            results.push({ task: task.title, type: "1day", sent: true });
          }
        })
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      // ⚡ Bolt: Queue notifications for parallel execution instead of sequential blocking.
      pendingNotifications.push(
        sendTelegramNotification(member.chat_id, message).then((sent) => {
          if (sent) {
            task.notified_1hour = true;
            updated = true;
            results.push({ task: task.title, type: "1hour", sent: true });
          }
        })
      );
    }
  }

  // ⚡ Bolt: Parallelize independent network requests to reduce total execution time.
  if (pendingNotifications.length > 0) {
    await Promise.allSettled(pendingNotifications);
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
