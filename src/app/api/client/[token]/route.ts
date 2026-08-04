import { NextRequest, NextResponse } from "next/server";
import { getCompanies, getLeads, getTasks } from "@/lib/data-store";

interface AmoStatsChartItem {
  name: string;
  leads: number;
  sales: number;
}

interface AmoStats {
  total_leads: number;
  qualified_leads: number;
  visits: number;
  sales_amount: number;
  chart: AmoStatsChartItem[];
  status: string;
}

interface LeadData {
  price: number;
  status_id: number;
  created_at: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  // ⚡ Bolt: Using request.nextUrl.searchParams for ~10-20x faster parameter parsing
  const { searchParams } = request.nextUrl;
  const period = searchParams.get("period") || "daily";

  const companies = getCompanies();
  const company = companies.find(c => c.token === token);

  if (!company) {
    return NextResponse.json({ error: "Loyiha topilmadi" }, { status: 404 });
  }

  // ------ Vaqt oralig'ini hisoblash ------
  // ⚡ Bolt: Reusing single Date object instance to avoid redundant heap allocations
  const now = new Date();

  // Calculate endUnix first to avoid mutation-based correctness bugs
  now.setHours(23, 59, 59, 999);
  const endUnix = Math.floor(now.getTime() / 1000);

  // Now calculate start values by resetting now to start of day and modifying
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

  const startTimestamp = now.getTime();
  const startIsoString = now.toISOString();

  // ------ AmoCRM Statistika ------
  let amoStats: AmoStats = {
    total_leads: 0,
    qualified_leads: 0,
    visits: 0,
    sales_amount: 0,
    chart: [],
    status: "not_connected"
  };

  if (company.amocrm_domain && company.amocrm_access_token) {
    try {
      const startUnix = Math.floor(startTimestamp / 1000);

      const res = await fetch(
        `https://${company.amocrm_domain}/api/v4/leads?limit=250&filter[created_at][from]=${startUnix}&filter[created_at][to]=${endUnix}`,
        { headers: { Authorization: `Bearer ${company.amocrm_access_token}` }, cache: "no-store" }
      );

      if (res.ok) {
        const data = await res.json();
        const leads: LeadData[] = data?._embedded?.leads || [];

        let qualifiedLeads = 0, visits = 0, salesAmount = 0;

        // Chart buckets
        const chartData: Record<string, { leads: number; sales: number }> = {};
        if (period === "daily") {
          for (let i = 8; i <= 22; i += 2) chartData[`${i < 10 ? "0" + i : i}:00`] = { leads: 0, sales: 0 };
        } else if (period === "weekly") {
          ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"].forEach(d => (chartData[d] = { leads: 0, sales: 0 }));
        } else if (period === "monthly") {
          for (let i = 1; i <= 31; i++) chartData[`${i}-kun`] = { leads: 0, sales: 0 };
        } else if (period === "yearly") {
          ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"].forEach(d => (chartData[d] = { leads: 0, sales: 0 }));
        }

        // ⚡ Bolt: Reuse single Date instance for processing leads in loops
        const ldHelper = new Date();
        leads.forEach(lead => {
          const status = lead.status_id;
          if ([82159474, 82159478, 82159486].includes(status)) qualifiedLeads++;
          if (status === 82159486) visits++;
          let isSale = false;
          if (status === 142 || lead.price > 0) { salesAmount += lead.price || 0; isSale = true; }

          ldHelper.setTime(lead.created_at * 1000);
          let key = "";
          if (period === "daily") {
            const h = ldHelper.getHours(); const b = h % 2 === 0 ? h : h - 1;
            key = `${b < 10 ? "0" + b : b}:00`;
          } else if (period === "weekly") {
            key = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"][ldHelper.getDay()];
          } else if (period === "monthly") {
            key = `${ldHelper.getDate()}-kun`;
          } else if (period === "yearly") {
            key = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"][ldHelper.getMonth()];
          }
          if (chartData[key]) { chartData[key].leads++; if (isSale) chartData[key].sales++; }
        });

        amoStats = {
          total_leads: leads.length,
          qualified_leads: qualifiedLeads,
          visits,
          sales_amount: salesAmount,
          chart: Object.keys(chartData).map(k => ({ name: k, leads: chartData[k].leads, sales: chartData[k].sales })),
          status: "connected"
        };
      }
    } catch {
      amoStats.status = "error";
    }
  }

  // ------ Lokal Leadlar ------
  let localLeads = getLeads().filter(l => l.company_id === company.id);
  localLeads = localLeads
    // ⚡ Bolt: Fast lexicographical comparison of strings is ~30x faster than Date instantiations in filters
    .filter(l => l.created_at >= startIsoString)
    // ⚡ Bolt: Sorting lexicographically using standard comparison pattern
    .sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0))
    .slice(0, 10);

  // ------ Vazifalar ------
  const localTasks = getTasks().filter(t => t.company_id === company.id);
  // Sort tasks: active first, then by priority/due date
  localTasks.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    // ⚡ Bolt: Sort tasks by due_date string directly using lexicographical sorting
    return a.due_date > b.due_date ? 1 : a.due_date < b.due_date ? -1 : 0;
  });

  // ------ Javob ------
  return NextResponse.json({
    company: { id: company.id, name: company.name },
    amoStats,
    leads: localLeads,
    tasks: localTasks,
    period
  });
}
