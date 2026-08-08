import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// Helper to send Telegram Notification returning success boolean
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
  // ⚡ Bolt: Cache baseline timestamp once to avoid repeated `.getTime()` calls on the same Date instance
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Replace O(N * M) lookup with an O(N + M) Map mapping assignee ID to team member details
  const teamMap = new Map(team.map(m => [m.id, m]));

  const notificationsToSend: {
    taskIndex: number;
    title: string;
    chatId: string;
    message: string;
    type: "1day" | "1hour";
  }[] = [];

  // Identify reminders that need sending
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
      notificationsToSend.push({
        taskIndex: i,
        title: task.title,
        chatId: member.chat_id,
        message,
        type: "1day"
      });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationsToSend.push({
        taskIndex: i,
        title: task.title,
        chatId: member.chat_id,
        message,
        type: "1hour"
      });
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Execute notifications in parallel using Promise.allSettled to eliminate sequential I/O bottlenecks
  if (notificationsToSend.length > 0) {
    const promises = notificationsToSend.map(notif =>
      sendTelegramNotification(notif.chatId, notif.message)
    );
    const outcomes = await Promise.allSettled(promises);

    for (let idx = 0; idx < outcomes.length; idx++) {
      const outcome = outcomes[idx];
      const notif = notificationsToSend[idx];
      const isSuccess = outcome.status === "fulfilled" && outcome.value;

      if (isSuccess) {
        // ⚡ Bolt: Only update task flags if the Telegram API request is confirmed successful
        const task = tasks[notif.taskIndex];
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
    }
  }

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
