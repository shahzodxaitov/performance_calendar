import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Improved helper with error handling and success status.
 * Returning a boolean ensures we only update task state on successful delivery.
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
    console.error("⚡ Bolt: Telegram notification error:", error);
    return false;
  }
}

export async function GET() {
  // ⚡ Bolt: Hoist now.getTime() to avoid redundant Date object overhead in loops
  const now = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use Map for O(1) team member lookups. Complexity: O(N*M) -> O(N+M)
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: "1day" | "1hour"; sent: boolean }[] = [];
  const pendingNotifications: {
    promise: Promise<boolean>;
    task: (typeof tasks)[0];
    type: "1day" | "1hour";
  }[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Lexicographical comparison or numeric timestamp is faster than Date parsing if optimized further,
    // but here we keep Date for ISO 8601 compatibility with timezone offset.
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr).getTime();
    const diff = deadline - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingNotifications.push({
        promise: sendTelegramNotification(member.chat_id, message),
        task,
        type: "1day",
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({
        promise: sendTelegramNotification(member.chat_id, message),
        task,
        type: "1hour",
      });
    }
  }

  // ⚡ Bolt: Parallelize notifications to avoid sequential network latency bottlenecks
  if (pendingNotifications.length > 0) {
    const notificationResults = await Promise.allSettled(
      pendingNotifications.map((p) => p.promise)
    );

    let updated = false;
    notificationResults.forEach((res, index) => {
      const { task, type } = pendingNotifications[index];
      const sent = res.status === "fulfilled" && res.value;

      if (sent) {
        if (type === "1day") task.notified_1day = true;
        if (type === "1hour") task.notified_1hour = true;
        updated = true;
      }

      results.push({ task: task.title, type, sent });
    });

    if (updated) saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: new Date().toISOString(),
  });
}
