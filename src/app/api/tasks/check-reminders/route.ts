import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Added return boolean to track success and avoid false-positive state updates
async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}

export async function GET() {
  const now = new Date();
  const nowTime = now.getTime(); // ⚡ Bolt: Hoist now.getTime() out of the loop
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use a Map for O(1) team lookups, reducing complexity from O(N*M) to O(N+M)
  const teamMap = new Map(team.map(m => [m.id, m]));

  const pendingNotifications: Promise<{ task: string; type: string; sent: boolean } | null>[] = [];
  let updated = false;

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - nowTime;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;

      // ⚡ Bolt: Queue notifications for parallel execution
      pendingNotifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1day = true;
            updated = true;
            return { task: task.title, type: "1day", sent: true };
          }
          return null;
        })
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;

      // ⚡ Bolt: Queue notifications for parallel execution
      pendingNotifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => {
          if (success) {
            task.notified_1hour = true;
            updated = true;
            return { task: task.title, type: "1hour", sent: true };
          }
          return null;
        })
      );
    }
  }

  // ⚡ Bolt: Parallelize independent network requests using Promise.all
  const results = (await Promise.all(pendingNotifications)).filter((r): r is { task: string; type: string; sent: boolean } => r !== null);

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: now.toISOString(),
  });
}
