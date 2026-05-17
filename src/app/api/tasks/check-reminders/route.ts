import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Added return type to track success of notification
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
  } catch (err) {
    console.error("Telegram notification error:", err);
    return false;
  }
}

export async function GET() {
  const now = new Date();
  const nowMs = now.getTime(); // ⚡ Bolt: Hoisted timestamp for faster comparison
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Complexity optimization O(N*M) -> O(N+M) using Map lookup
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notificationPromises: Promise<void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Date instantiation is expensive, but necessary here for parsing dynamic strings.
    // However, we compare against the hoisted nowMs.
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    // 1 day reminder (24h)
    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      // ⚡ Bolt: Parallelize notifications to avoid sequential I/O blocking
      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1day = true;
            updated = true;
            results.push({ task: task.title, type: "1day", sent: true });
          }
        })
      );
    }

    // 1 hour reminder
    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      // ⚡ Bolt: Parallelize notifications to avoid sequential I/O blocking
      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1hour = true;
            updated = true;
            results.push({ task: task.title, type: "1hour", sent: true });
          }
        })
      );
    }
  }

  // ⚡ Bolt: Wait for all notifications to finish in parallel
  if (notificationPromises.length > 0) {
    await Promise.all(notificationPromises);
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
