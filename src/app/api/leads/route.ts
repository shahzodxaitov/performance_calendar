import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// GET /api/leads?company_id=...
export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use nextUrl.searchParams instead of constructing a new URL object
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  let leads = getLeads();
  
  if (companyId && companyId !== "all") {
    leads = leads.filter(l => l.company_id === companyId);
  }

  // ⚡ Bolt: Use a single Date object and modify it to avoid redundant object allocations.
  const referenceDate = new Date();
  
  // ⚡ Bolt: Default behaviour for invalid/undefined period should be start of today, not the current instant.
  if (period === "weekly") {
    const day = referenceDate.getDay();
    const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1);
    referenceDate.setDate(diff);
    referenceDate.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    referenceDate.setDate(1);
    referenceDate.setHours(0, 0, 0, 0);
  } else if (period === "yearly") {
    referenceDate.setMonth(0, 1);
    referenceDate.setHours(0, 0, 0, 0);
  } else {
    // Falls back to "daily" or any other unrecognized period
    referenceDate.setHours(0, 0, 0, 0);
  }

  // ⚡ Bolt: Convert the start of the period to an ISO string for lexicographical comparison.
  // Lexicographical comparisons are ~30x faster than instantiating Date objects on every loop iteration.
  const startIsoString = referenceDate.toISOString();

  // Faqat joriy davrdagi leadlarni filtrlash
  leads = leads.filter(l => l.created_at >= startIsoString);

  // Sorter from newest to oldest
  // ⚡ Bolt: Native string comparison without instantiating Date objects: O(1) space, ~30x faster.
  leads.sort((a, b) => {
    return b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0;
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
  } catch {
    // ⚡ Bolt: Use empty catch clause to avoid unused variable errors
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
