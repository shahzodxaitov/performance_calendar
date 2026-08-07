import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask, type TeamMember } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Helper to send Telegram notifications asynchronously.
 * Returns a Promise resolving to a boolean indicating whether the message was sent successfully.
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
  const now = new Date();
  // ⚡ Bolt: (3) Cache baseline timestamp to avoid repeatedly instantiating/calling Date in the loop
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: (1) Replacing O(N*M) lookups with an O(N+M) Map for team members
  const teamMap = new Map<string, TeamMember>();
  for (const member of team) {
    teamMap.set(member.id, member);
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  interface NotificationJob {
    task: LocalTask;
    chatId: string;
    text: string;
    type: "1day" | "1hour";
  }

  const jobs: NotificationJob[] = [];

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
      jobs.push({
        task,
        chatId: member.chat_id,
        text: message,
        type: "1day"
      });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      jobs.push({
        task,
        chatId: member.chat_id,
        text: message,
        type: "1hour"
      });
    }
  }

  if (jobs.length > 0) {
    // ⚡ Bolt: (2) Parallelizing notifications with Promise.allSettled across all tasks to avoid sequential wait times
    const notifications = await Promise.allSettled(
      jobs.map(job => sendTelegramNotification(job.chatId, job.text))
    );

    notifications.forEach((result, idx) => {
      const job = jobs[idx];
      // ⚡ Bolt: (4) Ensuring task flags are only updated if the Telegram notification succeeds
      const succeeded = result.status === "fulfilled" && result.value === true;
      if (succeeded) {
        if (job.type === "1day") {
          job.task.notified_1day = true;
        } else {
          job.task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: job.task.title, type: job.type, sent: true });
      } else {
        results.push({ task: job.task.title, type: job.type, sent: false });
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
