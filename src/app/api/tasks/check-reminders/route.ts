import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Sends a telegram notification and returns a promise resolving to success status.
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

interface NotificationJob {
  taskIndex: number;
  chatId: string;
  message: string;
  type: "1day" | "1hour";
}

export async function GET() {
  // ⚡ Bolt: Cache baseline timestamp once at the start of the request to prevent
  // redundant Date object instantiation and inconsistent comparison thresholds.
  const now = new Date();
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Replace O(N*M) lookups with an O(N+M) Map lookup for team member chat IDs.
  const teamMap = new Map<string, string>();
  for (const member of team) {
    if (member.id && member.chat_id) {
      teamMap.set(member.id, member.chat_id);
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notificationJobs: NotificationJob[] = [];
  let updated = false;

  for (let idx = 0; idx < tasks.length; idx++) {
    const task = tasks[idx];
    if (task.status === "done") continue;

    const chatId = teamMap.get(task.assignee_id);
    if (!chatId) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    // ⚡ Bolt: Filter out already notified tasks and categorize pending notifications
    if (!task.notified_1day && hoursLeft > 2 && hoursLeft <= 28) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationJobs.push({
        taskIndex: idx,
        chatId,
        message,
        type: "1day",
      });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationJobs.push({
        taskIndex: idx,
        chatId,
        message,
        type: "1hour",
      });
    }
  }

  // ⚡ Bolt: Execute all outgoing Telegram notifications in parallel with Promise.allSettled
  // to avoid blocking individual message sends and minimize API request latency.
  if (notificationJobs.length > 0) {
    const promises = notificationJobs.map((job) =>
      sendTelegramNotification(job.chatId, job.message)
    );
    const settledResults = await Promise.allSettled(promises);

    for (let i = 0; i < settledResults.length; i++) {
      const settleResult = settledResults[i];
      const job = notificationJobs[i];
      const task = tasks[job.taskIndex];
      const success = settleResult.status === "fulfilled" && settleResult.value === true;

      if (success) {
        if (job.type === "1day") {
          task.notified_1day = true;
        } else if (job.type === "1hour") {
          task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: task.title, type: job.type, sent: true });
      } else {
        results.push({ task: task.title, type: job.type, sent: false });
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
