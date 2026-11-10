import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

// Hardcoded tokens removed for security compliance; only read from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * Sends a Telegram notification message.
 * Returns true if message was sent successfully, false otherwise.
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
  // Bolt Optimization:
  // 1. Cache current timestamp in milliseconds (Date.now()) to prevent instantiating new Date objects per check.
  // 2. Index team members into a Map for O(1) key lookups instead of doing an O(M) search inside the O(N) tasks loop.
  // 3. Use primitive Date.parse() instead of heap-allocating new Date(deadlineStr) instances.
  // 4. Parallelize outbound Telegram HTTP notifications via Promise.allSettled() instead of sequential await in the loop.
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const pendingNotifications: Array<{
    task: typeof tasks[number];
    type: "1day" | "1hour";
    promise: Promise<boolean>;
  }> = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineMs = Date.parse(deadlineStr);
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingNotifications.push({
        task,
        type: "1day",
        promise: sendTelegramNotification(member.chat_id, message),
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({
        task,
        type: "1hour",
        promise: sendTelegramNotification(member.chat_id, message),
      });
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  if (pendingNotifications.length > 0) {
    const settled = await Promise.allSettled(
      pendingNotifications.map((n) => n.promise)
    );

    settled.forEach((outcome, idx) => {
      const item = pendingNotifications[idx];
      const sent = outcome.status === "fulfilled" && outcome.value;
      if (sent) {
        if (item.type === "1day") item.task.notified_1day = true;
        if (item.type === "1hour") item.task.notified_1hour = true;
        updated = true;
      }
      results.push({ task: item.task.title, type: item.type, sent });
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
