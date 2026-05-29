import { NextRequest, NextResponse } from "next/server";
import { getReports, saveReports, getCompanies, getTasks, getLeads, getTeamMembers, type ReportData, type ReportType } from "@/lib/data-store";
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use request.nextUrl.searchParams for better performance in Next.js
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const token = searchParams.get("token");
  
  let reports = getReports();
  
  if (token) {
    const report = reports.find(r => r.share_token === token);
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, report });
  }

  if (companyId && companyId !== "all") {
    reports = reports.filter(r => r.company_id === companyId);
  }
  
  // ⚡ Bolt: Use lexicographical string comparison for faster sorting (avoiding Date instantiation)
  // Sort by created_at desc
  reports.sort((a, b) => b.created_at.localeCompare(a.created_at));
  
  return NextResponse.json({ success: true, reports });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_id, type, start_date, end_date } = body;

    const companies = getCompanies();
    const company = companies.find((c) => c.id === company_id);
    if (!company) {
      return NextResponse.json({ error: "Kompaniya topilmadi" }, { status: 404 });
    }

    const startDate = new Date(start_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    // ⚡ Bolt: Use ISO strings for lexicographical comparison to avoid thousands of Date instantiations in filter loops
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
    
    // Compute data from db
    const leads = getLeads().filter(l => l.company_id === company_id && l.created_at >= startIso && l.created_at <= endIso);
    const tasks = getTasks().filter(t => t.company_id === company_id && t.created_at >= startIso && t.created_at <= endIso);
    
    const totalLeads = leads.length;
    const sales = leads.filter(l => l.status === "Sotib oldi").length;
    const totalTasks = tasks.length || 0;
    const doneTasks = tasks.filter(t => t.status === "done").length;
    
    // Group sources
    const sourceCount: Record<string, number> = {};
    leads.forEach(l => {
      sourceCount[l.source] = (sourceCount[l.source] || 0) + 1;
    });
    let topSource = "Direct";
    let max = 0;
    Object.entries(sourceCount).forEach(([src, count]) => {
      if (count > max) { max = count; topSource = src; }
    });
    if (totalLeads === 0) topSource = "Mavjud emas";

    const conversion = totalLeads ? Math.round((sales / totalLeads) * 100) : 0;
    
    let reportType = type || "custom";
    let title = "Maxsus Hisobot";
    if (reportType === "daily") { title = "Kunlik Hisobot"; }
    else if (reportType === "weekly") { title = "Haftalik Hisobot"; }
    else if (reportType === "monthly") { title = "Oylik Hisobot"; }
    else { reportType = "custom"; title = "Maxsus Hisobot"; }

    const newReport: ReportData = {
      id: Math.random().toString(36).substring(7),
      type: reportType as ReportType,
      title,
      subtitle: `${startDate.toLocaleDateString("uz-UZ")} – ${endDate.toLocaleDateString("uz-UZ")}`,
      company_id,
      company_name: company.name,
      share_token: `${company.token}-${Math.random().toString(36).substring(7)}`,
      created_at: new Date().toISOString(),
      data: {
        leads: totalLeads,
        leads_ch: "+0%",
        sales: `0 UzS`, // Placeholder
        sales_ch: "+0%",
        done: doneTasks,
        total: totalTasks,
        source: topSource,
        conversion: `${conversion}%`,
        conversion_ch: "+0%"
      }
    };
    
    // Calculate real changes or use 0% as default
    newReport.data.leads_ch = "0%";
    newReport.data.sales_ch = "0%";
    newReport.data.conversion_ch = "0%";
    newReport.data.sales = "0 UzS";

    const reports = getReports();
    reports.push(newReport);
    saveReports(reports);

    // Send Telegram Notification to all connected admins/managers
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8748815281:AAGeIxoLPVLWJ0Zek4VZNoqYXI2IOzHIpmI";
    if (BOT_TOKEN) {
       const team = getTeamMembers();
       const chatIdSet = new Set<string>();

       // ⚡ Bolt: Use Set for O(N) unique chatIds collection
       // Add local chat ids
       team.forEach((m) => {
          if (m.chat_id) chatIdSet.add(m.chat_id);
       });
       
       // Try fetching all chat_ids from Supabase if configured
       try {
         if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
            const { data } = await supabase.from("profiles").select("telegram_chat_id").not("telegram_chat_id", "is", null);
            if (data) {
               data.forEach((p) => {
                  if (p.telegram_chat_id) chatIdSet.add(p.telegram_chat_id);
               });
            }
         }
       } catch {
         // Silently handle Supabase fetch errors
       }
       
       const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
       const reportUrl = `${APP_URL}/reports/share/${newReport.share_token}`;
       const message = `📊 <b>Yangi Hisobot Tayyor: ${title}</b>
🏢 Loyiha: <b>${company.name}</b>
📅 Sana: ${newReport.subtitle}
    
💼 Leads: <b>${newReport.data.leads} ta</b>
💰 Sotuvlar: <b>${newReport.data.sales}</b>
✅ Bajarilgan ishlar: <b>${newReport.data.done} ta</b>

Maketni yuklab oling yoki ko'ring:\n🔗 ${reportUrl}`;

       // ⚡ Bolt: Parallelize Telegram notifications with Promise.allSettled for significant speedup
       const chatIds = Array.from(chatIdSet);
       await Promise.allSettled(chatIds.map(cid =>
          fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ chat_id: cid, text: message, parse_mode: "HTML" })
          })
       ));
    }

    return NextResponse.json({ success: true, report: newReport });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // ⚡ Bolt: Use request.nextUrl.searchParams for better performance
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID yuborilmadi" }, { status: 400 });

  let reports = getReports();
  const initialLength = reports.length;
  reports = reports.filter(r => r.id !== id);
  if (reports.length === initialLength) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  saveReports(reports);
  return NextResponse.json({ success: true });
}
