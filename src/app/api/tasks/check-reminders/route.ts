import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Return true on success, false on failure so we only update state on successful delivery
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
  // ⚡ Bolt: Cache baseline timestamp outside loop to avoid redundant .getTime() calls
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Build an O(M) lookup Map of team members to replace O(T * M) nested find loops with O(1) lookups
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Collect all pending notifications to execute them concurrently with Promise.allSettled
  const pendingNotifications: {
    taskIndex: number;
    type: "1day" | "1hour";
    chatId: string;
    message: string;
    taskTitle: string;
  }[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
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
      pendingNotifications.push({
        taskIndex: i,
        type: "1day",
        chatId: member.chat_id,
        message,
        taskTitle: task.title,
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingNotifications.push({
        taskIndex: i,
        type: "1hour",
        chatId: member.chat_id,
        message,
        taskTitle: task.title,
      });
    }
  }

  // ⚡ Bolt: Send all Telegram notifications concurrently using Promise.allSettled
  if (pendingNotifications.length > 0) {
    const fetchPromises = pendingNotifications.map((notif) =>
      sendTelegramNotification(notif.chatId, notif.message)
    );

    const outcomes = await Promise.allSettled(fetchPromises);

    for (let idx = 0; idx < outcomes.length; idx++) {
      const outcome = outcomes[idx];
      const notif = pendingNotifications[idx];

      // ⚡ Bolt: Only mark as notified and update DB if the notification succeeded
      if (outcome.status === "fulfilled" && outcome.value === true) {
        const task = tasks[notif.taskIndex];
        if (notif.type === "1day") {
          task.notified_1day = true;
        } else {
          task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: notif.taskTitle, type: notif.type, sent: true });
      } else {
        results.push({ task: notif.taskTitle, type: notif.type, sent: false });
      }
    }
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
