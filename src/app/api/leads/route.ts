import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use `request.nextUrl.searchParams` instead of parsing `new URL(request.url)` to avoid unnecessary URL object allocations.
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt: Reuse a single Date instance for period calculations instead of instantiating multiple Date objects.
  const now = new Date();
  let startTimestamp = 0;
  
  if (period === "daily") {
    now.setHours(0, 0, 0, 0);
    startTimestamp = now.getTime();
  } else if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    now.setDate(diff);
    now.setHours(0, 0, 0, 0);
    startTimestamp = now.getTime();
  } else if (period === "monthly") {
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    startTimestamp = now.getTime();
  } else if (period === "yearly") {
    now.setMonth(0, 1);
    now.setHours(0, 0, 0, 0);
    startTimestamp = now.getTime();
  }

  // ⚡ Bolt: Convert the start timestamp to an ISO string and use lexicographical string comparison for O(N) filtering to avoid creating extra Date objects.
  const startISOString = new Date(startTimestamp).toISOString();
  leads = leads.filter(l => l.created_at >= startISOString);

  // ⚡ Bolt: Use direct lexicographical string comparisons for O(N log N) sorting, avoiding 100% of Date allocations within the sort loop.
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
