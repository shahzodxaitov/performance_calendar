import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  const now = new Date();
  let startTimestamp = new Date(new Date().setHours(0,0,0,0)).getTime();
  
  if (period === "weekly") {
      const day = now.getDay(), diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startTimestamp = new Date(new Date(now).setDate(diff)).setHours(0,0,0,0);
  } else if (period === "monthly") {
      startTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  } else if (period === "yearly") {
      startTimestamp = new Date(now.getFullYear(), 0, 1).getTime();
  }

  // Faqat joriy davrdagi leadlarni filtrlash
  leads = leads.filter(l => new Date(l.created_at).getTime() >= startTimestamp);

  // Sorter from newest to oldest
  leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json(leads);
}

// PATCH /api/leads
// Mijoz (lead) statusini o'zgartirish uchun (Yangi, Aloqada, Rad etdi)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json({ error: "id va status berilishi shart." }, { status: 400 });
    }
    
    const leads = getLeads();
    const index = leads.findIndex(l => l.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: "Lead topilmadi." }, { status: 404 });
    }
    
    leads[index].status = status;
    saveLeads(leads);
    
    return NextResponse.json({ success: true, lead: leads[index] });
  } catch (err) {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
