import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Helper to send Telegram notifications asynchronously
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

interface PendingNotification {
  task: LocalTask;
  type: "1day" | "1hour";
  chatId: string;
  message: string;
}

export async function GET() {
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Create an O(1) Map lookup for team members instead of O(N*M) array find() inside the loop
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const pendingNotifications: PendingNotification[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Use Date.parse() timestamp primitive comparison to avoid heap allocations in loop
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineTime = Date.parse(deadlineStr);
    if (isNaN(deadlineTime)) continue;

    const diff = deadlineTime - nowMs;
    const hoursLeft = diff / 3600000; // 1000 * 60 * 60

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingNotifications.push({
        task,
        type: "1day",
        chatId: member.chat_id,
        message,
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({
        task,
        type: "1hour",
        chatId: member.chat_id,
        message,
      });
    }
  }

  // ⚡ Bolt: Parallelize all Telegram notification requests using Promise.allSettled
  // reducing latency from O(N) sequential round-trips to O(1) concurrent round-trip execution
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  if (pendingNotifications.length > 0) {
    const responses = await Promise.allSettled(
      pendingNotifications.map((p) => sendTelegramNotification(p.chatId, p.message))
    );

    responses.forEach((res, idx) => {
      const pending = pendingNotifications[idx];
      const isSuccess = res.status === "fulfilled" && res.value;

      if (pending.type === "1day") {
        pending.task.notified_1day = true;
      } else if (pending.type === "1hour") {
        pending.task.notified_1hour = true;
      }
      updated = true;
      results.push({
        task: pending.task.title,
        type: pending.type,
        sent: isSuccess,
      });
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
