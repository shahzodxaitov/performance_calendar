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

// ⚡ Bolt Optimization:
// 1. Map lookup for team members: replaces O(N) array search inside the task loop with O(1) lookup.
// 2. Date.parse & cached timestamp: avoids creating Date objects per iteration in the loop.
// 3. Parallel async notification batching: uses Promise.allSettled to send Telegram notifications concurrently
//    instead of blocking sequentially on each network request (O(N) latency -> O(1) latency).
export async function GET() {
  const nowMs = Date.now();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Pre-index team members by ID for O(1) constant time lookups
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const notificationTasks: {
    taskIndex: number;
    type: "1day" | "1hour";
    taskTitle: string;
    promise: Promise<boolean>;
  }[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Primitive date parsing prevents unnecessary Date object heap allocations per loop
    const deadlineMs = Date.parse(deadlineStr);
    const diff = deadlineMs - nowMs;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationTasks.push({
        taskIndex: i,
        type: "1day",
        taskTitle: task.title,
        promise: sendTelegramNotification(member.chat_id, message),
      });
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationTasks.push({
        taskIndex: i,
        type: "1hour",
        taskTitle: task.title,
        promise: sendTelegramNotification(member.chat_id, message),
      });
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Execute all notification requests concurrently and update state only upon confirmed success
  if (notificationTasks.length > 0) {
    const settlement = await Promise.allSettled(notificationTasks.map((nt) => nt.promise));

    for (let i = 0; i < notificationTasks.length; i++) {
      const item = notificationTasks[i];
      const res = settlement[i];
      const success = res.status === "fulfilled" && res.value === true;

      if (success) {
        const targetTask = tasks[item.taskIndex];
        if (item.type === "1day") {
          targetTask.notified_1day = true;
        } else if (item.type === "1hour") {
          targetTask.notified_1hour = true;
        }
        updated = true;
        results.push({ task: item.taskTitle, type: item.type, sent: true });
      }
    }
  }

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(nowMs).toISOString(),
  });
}
