import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Return a success boolean from Telegram notification helper to track delivery status.
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
  // ⚡ Bolt: Cache baseline timestamp to avoid redundant Date.getTime() or Date.now() calls.
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use Map for O(N + M) team member lookups instead of O(N * M) linear scans.
  const teamMap = new Map(team.map(m => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Construct parallelizable notification promises instead of executing them sequentially inside a loop.
  const notificationPromises: Promise<{ taskTitle: string; type: "1day" | "1hour"; sent: boolean; updateFn: () => void }>[] = [];

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
      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then((sent) => ({
          taskTitle: task.title,
          type: "1day",
          sent,
          updateFn: () => {
            task.notified_1day = true;
          }
        }))
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationPromises.push(
        sendTelegramNotification(member.chat_id, message).then((sent) => ({
          taskTitle: task.title,
          type: "1hour",
          sent,
          updateFn: () => {
            task.notified_1hour = true;
          }
        }))
      );
    }
  }

  if (notificationPromises.length > 0) {
    // Execute all notifications in parallel
    const outcomes = await Promise.allSettled(notificationPromises);
    outcomes.forEach((outcome) => {
      if (outcome.status === "fulfilled" && outcome.value.sent) {
        outcome.value.updateFn();
        updated = true;
        results.push({
          task: outcome.value.taskTitle,
          type: outcome.value.type,
          sent: true
        });
      }
    });
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
