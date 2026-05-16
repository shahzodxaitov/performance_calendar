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

  // ⚡ Bolt: Convert to ISO string once to enable high-performance lexicographical string comparisons.
  // This avoids repeated 'new Date()' instantiations in loops, reducing O(N) overhead.
  const startISO = startDate.toISOString();

  // ⚡ Bolt: Lexicographical string comparison is significantly faster than Date object instantiation for ISO 8601 strings.
  leads = leads.filter((l) => l.created_at >= startISO);

  // ⚡ Bolt: Sort from newest to oldest using direct string comparison to avoid O(N log N) Date conversions.
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
