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
  const nowMs = now.getTime();
  const tasks = getTasks();
  const team = getTeamMembers();

  // ⚡ Bolt: O(1) Map lookup for team members instead of O(N) array search inside loop
  const teamMap = new Map(team.map((member) => [member.id, member]));

  const notificationPromises: {
    task: (typeof tasks)[number];
    type: "1day" | "1hour";
    promise: Promise<boolean>;
  }[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const member = teamMap.get(task.assignee_id);
    if (!member?.chat_id) continue;

    const deadlineStr = task.due_time
      ? `${task.due_date}T${task.due_time}:00+05:00`
      : `${task.due_date}T23:59:00+05:00`;

    // ⚡ Bolt: Fast Date.parse() primitive timestamp arithmetic without object allocation
    const deadlineMs = Date.parse(deadlineStr);
    if (Number.isNaN(deadlineMs)) continue;

    const diffMs = deadlineMs - nowMs;
    const hoursLeft = diffMs / 3600000; // 1000ms * 60s * 60m

    if (!task.notified_1day && hoursLeft > 0 && hoursLeft <= 28 && hoursLeft > 2) {
      const message = `⏰ <b>Eslatma: 1 kun qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n⚠️ Iltimos, vaqtida bajaring!`;
      notificationPromises.push({
        task,
        type: "1day",
        promise: sendTelegramNotification(member.chat_id, message),
      });
    } else if (!task.notified_1hour && hoursLeft > 0 && hoursLeft <= 1.5) {
      const message = `🚨 <b>Diqqat: 1 soat qoldi!</b>\n\n📌 <b>${task.title}</b>\n🏢 Loyiha: <b>${task.company_name}</b>\n📅 Muddat: <b>${task.due_date}${task.due_time ? " " + task.due_time : ""}</b>\n\n‼️ Juda kam vaqt qoldi!`;
      notificationPromises.push({
        task,
        type: "1hour",
        promise: sendTelegramNotification(member.chat_id, message),
      });
    }
  }

  const results: { task: string; type: string; sent: boolean }[] = [];
  let updated = false;

  // ⚡ Bolt: Parallelize Telegram notification HTTP requests concurrently using Promise.allSettled
  if (notificationPromises.length > 0) {
    const settleResults = await Promise.allSettled(
      notificationPromises.map((p) => p.promise)
    );

    settleResults.forEach((res, index) => {
      const item = notificationPromises[index];
      const isSuccess = res.status === "fulfilled" && res.value === true;

      if (isSuccess) {
        if (item.type === "1day") item.task.notified_1day = true;
        if (item.type === "1hour") item.task.notified_1hour = true;
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
