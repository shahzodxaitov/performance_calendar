import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

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
  const nowMs = now.getTime(); // ⚡ Bolt: Caching current timestamp to avoid redundant now.getTime() calculations in loops
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: O(N + M) complexity optimization. Converting team members array to a Map for O(1) lookups instead of nested find/O(N*M)
  const teamMap = new Map<string, typeof team[0]>();
  for (const m of team) {
    teamMap.set(m.id, m);
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // We will collect the required notifications to be processed in parallel later
  const notificationPromises: {
    task: typeof tasks[0];
    type: "1day" | "1hour";
    chatId: string;
    message: string;
  }[] = [];

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
      notificationPromises.push({
        task,
        type: "1day",
        chatId: member.chat_id,
        message,
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationPromises.push({
        task,
        type: "1hour",
        chatId: member.chat_id,
        message,
      });
    }
  }

  // ⚡ Bolt: Execute notifications in parallel with Promise.allSettled to minimize total API latency
  if (notificationPromises.length > 0) {
    const jobs = notificationPromises.map(async (p) => {
      const sent = await sendTelegramNotification(p.chatId, p.message);
      return { p, sent };
    });

    const outcomes = await Promise.allSettled(jobs);
    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled") {
        const { p, sent } = outcome.value;
        if (sent) {
          if (p.type === "1day") {
            p.task.notified_1day = true;
          } else {
            p.task.notified_1hour = true;
          }
          updated = true;
          results.push({ task: p.task.title, type: p.type, sent: true });
        }
      }
    }
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
