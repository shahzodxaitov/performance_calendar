import { NextRequest, NextResponse } from "next/server";
import {
  getReports,
  saveReports,
  getCompanies,
  getTasks,
  getLeads,
  getTeamMembers,
  type ReportData,
  type ReportType,
  type TeamMember,
} from "@/lib/data-store";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Bolt Optimization: Use request.nextUrl.searchParams to avoid URL object allocation overhead
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const token = searchParams.get("token");

  let reports = getReports();

  if (token) {
    const report = reports.find((r) => r.share_token === token);
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, report });
  }

  if (companyId && companyId !== "all") {
    reports = reports.filter((r) => r.company_id === companyId);
  }

  // Bolt Optimization: Sort by created_at desc using Date.parse() instead of instantiating Date objects in comparator
  reports.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

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

    // Bolt Optimization: Compute timestamp boundaries once to avoid Date allocations inside filter loops
    const startDate = new Date(start_date);
    startDate.setHours(0, 0, 0, 0);
    const startMs = startDate.getTime();

    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);
    const endMs = endDate.getTime();

    // Bolt Optimization: Use primitive Date.parse() timestamp comparisons inside filter loops
    const leads = getLeads().filter((l) => {
      if (l.company_id !== company_id) return false;
      const t = Date.parse(l.created_at);
      return t >= startMs && t <= endMs;
    });

    const tasks = getTasks().filter((t) => {
      if (t.company_id !== company_id) return false;
      const taskTime = Date.parse(t.created_at);
      return taskTime >= startMs && taskTime <= endMs;
    });

    const totalLeads = leads.length;
    const sales = leads.filter((l) => l.status === "Sotib oldi").length;
    const totalTasks = tasks.length || 0;
    const doneTasks = tasks.filter((t) => t.status === "done").length;

    // Group sources
    const sourceCount: Record<string, number> = {};
    leads.forEach((l) => {
      sourceCount[l.source] = (sourceCount[l.source] || 0) + 1;
    });
    let topSource = "Direct";
    let max = 0;
    Object.entries(sourceCount).forEach(([src, count]) => {
      if (count > max) {
        max = count;
        topSource = src;
      }
    });
    if (totalLeads === 0) topSource = "Mavjud emas";

    const conversion = totalLeads ? Math.round((sales / totalLeads) * 100) : 0;

    let reportType: ReportType = "custom";
    let title = "Maxsus Hisobot";
    if (type === "daily") {
      reportType = "daily";
      title = "Kunlik Hisobot";
    } else if (type === "weekly") {
      reportType = "weekly";
      title = "Haftalik Hisobot";
    } else if (type === "monthly") {
      reportType = "monthly";
      title = "Oylik Hisobot";
    }

    const newReport: ReportData = {
      id: Math.random().toString(36).substring(7),
      type: reportType,
      title,
      subtitle: `${startDate.toLocaleDateString("uz-UZ")} – ${endDate.toLocaleDateString("uz-UZ")}`,
      company_id,
      company_name: company.name,
      share_token: `${company.token}-${Math.random().toString(36).substring(7)}`,
      created_at: new Date().toISOString(),
      data: {
        leads: totalLeads,
        leads_ch: "0%",
        sales: "0 UzS",
        sales_ch: "0%",
        done: doneTasks,
        total: totalTasks,
        source: topSource,
        conversion: `${conversion}%`,
        conversion_ch: "0%",
      },
    };

    const reports = getReports();
    reports.push(newReport);
    saveReports(reports);

    // Bolt Optimization: Parallel Telegram notification dispatch without hardcoded fallback tokens
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      const team = getTeamMembers();
      const chatIds: string[] = [];

      team.forEach((m: TeamMember) => {
        if (m.chat_id && !chatIds.includes(m.chat_id)) chatIds.push(m.chat_id);
      });

      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );
          const { data } = await supabase
            .from("profiles")
            .select("telegram_chat_id")
            .not("telegram_chat_id", "is", null);
          if (data) {
            data.forEach((p: { telegram_chat_id: string | null }) => {
              if (p.telegram_chat_id && !chatIds.includes(p.telegram_chat_id))
                chatIds.push(p.telegram_chat_id);
            });
          }
        }
      } catch {
        // Ignore Supabase errors gracefully
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

      // Bolt Optimization: Send notifications concurrently with Promise.allSettled
      await Promise.allSettled(
        chatIds.map((cid) =>
          fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: cid, text: message, parse_mode: "HTML" }),
          })
        )
      );
    }

    return NextResponse.json({ success: true, report: newReport });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Bolt Optimization: Use request.nextUrl.searchParams to avoid URL object allocation overhead
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID yuborilmadi" }, { status: 400 });

  let reports = getReports();
  const initialLength = reports.length;
  reports = reports.filter((r) => r.id !== id);
  if (reports.length === initialLength) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  saveReports(reports);
  return NextResponse.json({ success: true });
}
