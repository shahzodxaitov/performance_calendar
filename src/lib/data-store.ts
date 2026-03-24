import fs from "fs";
import path from "path";

export interface TeamMember {
  id: string;
  full_name: string;
  role: "admin" | "manager" | "editor";
  chat_id: string | null;
  avatar_color: string;
}

export type ReportType = "daily" | "weekly" | "monthly" | "custom";

export interface ReportData {
  id: string;
  type: ReportType;
  title: string;
  subtitle: string;
  company_id: string;
  company_name: string;
  share_token: string;
  created_at: string;
  data: {
    leads: number;
    leads_ch: string;
    sales: string;
    sales_ch: string;
    done: number;
    total: number;
    source: string;
    conversion?: string;
    conversion_ch?: string;
  };
}

export interface LocalTask {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  company_name: string;
  assignee_id: string;
  assignee_name: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  due_date: string;
  due_time?: string;
  created_at: string;
  notified_create: boolean;
  notified_1day: boolean;
  notified_1hour: boolean;
}

export interface Company {
  id: string;
  name: string;
  token: string;
  fb_ad_account_id?: string;
  fb_access_token?: string;
  amocrm_domain?: string;
  amocrm_access_token?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: "Yangi" | "Aloqada" | "Sotib oldi" | "Rad etdi";
  company_id: string;
  created_at: string;
}

export interface AppData {
  team: TeamMember[];
  tasks: LocalTask[];
  companies: Company[];
  leads: Lead[];
  reports: ReportData[];
}

function getDbPath() {
  return path.join(process.cwd(), "data", "db.json");
}

export function readDb(): AppData {
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      return { team: [], tasks: [], companies: [], leads: [], reports: [] };
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.companies) {
      parsed.companies = [
        { id: "c1", name: "Mondelux", token: "mondelux" },
        { id: "c2", name: "Chinar Group", token: "chinar" },
        { id: "c3", name: "Sunnat Umra", token: "sunnat" },
      ];
    }
    if (!parsed.leads) {
      parsed.leads = [];
    }
    if (!parsed.reports) {
      parsed.reports = [];
    }
    return parsed;
  } catch (err) {
    console.error("DB o'qishda xatolik:", err);
    return { team: [], tasks: [], companies: [], leads: [], reports: [] };
  }
}

export function writeDb(data: AppData) {
  try {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("DB yozishda xatolik:", err);
  }
}

export function getTeamMembers() { return readDb().team; }
export function saveTeamMembers(team: TeamMember[]) { const db = readDb(); db.team = team; writeDb(db); }

export function getReports() { return readDb().reports || []; }
export function saveReports(reports: ReportData[]) { const db = readDb(); db.reports = reports; writeDb(db); }

export function getTasks() { return readDb().tasks; }
export function saveTasks(tasks: LocalTask[]) { const db = readDb(); db.tasks = tasks; writeDb(db); }

export function getCompanies() { return readDb().companies; }
export function saveCompanies(companies: Company[]) { const db = readDb(); db.companies = companies; writeDb(db); }

export function getLeads() { return readDb().leads; }
export function saveLeads(leads: Lead[]) { const db = readDb(); db.leads = leads; writeDb(db); }
