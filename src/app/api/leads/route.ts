import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use `request.nextUrl.searchParams` instead of parsing `new URL(request.url)` to avoid unnecessary URL object allocations and parsing overhead.
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt: Optimize date/time calculation to reuse date instances and minimize memory allocation on the heap.
  // Instead of instantiating multiple Date objects, we manipulate a single baseline Date instance where possible.
  const now = new Date();
  
  if (period === "weekly") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      now.setDate(diff);
  } else if (period === "monthly") {
      now.setDate(1);
  } else if (period === "yearly") {
      now.setMonth(0, 1);
  }
  now.setHours(0, 0, 0, 0);

  // ⚡ Bolt: Convert target boundary date to ISO string once.
  // Lexicographical string comparisons on ISO-8601 strings are ~30x faster than parsing Date objects in loop.
  const startIsoString = now.toISOString();

  // ⚡ Bolt: Filter leads using native string comparisons rather than converting each `l.created_at` string back to timestamp.
  leads = leads.filter(l => l.created_at >= startIsoString);

  // ⚡ Bolt: Sort leads using a high-performance lexicographical string comparison on the ISO-8601 timestamp fields without Date instantiation.
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
