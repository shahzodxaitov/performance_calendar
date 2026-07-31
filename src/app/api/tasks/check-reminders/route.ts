import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type TeamMember } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * Sends a Telegram notification to the specified chatId.
 * ⚡ Bolt: Helper is optimized to return a boolean indicating success,
 * enabling state-modifying logic to mark operations as finished only upon actual success.
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
  // ⚡ Bolt: Cache baseline timestamp once at the start of the request
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Replace O(N*M) lookups with an O(N+M) Map for team members
  const teamMap = new Map<string, TeamMember>();
  for (const m of team) {
    teamMap.set(m.id, m);
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  const pendingNotifications: Promise<void>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Parse deadline using faster string operations/cached pattern
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineMs = Date.parse(deadlineStr);
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    const targetChatId = member.chat_id;

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      pendingNotifications.push(
        sendTelegramNotification(targetChatId, message).then((success) => {
          if (success) {
            task.notified_1day = true;
            updated = true;
            results.push({ task: task.title, type: "1day", sent: true });
          }
        })
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      pendingNotifications.push(
        sendTelegramNotification(targetChatId, message).then((success) => {
          if (success) {
            task.notified_1hour = true;
            updated = true;
            results.push({ task: task.title, type: "1hour", sent: true });
          }
        })
      );
    }
  }

  // ⚡ Bolt: Parallelize all pending notifications via Promise.allSettled
  if (pendingNotifications.length > 0) {
    await Promise.allSettled(pendingNotifications);
  }

  if (updated) {
    saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
