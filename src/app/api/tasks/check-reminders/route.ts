import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// ⚡ Bolt: Helper returns response boolean to accurately update notification delivery flags
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

interface PendingReminder {
  taskIndex: number;
  type: "1day" | "1hour";
  taskTitle: string;
  chatId: string;
  message: string;
}

export async function GET() {
  // ⚡ Bolt: Use Date.now() timestamp to avoid allocating redundant Date heap objects
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Index team members into a Map for O(1) lookups instead of O(N * M) team.find() iterations
  const teamMap = new Map(team.map((m) => [m.id, m]));
  const pendingReminders: PendingReminder[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    // ⚡ Bolt: Use Date.parse() instead of new Date() instance allocations
    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadlineMs = Date.parse(deadlineStr);
    if (Number.isNaN(deadlineMs)) continue;

    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / 3600000; // 1000 * 60 * 60

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      pendingReminders.push({
        taskIndex: i,
        type: "1day",
        taskTitle: task.title,
        chatId: member.chat_id,
        message,
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingReminders.push({
        taskIndex: i,
        type: "1hour",
        taskTitle: task.title,
        chatId: member.chat_id,
        message,
      });
    }
  }

  // ⚡ Bolt: Parallelize Telegram notification dispatches via Promise.allSettled()
  // Reduces network latency from O(K) sequential round-trips to O(1) concurrent latency
  let updated = false;
  const results: { task: string; type: string; sent: boolean }[] = [];

  if (pendingReminders.length > 0) {
    const dispatchResults = await Promise.allSettled(
      pendingReminders.map(async (reminder) => {
        const sent = await sendTelegramNotification(reminder.chatId, reminder.message);
        return { reminder, sent };
      })
    );

    for (const outcome of dispatchResults) {
      if (outcome.status === "fulfilled" && outcome.value.sent) {
        const { reminder } = outcome.value;
        const task = tasks[reminder.taskIndex];
        if (reminder.type === "1day") {
          task.notified_1day = true;
        } else {
          task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: reminder.taskTitle, type: reminder.type, sent: true });
      } else if (outcome.status === "fulfilled") {
        const { reminder } = outcome.value;
        results.push({ task: reminder.taskTitle, type: reminder.type, sent: false });
      } else {
        results.push({ task: "Unknown", type: "error", sent: false });
      }
    }
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.filter((r) => r.sent).length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
