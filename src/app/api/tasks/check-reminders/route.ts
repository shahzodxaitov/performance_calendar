import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Send notification helper returns a promise status so we can verify if the request succeeded.
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return response.ok;
  } catch (err) {
    console.error("⚡ Bolt: Telegram sending failed", err);
    return false;
  }
}

export async function GET() {
  // ⚡ Bolt: Cache baseline timestamp to avoid drift & avoid multiple Date instantiation.
  const now = new Date();
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Replace O(N * M) lookup with an O(N + M) Map for team members lookup.
  const teamMap = new Map<string, string>();
  for (const member of team) {
    if (member.chat_id) {
      teamMap.set(member.id, member.chat_id);
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Reuse a single Date object to reduce heap allocation inside the loop.
  const deadlineDate = new Date();

  // ⚡ Bolt: Gather all pending notification tasks so they can be dispatched in parallel.
  const notificationPromises: Promise<{
    success: boolean;
    taskIdx: number;
    title: string;
    type: "1day" | "1hour";
  }>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    const chat_id = teamMap.get(task.assignee_id);
    if (!chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // Set our single Date object's time to reduce garbage collection overhead.
    deadlineDate.setTime(Date.parse(deadlineStr));
    const diff = deadlineDate.getTime() - nowMs;
    const hoursLeft = diff / 3600000; // 1000 * 60 * 60

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      const p = sendTelegramNotification(chat_id, message).then((ok) => ({
        success: ok,
        taskIdx: i,
        title: task.title,
        type: "1day" as const,
      }));
      notificationPromises.push(p);
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      const p = sendTelegramNotification(chat_id, message).then((ok) => ({
        success: ok,
        taskIdx: i,
        title: task.title,
        type: "1hour" as const,
      }));
      notificationPromises.push(p);
    }
  }

  // ⚡ Bolt: Execute all notification network requests concurrently.
  if (notificationPromises.length > 0) {
    const outcomes = await Promise.allSettled(notificationPromises);
    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled" && outcome.value.success) {
        const { taskIdx, title, type } = outcome.value;
        const task = tasks[taskIdx];
        if (type === "1day") {
          task.notified_1day = true;
        } else if (type === "1hour") {
          task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: title, type, sent: true });
      }
    }
  }

  // ⚡ Bolt: Save modified tasks in one synchronous call only if updates were made.
  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
