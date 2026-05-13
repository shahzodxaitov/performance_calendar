import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Refactored to return success status for reliable state persistence.
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
    console.error("Telegram notification error:", error);
    return false;
  }
}

interface NotificationJob {
  task: LocalTask;
  type: "1day" | "1hour";
  chatId: string;
  message: string;
}

export async function GET() {
  const now = new Date();
  const nowMs = now.getTime(); // ⚡ Bolt: Hoist timestamp for arithmetic
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use Map for O(1) lookup, reducing overall complexity to O(N+M)
  const teamMap = new Map(team.map(m => [m.id, m]));

  const jobs: NotificationJob[] = [];
  const results: { task: string; type: string; sent: boolean }[] = [];

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
      jobs.push({ task, type: "1day", chatId: member.chat_id, message });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      jobs.push({ task, type: "1hour", chatId: member.chat_id, message });
    }
  }

  if (jobs.length > 0) {
    // ⚡ Bolt: Parallelize independent network requests using Promise.allSettled
    // to reduce total execution time from sum of latencies to max latency.
    const settledResults = await Promise.allSettled(
      jobs.map(async (job) => {
        const success = await sendTelegramNotification(job.chatId, job.message);
        return { ...job, success };
      })
    );

    let updated = false;

    for (const res of settledResults) {
      if (res.status === "fulfilled" && res.value.success) {
        const job = res.value;
        if (job.type === "1day") job.task.notified_1day = true;
        if (job.type === "1hour") job.task.notified_1hour = true;
        updated = true;
        results.push({ task: job.task.title, type: job.type, sent: true });
      } else if (res.status === "fulfilled") {
        results.push({ task: res.value.task.title, type: res.value.type, sent: false });
      }
    }

    if (updated) {
      saveTasks(tasks);
    }
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
