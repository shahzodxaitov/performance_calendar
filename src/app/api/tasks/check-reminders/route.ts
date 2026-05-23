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
  const tasks = getTasks();
  const team = getTeamMembers();
  // ⚡ Bolt: Use Map for O(1) team member lookup instead of O(N*M) search
  const teamMap = new Map(team.map((m) => [m.id, m]));
  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: { promise: Promise<boolean>; onUpdate: () => void; taskTitle: string; type: string }[] = [];

  // ⚡ Bolt: Cache current time in MS to avoid repeated Date object overhead
  const nowMs = now.getTime();

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Reuse numeric timestamp comparisons
    const deadlineMs = Date.parse(deadlineStr);
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notifications.push({
        promise: sendTelegramNotification(member.chat_id, message),
        onUpdate: () => { task.notified_1day = true; },
        taskTitle: task.title,
        type: "1day"
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notifications.push({
        promise: sendTelegramNotification(member.chat_id, message),
        onUpdate: () => { task.notified_1hour = true; },
        taskTitle: task.title,
        type: "1hour"
      });
    }
  }

  // ⚡ Bolt: Parallelize all notifications and only update state for successful ones
  if (notifications.length > 0) {
    const outcomes = await Promise.allSettled(notifications.map(n => n.promise));
    let updated = false;

    outcomes.forEach((outcome, index) => {
      if (outcome.status === "fulfilled" && outcome.value === true) {
        notifications[index].onUpdate();
        updated = true;
        results.push({ task: notifications[index].taskTitle, type: notifications[index].type, sent: true });
      } else {
        results.push({ task: notifications[index].taskTitle, type: notifications[index].type, sent: false });
      }
    });

    if (updated) saveTasks(tasks);
  }

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter(r => r.sent).length,
    details: results,
    checked_at: now.toISOString(),
  });
}
