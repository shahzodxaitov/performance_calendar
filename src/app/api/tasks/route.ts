import { NextRequest, NextResponse } from "next/server";
import { getTasks, saveTasks, getTeamMembers, type LocalTask } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8748815281:AAGeIxoLPVLWJ0Zek4VZNoqYXI2IOzHIpmI";

async function sendTelegramNotification(chatId: string, text: string) {
  if (!chatId || !BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

function formatTaskMessage(task: LocalTask, type: "new" | "1day" | "1hour") {
  const emoji = type === "new" ? "📋" : type === "1day" ? "⏰" : "🚨";
  const title = type === "new" ? "Yangi Vazifa!" : type === "1day" ? "Eslatma: 1 kun qoldi!" : "Diqqat: 1 soat qoldi!";

  const deadline = task.due_time
    ? `${task.due_date} ${task.due_time}`
    : task.due_date;

  const priorityEmoji: Record<string, string> = {
    low: "🟢 Past", normal: "🟡 O'rta", high: "🟠 Yuqori", urgent: "🔴 Shoshilinch"
  };

  return `${emoji} <b>${title}</b>

📌 <b>${task.title}</b>
${task.description ? `📝 ${task.description}\n` : ""}
🏢 Loyiha: <b>${task.company_name}</b>
⚡️ Muhimlik: ${priorityEmoji[task.priority] || "🟡 O'rta"}
📅 Muddat: <b>${deadline}</b>

━━━━━━━━━━━━━━━━━
${type === "new" ? "✅ Platformada batafsil ko'ring" : type === "1day" ? "⚠️ Iltimos, vaqtida bajaring!" : "‼️ Juda kam vaqt qoldi!"}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id") || "all";
  let tasks = getTasks();
  if (companyId !== "all") {
    tasks = tasks.filter((t) => t.company_id === companyId);
  }
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, company_id, company_name, assignee_id, status, priority, due_date, due_time } = body;

    if (!title || !assignee_id || !due_date) {
      return NextResponse.json({ error: "title, assignee_id, due_date kerak" }, { status: 400 });
    }

    const team = getTeamMembers();
    const member = team.find((m) => m.id === assignee_id);
    const assignee_name = member?.full_name || "Noma'lum";

    // Agar Supabase dagi "profiles" ishlayotgan bo'lsa undan chat_id qidirish, bo'lmasa local JSON dan
    let finalChatId = member?.chat_id;
    if (!finalChatId && assignee_id.includes("-")) { 
       // Supabase IDlari odatda UUID (chiziqcha bilan) bo'ladi
       try {
         const { createClient } = require('@supabase/supabase-js');
         if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
            const { data } = await supabase.from("profiles").select("telegram_chat_id").eq("id", assignee_id).single();
            if (data?.telegram_chat_id) finalChatId = data.telegram_chat_id;
         }
       } catch (e) {}
    }

    const newTask: LocalTask = {
      id: `t${Date.now()}`,
      title,
      description,
      company_id: company_id || "c1",
      company_name: company_name || "Mondelux",
      assignee_id,
      assignee_name,
      status: status || "todo",
      priority: priority || "normal",
      due_date,
      due_time,
      created_at: new Date().toISOString(),
      notified_create: false,
      notified_1day: false,
      notified_1hour: false,
    };

    const tasks = getTasks();
    tasks.unshift(newTask);

    if (finalChatId) {
      const message = formatTaskMessage(newTask, "new");
      await sendTelegramNotification(finalChatId, message);
      newTask.notified_create = true;
    }

    saveTasks(tasks);

    return NextResponse.json({ task: newTask, notified: !!finalChatId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id kerak" }, { status: 400 });
    
    const tasks = getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return NextResponse.json({ error: "Task topilmadi" }, { status: 404 });
    
    tasks[idx] = { ...tasks[idx], ...updates };
    saveTasks(tasks);
    
    return NextResponse.json({ task: tasks[idx] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
