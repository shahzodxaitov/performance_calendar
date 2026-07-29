import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use request.nextUrl.searchParams instead of parsing request.url which requires new URL overhead
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt: Reuse a single Date instance to compute start boundary instead of multiple instantiations
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

  // ⚡ Bolt: Convert the startTimestamp boundary once to an ISO 8601 string to perform highly performant
  // native lexicographical comparisons. This avoids calling `new Date()` and `.getTime()` inside the O(N) loop.
  const startISOString = new Date(startTimestamp).toISOString();

  // Faqat joriy davrdagi leadlarni filtrlash
  leads = leads.filter(l => l.created_at >= startISOString);

  // Sorter from newest to oldest
  // ⚡ Bolt: Use direct lexicographical comparison of ISO 8601 string timestamps for O(1) Date instantiation in sort
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
    // ⚡ Bolt: Removed unused 'err' binding in catch block to satisfy typescript-eslint/no-unused-vars rule cleanly
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
