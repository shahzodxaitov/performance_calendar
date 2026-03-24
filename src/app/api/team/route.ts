import { NextRequest, NextResponse } from "next/server";
import { getTeamMembers, saveTeamMembers, type TeamMember } from "@/lib/data-store";

const colors = ["#0071e3", "#bf5af2", "#30d158", "#ff9f0a", "#ff375f", "#34c759", "#af52de"];

// GET - Barcha jamoa a'zolarini o'qish
export async function GET() {
  const team = getTeamMembers();
  return NextResponse.json({ team });
}

// POST - Yangi a'zo qo'shish
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, role } = body;
    if (!full_name || !role) {
      return NextResponse.json({ error: "Ism va rol majburiy" }, { status: 400 });
    }

    const team = getTeamMembers();
    const newMember: TeamMember = {
      id: `u${Date.now()}`,
      full_name,
      role,
      chat_id: null,
      avatar_color: colors[team.length % colors.length]
    };

    team.push(newMember);
    saveTeamMembers(team);

    return NextResponse.json({ member: newMember });
  } catch (err) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

// PATCH - Bot orqali ulanish yoki ma'lumotlarni yangilash
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, chat_id, full_name, role } = body;
    if (!id) return NextResponse.json({ error: "Qaysi a'zoligi ko'rsatilmagan (id)" }, { status: 400 });

    const team = getTeamMembers();
    const idx = team.findIndex(m => m.id === id);
    if (idx === -1) return NextResponse.json({ error: "A'zo topilmadi" }, { status: 404 });

    // Chat ID yoki ism/rolni yangilash
    if (chat_id !== undefined) team[idx].chat_id = chat_id;
    if (full_name !== undefined) team[idx].full_name = full_name;
    if (role !== undefined) team[idx].role = role;

    saveTeamMembers(team);

    return NextResponse.json({ member: team[idx] });
  } catch (err) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

// DELETE - A'zoni o'chirish
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Id kerak" }, { status: 400 });

      let team = getTeamMembers();
      team = team.filter((m) => m.id !== id);
      saveTeamMembers(team);

      return NextResponse.json({ success: true });
  } catch (error) {
      return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
