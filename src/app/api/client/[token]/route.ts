import { NextRequest, NextResponse } from "next/server";
import { getCompanies, getLeads, getTasks } from "@/lib/data-store";

// Hoist static lookup structures outside handler to prevent re-creation per request
const QUALIFIED_STATUSES = new Set([82159474, 82159478, 82159486]);
const WEEKDAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"] as const;
const WEEKDAYS_INDEX = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"] as const;
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"] as const;

interface AmoChartItem {
  name: string;
  leads: number;
  sales: number;
}

interface AmoLead {
  status_id: number;
  price?: number;
  created_at: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  // Use pre-parsed searchParams from NextRequest to eliminate URL constructor overhead
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "daily";

  const companies = getCompanies();
  const company = companies.find(c => c.token === token);

  if (!company) {
    return NextResponse.json({ error: "Loyiha topilmadi" }, { status: 404 });
  }

  // ------ Vaqt oralig'ini hisoblash ------
  const now = new Date();
  let startTimestamp = new Date(now).setHours(0, 0, 0, 0);

  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now);
    weekStart.setDate(diff);
    startTimestamp = weekStart.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    startTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  } else if (period === "yearly") {
    startTimestamp = new Date(now.getFullYear(), 0, 1).getTime();
  }

  // ------ AmoCRM Statistika ------
  let amoStats = {
    total_leads: 0,
    qualified_leads: 0,
    visits: 0,
    sales_amount: 0,
    chart: [] as AmoChartItem[],
    status: "not_connected"
  };

  if (company.amocrm_domain && company.amocrm_access_token) {
    try {
      const startUnix = Math.floor(startTimestamp / 1000);
      const endUnix = Math.floor(new Date(now).setHours(23, 59, 59, 999) / 1000);

      const res = await fetch(
        `https://${company.amocrm_domain}/api/v4/leads?limit=250&filter[created_at][from]=${startUnix}&filter[created_at][to]=${endUnix}`,
        { headers: { Authorization: `Bearer ${company.amocrm_access_token}` }, cache: "no-store" }
      );

      if (res.ok) {
        const data = await res.json();
        const leads: AmoLead[] = data?._embedded?.leads || [];

        let qualifiedLeads = 0;
        let visits = 0;
        let salesAmount = 0;

        // Chart buckets
        const chartData: Record<string, { leads: number; sales: number }> = {};
        if (period === "daily") {
          for (let i = 8; i <= 22; i += 2) chartData[`${i < 10 ? "0" + i : i}:00`] = { leads: 0, sales: 0 };
        } else if (period === "weekly") {
          WEEKDAYS.forEach(d => (chartData[d] = { leads: 0, sales: 0 }));
        } else if (period === "monthly") {
          for (let i = 1; i <= 31; i++) chartData[`${i}-kun`] = { leads: 0, sales: 0 };
        } else if (period === "yearly") {
          MONTHS.forEach(d => (chartData[d] = { leads: 0, sales: 0 }));
        }

        // Reuse a single Date instance to prevent O(N) Date allocations per lead iteration
        const reusableDate = new Date();
        leads.forEach(lead => {
          const status = lead.status_id;
          if (QUALIFIED_STATUSES.has(status)) qualifiedLeads++;
          if (status === 82159486) visits++;
          let isSale = false;
          if (status === 142 || (lead.price && lead.price > 0)) {
            salesAmount += lead.price || 0;
            isSale = true;
          }

          reusableDate.setTime(lead.created_at * 1000);
          let key = "";
          if (period === "daily") {
            const h = reusableDate.getHours();
            const b = h % 2 === 0 ? h : h - 1;
            key = `${b < 10 ? "0" + b : b}:00`;
          } else if (period === "weekly") {
            key = WEEKDAYS_INDEX[reusableDate.getDay()];
          } else if (period === "monthly") {
            key = `${reusableDate.getDate()}-kun`;
          } else if (period === "yearly") {
            key = MONTHS[reusableDate.getMonth()];
          }
          if (chartData[key]) {
            chartData[key].leads++;
            if (isSale) chartData[key].sales++;
          }
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
  // Filter and sort using Date.parse primitive timestamps to avoid O(N) Date allocations
  let localLeads = getLeads().filter(l => l.company_id === company.id);
  localLeads = localLeads
    .filter(l => Date.parse(l.created_at) >= startTimestamp)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 10);

  // ------ Vazifalar ------
  const localTasks = getTasks().filter(t => t.company_id === company.id);
  // Sort tasks: active first, then by priority/due date using direct ISO string comparison
  localTasks.sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return a.due_date.localeCompare(b.due_date);
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
