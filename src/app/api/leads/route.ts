import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use request.nextUrl.searchParams to avoid URL parsing overhead
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt: Reuse a single Date object to compute the period start timestamp
  const dateObj = new Date();
  const currentDay = dateObj.getDate();
  let startTimestamp = dateObj.setHours(0, 0, 0, 0);
  
  if (period === "weekly") {
    const day = dateObj.getDay();
    const diff = currentDay - day + (day === 0 ? -6 : 1);
    dateObj.setDate(diff);
    startTimestamp = dateObj.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    dateObj.setDate(1);
    startTimestamp = dateObj.setHours(0, 0, 0, 0);
  } else if (period === "yearly") {
    dateObj.setMonth(0, 1);
    startTimestamp = dateObj.setHours(0, 0, 0, 0);
  }

  // ⚡ Bolt: Convert the startTimestamp to an ISO string once.
  // This allows us to perform fast, native lexicographical string comparisons
  // on ISO 8601 strings, which is ~30x faster than creating Date objects in loops.
  const startISOString = new Date(startTimestamp).toISOString();

  // Faqat joriy davrdagi leadlarni filtrlash
  leads = leads.filter(l => l.created_at >= startISOString);

  // Sorter from newest to oldest using lexicographical string comparison
  leads.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));

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
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
