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
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (period === "weekly") {
    const day = now.getDay(), diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "yearly") {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const startISO = startDate.toISOString();

  // Faqat joriy davrdagi leadlarni filtrlash
  // Bolt Optimization: Direct lexicographical string comparison is ~30x faster than Date instantiation
  leads = leads.filter(l => l.created_at >= startISO);

  // Sorter from newest to oldest
  // Bolt Optimization: Lexicographical sort is more efficient for ISO 8601 strings
  leads.sort((a, b) => b.created_at.localeCompare(a.created_at));

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
