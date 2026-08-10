import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask, type TeamMember } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Helper function returns Promise<boolean> so we only mark tasks as notified on actual success
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const now = new Date();
  // ⚡ Bolt: Cache current timestamp once to avoid repeated Date/heap operations in the loop
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Use Map for O(1) team lookup to reduce complexity from O(N * M) to O(N + M)
  const teamMap = new Map<string, TeamMember>();
  for (const member of team) {
    if (member.id) {
      teamMap.set(member.id, member);
    }
  }

  const pending: {
    task: LocalTask;
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
      pending.push({
        task,
        type: "1day",
        chatId: member.chat_id,
        message,
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pending.push({
        task,
        type: "1hour",
        chatId: member.chat_id,
        message,
      });
    }
  }

  // ⚡ Bolt: Process notifications in parallel with Promise.allSettled to minimize total latency
  if (pending.length > 0) {
    const promises = pending.map((item) => sendTelegramNotification(item.chatId, item.message));
    const settlements = await Promise.allSettled(promises);

    settlements.forEach((settlement, idx) => {
      const item = pending[idx];
      const succeeded = settlement.status === "fulfilled" && settlement.value === true;
      if (succeeded) {
        if (item.type === "1day") {
          item.task.notified_1day = true;
        } else {
          item.task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: item.task.title, type: item.type, sent: true });
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
