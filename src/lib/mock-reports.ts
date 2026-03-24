export type ReportType = "daily" | "weekly" | "monthly";

export interface ReportData {
  id: string; type: ReportType; title: string; subtitle: string;
  company_id: string; company_name: string; share_token: string;
  data: { leads: number; leads_ch: string; sales: string; sales_ch: string; done: number; total: number; source: string; conversion?: string; conversion_ch?: string };
}

export const allReports: ReportData[] = [
  // Mondelux
  { id: "m-d", type: "daily", title: "Kunlik Hisobot", subtitle: "23 Mart, 2026", company_id: "c1", company_name: "Mondelux", share_token: "mondelux-daily-23",
    data: { leads: 12, leads_ch: "+16%", sales: "3.5M", sales_ch: "+22%", done: 2, total: 3, source: "Instagram", conversion: "15%", conversion_ch: "+2%" } },
  { id: "m-w", type: "weekly", title: "Haftalik Hisobot", subtitle: "17–23 Mart, 2026", company_id: "c1", company_name: "Mondelux", share_token: "mondelux-weekly-17",
    data: { leads: 58, leads_ch: "+16%", sales: "28M", sales_ch: "+22%", done: 12, total: 15, source: "Instagram", conversion: "18.5%", conversion_ch: "+3%" } },
  { id: "m-m", type: "monthly", title: "Oylik Hisobot", subtitle: "Mart 2026", company_id: "c1", company_name: "Mondelux", share_token: "mondelux-monthly-mar",
    data: { leads: 210, leads_ch: "+25%", sales: "95M", sales_ch: "+20%", done: 42, total: 50, source: "Instagram", conversion: "21%", conversion_ch: "+5%" } },
  // Chinar Group
  { id: "ch-d", type: "daily", title: "Kunlik Hisobot", subtitle: "23 Mart, 2026", company_id: "c2", company_name: "Chinar Group", share_token: "chinar-daily-23",
    data: { leads: 9, leads_ch: "+12%", sales: "2.8M", sales_ch: "+18%", done: 3, total: 4, source: "Telegram", conversion: "12%", conversion_ch: "0%" } },
  { id: "ch-w", type: "weekly", title: "Haftalik Hisobot", subtitle: "17–23 Mart, 2026", company_id: "c2", company_name: "Chinar Group", share_token: "chinar-weekly-17",
    data: { leads: 52, leads_ch: "+12%", sales: "20M", sales_ch: "+18%", done: 10, total: 14, source: "Telegram", conversion: "14%", conversion_ch: "+1%" } },
  // Sunnat Umra
  { id: "su-d", type: "daily", title: "Kunlik Hisobot", subtitle: "23 Mart, 2026", company_id: "c3", company_name: "Sunnat Umra", share_token: "sunnat-daily-23",
    data: { leads: 7, leads_ch: "+10%", sales: "1.8M", sales_ch: "+15%", done: 2, total: 2, source: "Instagram", conversion: "10%", conversion_ch: "-1%" } },
  { id: "su-w", type: "weekly", title: "Haftalik Hisobot", subtitle: "17–23 Mart, 2026", company_id: "c3", company_name: "Sunnat Umra", share_token: "sunnat-weekly-17",
    data: { leads: 46, leads_ch: "+10%", sales: "14M", sales_ch: "+15%", done: 8, total: 10, source: "Instagram", conversion: "12.5%", conversion_ch: "+2%" } },
  { id: "su-m", type: "monthly", title: "Oylik Hisobot", subtitle: "Mart 2026", company_id: "c3", company_name: "Sunnat Umra", share_token: "sunnat-monthly-mar",
    data: { leads: 165, leads_ch: "+18%", sales: "52M", sales_ch: "+14%", done: 30, total: 38, source: "Instagram", conversion: "15%", conversion_ch: "+4%" } },
];
