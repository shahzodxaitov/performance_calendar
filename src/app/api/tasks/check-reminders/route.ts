import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Send Telegram message with custom options.
 * Returns true if the message was sent successfully, false otherwise.
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
  // ⚡ Bolt: Cache current timestamp once to prevent repeated `new Date()` allocations in loop
  const now = new Date();
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Build a Map for O(1) team lookup, reducing total lookup time complexity from O(Tasks * Team) to O(Tasks + Team)
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Track notifications to be sent in parallel to eliminate blocking I/O sequential delay
  const notificationsToProcess: {
    taskIndex: number;
    chatId: string;
    message: string;
    type: "1day" | "1hour";
    title: string;
  }[] = [];

  tasks.forEach((task, index) => {
    if (task.status === "done") return;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) return;

    // ⚡ Bolt: Parse deadline using startOfDay or given time
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationsToProcess.push({
        taskIndex: index,
        chatId: member.chat_id,
        message,
        type: "1day",
        title: task.title,
      });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationsToProcess.push({
        taskIndex: index,
        chatId: member.chat_id,
        message,
        type: "1hour",
        title: task.title,
      });
    }
  });

  // ⚡ Bolt: Parallelize all notifications with Promise.allSettled
  if (notificationsToProcess.length > 0) {
    const promises = notificationsToProcess.map((notif) =>
      sendTelegramNotification(notif.chatId, notif.message)
    );

    const outcomes = await Promise.allSettled(promises);

    outcomes.forEach((outcome, idx) => {
      const notif = notificationsToProcess[idx];
      const task = tasks[notif.taskIndex];
      const success = outcome.status === "fulfilled" && outcome.value;

      if (success) {
        if (notif.type === "1day") {
          task.notified_1day = true;
        } else {
          task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: notif.title, type: notif.type, sent: true });
      } else {
        results.push({ task: notif.title, type: notif.type, sent: false });
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
