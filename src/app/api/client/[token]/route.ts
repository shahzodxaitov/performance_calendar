import { NextRequest, NextResponse } from "next/server";
import { getCompanies, getLeads, getTasks } from "@/lib/data-store";

interface ChartDataPoint {
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
  // Use NextRequest searchParams directly to avoid URL parsing overhead
  const period = request.nextUrl.searchParams.get("period") || "daily";

  const companies = getCompanies();
  const company = companies.find((c) => c.token === token);

  if (!company) {
    return NextResponse.json({ error: "Loyiha topilmadi" }, { status: 404 });
  }

  // ------ Vaqt oralig'ini hisoblash ------
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const day = now.getDay();

  let startTimestamp = new Date(year, month, date).getTime();

  if (period === "weekly") {
    const diff = date - day + (day === 0 ? -6 : 1);
    startTimestamp = new Date(year, month, diff).getTime();
  } else if (period === "monthly") {
    startTimestamp = new Date(year, month, 1).getTime();
  } else if (period === "yearly") {
    startTimestamp = new Date(year, 0, 1).getTime();
  }

  // ------ AmoCRM Statistika ------
  let amoStats = {
    total_leads: 0,
    qualified_leads: 0,
    visits: 0,
    sales_amount: 0,
    chart: [] as ChartDataPoint[],
    status: "not_connected",
  };

  if (company.amocrm_domain && company.amocrm_access_token) {
    try {
      const startUnix = Math.floor(startTimestamp / 1000);
      const endUnix = Math.floor(new Date(year, month, date, 23, 59, 59, 999).getTime() / 1000);

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
          ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"].forEach((d) => (chartData[d] = { leads: 0, sales: 0 }));
        } else if (period === "monthly") {
          for (let i = 1; i <= 31; i++) chartData[`${i}-kun`] = { leads: 0, sales: 0 };
        } else if (period === "yearly") {
          ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"].forEach((d) => (chartData[d] = { leads: 0, sales: 0 }));
        }

        // Reuse single Date instance across iterations to prevent O(N) heap allocations
        const ld = new Date();
        leads.forEach((lead) => {
          const status = lead.status_id;
          if ([82159474, 82159478, 82159486].includes(status)) qualifiedLeads++;
          if (status === 82159486) visits++;
          let isSale = false;
          if (status === 142 || (lead.price && lead.price > 0)) {
            salesAmount += lead.price || 0;
            isSale = true;
          }

          ld.setTime(lead.created_at * 1000);
          let key = "";
          if (period === "daily") {
            const h = ld.getHours();
            const b = h % 2 === 0 ? h : h - 1;
            key = `${b < 10 ? "0" + b : b}:00`;
          } else if (period === "weekly") {
            key = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"][ld.getDay()];
          } else if (period === "monthly") {
            key = `${ld.getDate()}-kun`;
          } else if (period === "yearly") {
            key = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"][ld.getMonth()];
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
          chart: Object.keys(chartData).map((k) => ({ name: k, leads: chartData[k].leads, sales: chartData[k].sales })),
          status: "connected",
        };
      }
    } catch {
      amoStats.status = "error";
    }
  }

  // ------ Lokal Leadlar ------
  // Date.parse converts date strings to primitive numbers without allocating Date heap objects
  let localLeads = getLeads().filter((l) => l.company_id === company.id && Date.parse(l.created_at) >= startTimestamp);
  localLeads.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (localLeads.length > 10) {
    localLeads = localLeads.slice(0, 10);
  }

  // ------ Vazifalar ------
  const localTasks = getTasks().filter((t) => t.company_id === company.id);
  // Sort tasks: active first, then by priority/due date via Date.parse primitive subtraction
  localTasks.sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return Date.parse(a.due_date) - Date.parse(b.due_date);
  });

  // ------ Javob ------
  return NextResponse.json({
    company: { id: company.id, name: company.name },
    amoStats,
    leads: localLeads,
    tasks: localTasks,
    period,
  });
}
