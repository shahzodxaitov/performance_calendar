import { NextRequest, NextResponse } from "next/server";
import { getCompanies, getLeads, getTasks } from "@/lib/data-store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  // ⚡ Bolt: Use nextUrl.searchParams instead of constructing a new URL object
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "daily";

  const companies = getCompanies();
  const company = companies.find(c => c.token === token);

  if (!company) {
    return NextResponse.json({ error: "Loyiha topilmadi" }, { status: 404 });
  }

  // ------ Vaqt oralig'ini hisoblash ------
  // ⚡ Bolt: Reuse a single Date instance to avoid multiple Date allocations
  const now = new Date();
  const refDate = new Date();
  refDate.setHours(0, 0, 0, 0);
  let startTimestamp = refDate.getTime();

  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    refDate.setDate(diff);
    refDate.setHours(0, 0, 0, 0);
    startTimestamp = refDate.getTime();
  } else if (period === "monthly") {
    refDate.setFullYear(now.getFullYear(), now.getMonth(), 1);
    startTimestamp = refDate.getTime();
  } else if (period === "yearly") {
    refDate.setFullYear(now.getFullYear(), 0, 1);
    startTimestamp = refDate.getTime();
  }

  // ------ AmoCRM Statistika ------
  let amoStats = {
    total_leads: 0,
    qualified_leads: 0,
    visits: 0,
    sales_amount: 0,
    chart: [] as any[],
    status: "not_connected"
  };

  if (company.amocrm_domain && company.amocrm_access_token) {
    try {
      const startUnix = Math.floor(startTimestamp / 1000);
      const endUnix = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000);

      const res = await fetch(
        `https://${company.amocrm_domain}/api/v4/leads?limit=250&filter[created_at][from]=${startUnix}&filter[created_at][to]=${endUnix}`,
        { headers: { Authorization: `Bearer ${company.amocrm_access_token}` }, cache: "no-store" }
      );

      if (res.ok) {
        const data = await res.json();
        const leads: any[] = data?._embedded?.leads || [];

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

        // ⚡ Bolt: Reuse a single Date instance with .setTime() inside loops to prevent O(N) Date allocations
        const reusableDate = new Date();
        leads.forEach(lead => {
          const status = lead.status_id;
          if ([82159474, 82159478, 82159486].includes(status)) qualifiedLeads++;
          if (status === 82159486) visits++;
          let isSale = false;
          if (status === 142 || lead.price > 0) { salesAmount += lead.price || 0; isSale = true; }

          reusableDate.setTime(lead.created_at * 1000);
          let key = "";
          if (period === "daily") {
            const h = reusableDate.getHours(); const b = h % 2 === 0 ? h : h - 1;
            key = `${b < 10 ? "0" + b : b}:00`;
          } else if (period === "weekly") {
            key = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"][reusableDate.getDay()];
          } else if (period === "monthly") {
            key = `${reusableDate.getDate()}-kun`;
          } else if (period === "yearly") {
            key = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"][reusableDate.getMonth()];
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
    } catch (e) {
      amoStats.status = "error";
    }
  }

  // ------ Lokal Leadlar ------
  let localLeads = getLeads().filter(l => l.company_id === company.id);
  // ⚡ Bolt: Convert startTimestamp to an ISO 8601 string to perform highly optimized lexicographical string comparisons
  const startIsoString = new Date(startTimestamp).toISOString();
  localLeads = localLeads
    .filter(l => l.created_at >= startIsoString)
    // ⚡ Bolt: Avoid parsing Date objects by using native lexicographical string comparison for sort
    .sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0))
    .slice(0, 10);

  // ------ Vazifalar ------
  const localTasks = getTasks().filter(t => t.company_id === company.id);
  // Sort tasks: active first, then by priority/due date
  // ⚡ Bolt: Avoid Date parsing overhead when sorting tasks by due_date. Use string comparison instead.
  localTasks.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
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
