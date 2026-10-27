import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // Bolt optimization: Replaced `new URL(request.url)` with `request.nextUrl.searchParams`
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // Bolt optimization: Streamline period date boundary calculations with a single Date object
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startTimestamp = startOfToday.getTime();
  
  if (period === "weekly") {
      const day = now.getDay(), diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfToday.setDate(diff);
      startTimestamp = startOfToday.getTime();
  } else if (period === "monthly") {
      startTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  } else if (period === "yearly") {
      startTimestamp = new Date(now.getFullYear(), 0, 1).getTime();
  }

  // Bolt optimization: Replaced `new Date().getTime()` in filter with `Date.parse()` primitive timestamp comparison (eliminates O(N) Date allocations)
  leads = leads.filter(l => Date.parse(l.created_at) >= startTimestamp);

  // Bolt optimization: Replaced `new Date().getTime()` in sort with `localeCompare()` on ISO 8601 strings (eliminates O(N log N) Date allocations)
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
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
