import { NextRequest, NextResponse } from "next/server";
import { getCompanies } from "@/lib/data-store";

export const dynamic = "force-dynamic";

interface AmoCrmLead {
  id: number;
  status_id: number;
  price?: number;
  created_at: number;
}

interface ChartItem {
  name: string;
  leads: number;
  sales: number;
}

// ⚡ Bolt: Hoisted static constants to avoid redundant heap allocations on every request and loop pass
const WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const QUALIFIED_STATUS_IDS = new Set([82159474, 82159478, 82159486]);

export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use Next.js native request.nextUrl.searchParams to avoid URL parsing overhead
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  if (!companyId) {
    return NextResponse.json({ error: "company_id is required" }, { status: 400 });
  }

  const companies = getCompanies();
  const company = companies.find(c => c.id === companyId);

  // Default o'rtacha mock qiymatlar
  let stats = {
    total_leads: 0,
    qualified_leads: 0,
    visits: 0,
    sales_amount: 0,
    chart: [] as ChartItem[],
    status: "not_connected"
  };

  if (companyId === "all") {
     stats = { total_leads: 0, qualified_leads: 0, visits: 0, sales_amount: 0, chart: [], status: "mock" };
     return NextResponse.json(stats);
  }

  if (company && company.amocrm_domain && company.amocrm_access_token) {
    try {
      // Calculate timestamps based on period
      let startOfDay = 0;
      const endOfDay = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000);
      const now = new Date();

      if (period === "daily") {
         startOfDay = Math.floor(new Date(new Date().setHours(0,0,0,0)).getTime() / 1000);
      } else if (period === "weekly") {
         const day = now.getDay(), diff = now.getDate() - day + (day === 0 ? -6 : 1);
         startOfDay = Math.floor(new Date(now.setDate(diff)).setHours(0,0,0,0) / 1000);
      } else if (period === "monthly") {
         startOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
      } else if (period === "yearly") {
         startOfDay = Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000);
      }

      // Fetch up to 250 recent leads from amoCRM natively strictly for the active period
      const response = await fetch(`https://${company.amocrm_domain}/api/v4/leads?limit=250&filter[created_at][from]=${startOfDay}&filter[created_at][to]=${endOfDay}`, {
        headers: { Authorization: `Bearer ${company.amocrm_access_token}` },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const leads: AmoCrmLead[] = data?._embedded?.leads || [];

        const totalLeads = leads.length;
        let qualifiedLeads = 0, visits = 0, salesAmount = 0;

        // Chart yasash uchun strukturalash
        const chartData: Record<string, { leads: number, sales: number }> = {};
        
        if (period === "daily") {
           for(let i=8; i<=22; i+=2) chartData[`${i < 10 ? '0'+i : i}:00`] = { leads: 0, sales: 0 };
        } else if (period === "weekly") {
           ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"].forEach(d => chartData[d] = { leads: 0, sales: 0 });
        } else if (period === "monthly") {
           for(let i=1; i<=Math.min(now.getDate(), 31); i++) chartData[`${i}-kun`] = { leads: 0, sales: 0 };
        } else if (period === "yearly") {
           MONTHS.forEach(d => chartData[d] = { leads: 0, sales: 0 });
        }

        // ⚡ Bolt: Reusable Date instance to eliminate Date allocations inside the lead iteration loop (O(N) -> O(1) allocation)
        const leadDate = new Date();

        leads.forEach(lead => {
          const status = lead.status_id;
          if (QUALIFIED_STATUS_IDS.has(status)) qualifiedLeads++;
          if (status === 82159486) visits++;
          
          let isSale = false;
          if (status === 142 || (lead.price && lead.price > 0)) {
            salesAmount += (lead.price || 0);
            isSale = true;
          }

          // ⚡ Bolt: Update time on single reused Date instance
          leadDate.setTime(lead.created_at * 1000);
          let key = "";
          if (period === "daily") {
            const hour = leadDate.getHours();
            const bucket = hour % 2 === 0 ? hour : hour - 1; 
            key = `${bucket < 10 ? '0'+bucket : bucket}:00`;
          } else if (period === "weekly") {
            key = WEEKDAYS[leadDate.getDay()];
          } else if (period === "monthly") {
            key = `${leadDate.getDate()}-kun`;
          } else if (period === "yearly") {
            key = MONTHS[leadDate.getMonth()];
          }
          
          if (chartData[key] !== undefined) {
             chartData[key].leads += 1;
             if (isSale) chartData[key].sales += 1;
          }
        });

        // Convert object to array for Recharts
        const chartArray: ChartItem[] = Object.keys(chartData).map(k => ({
           name: k,
           leads: chartData[k].leads,
           sales: chartData[k].sales
        }));

        stats = {
          total_leads: totalLeads,
          qualified_leads: qualifiedLeads,
          visits: visits,
          sales_amount: salesAmount,
          chart: chartArray,
          status: "connected"
        };
      } else {
        // Fallback to mock if token expired or invalid
        stats.status = "error_fetching";
      }
    } catch {
      stats.status = "error_fetching";
    }
  } else {
    // No mock data for disconnected companies
    stats = {
      total_leads: 0,
      qualified_leads: 0,
      visits: 0,
      sales_amount: 0,
      chart: [],
      status: "not_connected"
    };
  }

  return NextResponse.json(stats);
}
