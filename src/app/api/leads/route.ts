import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt Optimization: Use Next.js native request.nextUrl.searchParams to avoid new URL() constructor overhead
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt Optimization: Calculate start boundary reusing single Date instance without extra allocations
  const now = new Date();
  let startTimestamp: number;
  
  if (period === "weekly") {
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
  } else {
    // "daily" or default
    now.setHours(0, 0, 0, 0);
    startTimestamp = now.getTime();
  }

  // ⚡ Bolt Optimization: Use primitive Date.parse() instead of new Date().getTime() inside filter (saves O(N) Date allocations)
  leads = leads.filter(l => Date.parse(l.created_at) >= startTimestamp);

  // ⚡ Bolt Optimization: Direct ISO 8601 string comparison for sorting eliminates both Date allocations and string parsing in sort loop
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
