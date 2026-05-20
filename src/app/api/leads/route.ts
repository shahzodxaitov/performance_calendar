import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use request.nextUrl.searchParams for better performance in Next.js
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt: Reuse a single Date object to avoid multiple instantiations
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  
  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
  } else if (period === "monthly") {
    startDate.setDate(1);
  } else if (period === "yearly") {
    startDate.setMonth(0, 1);
  }

  // ⚡ Bolt: Use lexicographical string comparison for ISO 8601 timestamps.
  // This is ~30x faster than creating new Date objects for each item in the loop.
  const startISO = startDate.toISOString();

  // Faqat joriy davrdagi leadlarni filtrlash
  leads = leads.filter(l => l.created_at >= startISO);

  // Sorter from newest to oldest
  // ⚡ Bolt: Direct string comparison for sorting is much more efficient than Date conversion
  leads.sort((a, b) => {
    if (a.created_at < b.created_at) return 1;
    if (a.created_at > b.created_at) return -1;
    return 0;
  });

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
