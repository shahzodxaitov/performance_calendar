import { NextRequest, NextResponse } from "next/server";
import { getCompanies } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
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
    chart: [] as any[],
    status: "not_connected"
  };

  if (companyId === "all") {
     stats = { total_leads: 184, qualified_leads: 62, visits: 21, sales_amount: 45000000, chart: [], status: "mock" };
     return NextResponse.json(stats);
  }

  if (company && company.amocrm_domain && company.amocrm_access_token) {
    try {
      // Calculate timestamps based on period
      let startOfDay = 0;
      let endOfDay = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000);
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
        const leads: any[] = data?._embedded?.leads || [];

        let totalLeads = leads.length;
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
           ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"].forEach(d => chartData[d] = { leads: 0, sales: 0 });
        }

        leads.forEach(lead => {
          const status = lead.status_id;
          if ([82159474, 82159478, 82159486].includes(status)) qualifiedLeads++;
          if (status === 82159486) visits++;
          
          let isSale = false;
          if (status === 142 || lead.price > 0) {
            salesAmount += (lead.price || 0);
            isSale = true;
          }

          // Chart guruhlash
          const leadDate = new Date(lead.created_at * 1000);
          let key = "";
          if (period === "daily") {
            const hour = leadDate.getHours();
            const bucket = hour % 2 === 0 ? hour : hour - 1; 
            key = `${bucket < 10 ? '0'+bucket : bucket}:00`;
          } else if (period === "weekly") {
            const arr = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
            key = arr[leadDate.getDay()];
          } else if (period === "monthly") {
            key = `${leadDate.getDate()}-kun`;
          } else if (period === "yearly") {
            const arr = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
            key = arr[leadDate.getMonth()];
          }
          
          if (chartData[key] !== undefined) {
             chartData[key].leads += 1;
             if (isSale) chartData[key].sales += 1;
          }
        });

        // Convert object to array for Recharts
        const chartArray = Object.keys(chartData).map(k => ({
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
    } catch (e) {
      stats.status = "error_fetching";
    }
  } else {
    // Fake data for disconnected companies
    const base = (company?.name.length || 5) * 5;
    stats = {
      total_leads: base,
      qualified_leads: Math.floor(base * 0.4),
      visits: Math.floor(base * 0.1),
      sales_amount: base * 150000,
      chart: [],
      status: "mock"
    };
  }

  return NextResponse.json(stats);
}
