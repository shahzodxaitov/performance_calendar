import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads, getCompanies } from "@/lib/data-store";

// POST /api/leads/webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, source, company_id } = body;

    if (!name || !phone || !source) {
      return NextResponse.json({ error: "Ism, telefon va manba (source) kiritilishi shart." }, { status: 400 });
    }

    // Determine the right company_id or default to the first one available
    let targetCompanyId = company_id;
    if (!targetCompanyId) {
       const companies = getCompanies();
       if (companies.length > 0) {
           targetCompanyId = companies[0].id;
       } else {
           return NextResponse.json({ error: "Tizimda loyiha (kompaniya) topilmadi." }, { status: 400 });
       }
    }

    const leads = getLeads();
    
    const newLead = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      phone,
      source,
      status: "Yangi" as const,
      company_id: targetCompanyId,
      created_at: new Date().toISOString()
    };

    leads.push(newLead);
    saveLeads(leads);

    // TODO: Buni kelajakda Telegramga webhook orqali bildirgi qilish ham mumkin.

    return NextResponse.json({ success: true, message: "Lead qabul qilindi", lead: newLead }, { status: 200 });

  } catch (error) {
    console.error("Webhook xatolik:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
