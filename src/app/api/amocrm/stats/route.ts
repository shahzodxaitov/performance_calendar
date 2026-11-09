import { NextRequest, NextResponse } from "next/server";
import { getCompanies } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// ⚡ Bolt: Hoist static lookup arrays and sets outside the request handler to avoid re-allocations on every request
const QUALIFIED_STATUS_IDS = new Set([82159474, 82159478, 82159486]);
const WEEKDAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"] as const;
const WEEKDAYS_BY_DAY_INDEX = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"] as const;
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"] as const;

interface AmoLead {
  id?: number;
  status_id: number;
  price?: number;
  created_at: number;
}

interface AmoChartItem {
  name: string;
  leads: number;
  sales: number;
}

export async function GET(request: NextRequest) {
  // ⚡ Bolt: Use request.nextUrl.searchParams directly to avoid URL constructor parsing overhead
  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get("company_id");
  const period = searchParams.get("period") || "daily";

  if (!companyId) {
    return NextResponse.json({ error: "company_id is required" }, { status: 400 });
  }

  const companies = getCompanies();
  const company = companies.find(c => c.id === companyId);

  // Default o'rtacha mock qiymatlar
  let stats: {
    total_leads: number;
    qualified_leads: number;
    visits: number;
    sales_amount: number;
    chart: AmoChartItem[];
    status: string;
  } = {
    total_leads: 0,
    qualified_leads: 0,
    visits: 0,
    sales_amount: 0,
    chart: [],
    status: "not_connected"
  };

  if (companyId === "all") {
     stats = { total_leads: 0, qualified_leads: 0, visits: 0, sales_amount: 0, chart: [], status: "mock" };
     return NextResponse.json(stats);
  }

  if (company && company.amocrm_domain && company.amocrm_access_token) {
    try {
      // ⚡ Bolt: Reuse a single Date instance to calculate period timestamps without redundant heap allocations
      const dateCalc = new Date();
      dateCalc.setHours(23, 59, 59, 999);
      const endOfDay = Math.floor(dateCalc.getTime() / 1000);

      let startOfDay = 0;
      if (period === "daily") {
         dateCalc.setHours(0, 0, 0, 0);
         startOfDay = Math.floor(dateCalc.getTime() / 1000);
      } else if (period === "weekly") {
         const day = dateCalc.getDay();
         const diff = dateCalc.getDate() - day + (day === 0 ? -6 : 1);
         dateCalc.setDate(diff);
         dateCalc.setHours(0, 0, 0, 0);
         startOfDay = Math.floor(dateCalc.getTime() / 1000);
      } else if (period === "monthly") {
         dateCalc.setDate(1);
         dateCalc.setHours(0, 0, 0, 0);
         startOfDay = Math.floor(dateCalc.getTime() / 1000);
      } else if (period === "yearly") {
         dateCalc.setMonth(0, 1);
         dateCalc.setHours(0, 0, 0, 0);
         startOfDay = Math.floor(dateCalc.getTime() / 1000);
      }

      // Fetch up to 250 recent leads from amoCRM natively strictly for the active period
      const response = await fetch(`https://${company.amocrm_domain}/api/v4/leads?limit=250&filter[created_at][from]=${startOfDay}&filter[created_at][to]=${endOfDay}`, {
        headers: { Authorization: `Bearer ${company.amocrm_access_token}` },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const leads: AmoLead[] = data?._embedded?.leads || [];

        const totalLeads = leads.length;
        let qualifiedLeads = 0;
        let visits = 0;
        let salesAmount = 0;

        // Chart yasash uchun strukturalash
        const chartData: Record<string, { leads: number; sales: number }> = {};
        
        if (period === "daily") {
           for (let i = 8; i <= 22; i += 2) {
             chartData[`${i < 10 ? '0' + i : i}:00`] = { leads: 0, sales: 0 };
           }
        } else if (period === "weekly") {
           WEEKDAYS.forEach(d => {
             chartData[d] = { leads: 0, sales: 0 };
           });
        } else if (period === "monthly") {
           const currentDay = new Date().getDate();
           for (let i = 1; i <= Math.min(currentDay, 31); i++) {
             chartData[`${i}-kun`] = { leads: 0, sales: 0 };
           }
        } else if (period === "yearly") {
           MONTHS.forEach(d => {
             chartData[d] = { leads: 0, sales: 0 };
           });
        }

        // ⚡ Bolt: Reuse a single Date object across all leads to eliminate up to 250 Date heap allocations per request
        const leadDate = new Date();

        for (let i = 0; i < leads.length; i++) {
          const lead = leads[i];
          const status = lead.status_id;
          if (QUALIFIED_STATUS_IDS.has(status)) qualifiedLeads++;
          if (status === 82159486) visits++;
          
          let isSale = false;
          if (status === 142 || (lead.price !== undefined && lead.price > 0)) {
            salesAmount += (lead.price || 0);
            isSale = true;
          }

          // Chart guruhlash
          leadDate.setTime(lead.created_at * 1000);
          let key = "";
          if (period === "daily") {
            const hour = leadDate.getHours();
            const bucket = hour % 2 === 0 ? hour : hour - 1; 
            key = `${bucket < 10 ? '0' + bucket : bucket}:00`;
          } else if (period === "weekly") {
            key = WEEKDAYS_BY_DAY_INDEX[leadDate.getDay()];
          } else if (period === "monthly") {
            key = `${leadDate.getDate()}-kun`;
          } else if (period === "yearly") {
            key = MONTHS[leadDate.getMonth()];
          }
          
          const entry = chartData[key];
          if (entry !== undefined) {
             entry.leads += 1;
             if (isSale) entry.sales += 1;
          }
        }

        // Convert object to array for Recharts
        const chartArray: AmoChartItem[] = Object.keys(chartData).map(k => ({
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
