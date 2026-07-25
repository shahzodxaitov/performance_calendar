import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

// ⚡ Bolt: No hardcoded fallback tokens to ensure security
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ⚡ Bolt: Optimizes network request by returning delivery status
 * so that state updates are only performed on successful delivery.
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

interface PendingReminder {
  taskIdx: number;
  type: "1day" | "1hour";
  chatId: string;
  message: string;
}

export async function GET() {
  const now = new Date();
  // ⚡ Bolt: Cache baseline timestamp once to avoid repeated Date/Epoch instantiations
  const nowMs = now.getTime();

  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: Use Map for O(1) team member lookups.
  // This reduces algorithmic complexity from O(N * M) to O(N + M).
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const pendingReminders: PendingReminder[] = [];
  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    // ⚡ Bolt: O(1) Map lookup instead of sequential O(M) .find()
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
      pendingReminders.push({
        taskIdx: i,
        type: "1day",
        chatId: member.chat_id,
        message,
      });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      pendingReminders.push({
        taskIdx: i,
        type: "1hour",
        chatId: member.chat_id,
        message,
      });
    }
  }

  // ⚡ Bolt: Parallelize all outbound notifications using Promise.allSettled
  // to avoid blocking the main execution thread sequentially.
  if (pendingReminders.length > 0) {
    const notificationPromises = pendingReminders.map(async (reminder) => {
      const success = await sendTelegramNotification(reminder.chatId, reminder.message);
      return { reminder, success };
    });

    const settledResults = await Promise.allSettled(notificationPromises);

    for (const res of settledResults) {
      if (res.status === "fulfilled" && res.value.success) {
        const { reminder } = res.value;
        const task = tasks[reminder.taskIdx];
        if (reminder.type === "1day") {
          task.notified_1day = true;
        } else {
          task.notified_1hour = true;
        }
        updated = true;
        results.push({ task: task.title, type: reminder.type, sent: true });
      }
    }
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
