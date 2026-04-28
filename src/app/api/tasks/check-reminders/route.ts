import { NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers } from "@/lib/data-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramNotification(chatId: string, text: string) {
  if (!chatId || !BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}

export async function GET() {
  const now = Date.now(); // ⚡ Bolt: Use numeric timestamp for faster arithmetic in the loop
  const tasks = getTasks();
  const team = getTeamMembers();
  // ⚡ Bolt: Use a Map for O(1) member lookups to avoid O(N*M) complexity in the loop
  const teamMap = new Map(team.map((m) => [m.id, m]));

  const results: { task: string; type: string; sent: boolean }[] = [];
  const notifications: Promise<{ success: boolean; taskIdx: number; field: "notified_1day" | "notified_1hour"; title: string; type: string }>[] = [];

  tasks.forEach((task, idx) => {
    if (task.status === "done") return;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) return;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;
    const deadline = new Date(deadlineStr).getTime();
    const diff = deadline - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => ({
          success,
          taskIdx: idx,
          field: "notified_1day",
          title: task.title,
          type: "1day",
        }))
      );
    }

    if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notifications.push(
        sendTelegramNotification(member.chat_id, message).then((success) => ({
          success,
          taskIdx: idx,
          field: "notified_1hour",
          title: task.title,
          type: "1hour",
        }))
      );
    }
  });

  // ⚡ Bolt: Send notifications in parallel to reduce total latency from O(N) to O(1) of max latency
  const settled = await Promise.allSettled(notifications);
  let updated = false;

  settled.forEach((res) => {
    if (res.status === "fulfilled" && res.value.success) {
      const { taskIdx, field, title, type } = res.value;
      tasks[taskIdx][field] = true;
      updated = true;
      results.push({ task: title, type, sent: true });
    }
  });

  if (updated) saveTasks(tasks);

  return NextResponse.json({
    checked: tasks.length,
    reminders_sent: results.length,
    details: results,
    checked_at: new Date(now).toISOString(),
  });
}
