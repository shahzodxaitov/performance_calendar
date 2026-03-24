import { NextRequest, NextResponse } from "next/server";
import { getCompanies, saveCompanies, type Company } from "@/lib/data-store";

export async function GET() {
  const companies = getCompanies();
  return NextResponse.json({ companies });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, fb_ad_account_id } = body;
    if (!name) {
      return NextResponse.json({ error: "Loyiha nomi majburiy" }, { status: 400 });
    }

    const companies = getCompanies();
    const token = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const newCompany: Company = {
      id: `c${Date.now()}`,
      name,
      token,
      fb_ad_account_id
    };

    companies.push(newCompany);
    saveCompanies(companies);

    return NextResponse.json({ company: newCompany });
  } catch (err) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fb_ad_account_id, fb_access_token, name, amocrm_domain, amocrm_access_token } = body;
    if (!id) return NextResponse.json({ error: "Id kerak" }, { status: 400 });

    const companies = getCompanies();
    const idx = companies.findIndex(c => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "Loyhia topilmadi" }, { status: 404 });

    if (fb_ad_account_id !== undefined) companies[idx].fb_ad_account_id = fb_ad_account_id;
    if (fb_access_token !== undefined) companies[idx].fb_access_token = fb_access_token;
    if (name !== undefined) companies[idx].name = name;
    if (amocrm_domain !== undefined) companies[idx].amocrm_domain = amocrm_domain;
    if (amocrm_access_token !== undefined) companies[idx].amocrm_access_token = amocrm_access_token;

    saveCompanies(companies);
    return NextResponse.json({ company: companies[idx] });
  } catch (err) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Id kerak" }, { status: 400 });

    let companies = getCompanies();
    companies = companies.filter((c) => c.id !== id);
    saveCompanies(companies);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
