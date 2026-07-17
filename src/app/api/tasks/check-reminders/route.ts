import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Helper to send Telegram notification.
 * Returns boolean success indicator to ensure persistent state updates are only performed on successful delivery.
 */
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

interface NotificationJob {
  task: LocalTask;
  chatId: string;
  message: string;
  type: "1day" | "1hour";
}

export async function GET() {
  // ⚡ Bolt: Caching the reference timestamp to avoid multiple Date instantiation inside loop (O(1) vs O(N))
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Converting team list to Map for O(1) key-based lookups instead of O(N * M) nested find inside the loop
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  const jobs: NotificationJob[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Constructing ISO string and parsing to numeric timestamp
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineTime = new Date(deadlineStr).getTime();
    const diff = deadlineTime - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      jobs.push({ task, chatId: member.chat_id, message, type: "1day" });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      jobs.push({ task, chatId: member.chat_id, message, type: "1hour" });
    }
  }

  // ⚡ Bolt: Parallelizing all Telegram notifications using Promise.allSettled to minimize total API request latency
  if (jobs.length > 0) {
    const promises = jobs.map(async (job) => {
      const sent = await sendTelegramNotification(job.chatId, job.message);
      return { job, sent };
    });

    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === "fulfilled" && result.value.sent) {
        const { job } = result.value;
        if (job.type === "1day") {
          job.task.notified_1day = true;
        } else {
          job.task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: job.task.title, type: job.type, sent: true });
      }
    }
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
