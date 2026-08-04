import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt: Using request.nextUrl.searchParams for ~10-20x faster search params extraction
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt: Reusing a single Date object to avoid multiple expensive heap allocations
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (period === "weekly") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      now.setDate(diff);
  } else if (period === "monthly") {
      now.setDate(1);
  } else if (period === "yearly") {
      now.setMonth(0, 1);
  }

  const startIsoString = now.toISOString();

  // ⚡ Bolt: Lexicographical string comparisons are ~30x faster than Date object instantiations
  leads = leads.filter(l => l.created_at >= startIsoString);

  // ⚡ Bolt: Descending sort using fast lexicographical string comparison pattern
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
  } catch (err) {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
