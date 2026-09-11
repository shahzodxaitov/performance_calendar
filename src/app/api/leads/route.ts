import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // Optimization: Use Next.js native request.nextUrl.searchParams instead of allocating new URL(request.url)
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // Optimization: Single Date instance for period start calculation to minimize GC overhead
  const now = new Date();
  let startTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startTimestamp = new Date(now.getFullYear(), now.getMonth(), diff).getTime();
  } else if (period === "monthly") {
    startTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  } else if (period === "yearly") {
    startTimestamp = new Date(now.getFullYear(), 0, 1).getTime();
  }

  const startIso = new Date(startTimestamp).toISOString();

  // Optimization: Compare ISO 8601 strings directly instead of allocating new Date(l.created_at) objects for each item
  leads = leads.filter(l => l.created_at >= startIso);

  // Optimization: Sort via direct ISO 8601 string comparisons instead of allocating 2 * N log N Date objects
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
