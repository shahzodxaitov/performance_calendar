// Local task store with Telegram notification support
// Keyinchalik Supabase bilan almashtiriladi

import { teamMembers, type TeamMember } from "./team";

export interface LocalTask {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  company_name: string;
  assignee_id: string;
  assignee_name: string;
  creator_id?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  due_date: string; // ISO date string: "2026-03-25"
  due_time?: string; // "15:00"
  media_urls?: string[];
  created_at: string;
  notified_create?: boolean;
  notified_1day?: boolean;
  notified_1hour?: boolean;
}

// In-memory task store (production da DB bo'ladi)
let tasks: LocalTask[] = [
  {
    id: "t1", title: "Reklama Video Montaj", description: "Instagram uchun 30s reklama video", company_id: "c1", company_name: "Mondelux",
    assignee_id: "u2", assignee_name: "Aziz", status: "in_progress", priority: "high",
    due_date: "2026-03-24", due_time: "15:00", created_at: "2026-03-22T10:00:00",
    notified_create: true, notified_1day: false, notified_1hour: false,
  },
  {
    id: "t2", title: "SMM Kontent Plan", description: "Aprel oyi uchun kontent plan", company_id: "c1", company_name: "Mondelux",
    assignee_id: "u3", assignee_name: "Dilnoza", status: "todo", priority: "normal",
    due_date: "2026-03-25", due_time: "18:00", created_at: "2026-03-22T14:00:00",
    notified_create: true, notified_1day: false, notified_1hour: false,
  },
  {
    id: "t3", title: "Brending Dizayn", description: "Yangi logo va brand book", company_id: "c2", company_name: "Chinar Group",
    assignee_id: "u4", assignee_name: "Sardor", status: "in_progress", priority: "high",
    due_date: "2026-03-24", due_time: "17:00", created_at: "2026-03-21T09:00:00",
    notified_create: true, notified_1day: false, notified_1hour: false,
  },
  {
    id: "t4", title: "Target Reklama Sozlash", description: "Facebook va Instagram target", company_id: "c2", company_name: "Chinar Group",
    assignee_id: "u2", assignee_name: "Aziz", status: "todo", priority: "normal",
    due_date: "2026-03-26", created_at: "2026-03-23T10:00:00",
    notified_create: true, notified_1day: false, notified_1hour: false,
  },
  {
    id: "t5", title: "Umra Paket Video", description: "Yangi umra paketlari uchun promo video", company_id: "c3", company_name: "Sunnat Umra",
    assignee_id: "u3", assignee_name: "Dilnoza", status: "review", priority: "high",
    due_date: "2026-03-24", due_time: "12:00", created_at: "2026-03-20T08:00:00",
    notified_create: true, notified_1day: false, notified_1hour: false,
  },
  {
    id: "t6", title: "Instagram Reels", description: "5 ta reels post tayyorlash", company_id: "c3", company_name: "Sunnat Umra",
    assignee_id: "u4", assignee_name: "Sardor", status: "todo", priority: "normal",
    due_date: "2026-03-27", created_at: "2026-03-23T11:00:00",
    notified_create: true, notified_1day: false, notified_1hour: false,
  },
];

export function getAllTasks(): LocalTask[] {
  return [...tasks];
}

export function getTasksByCompany(companyId: string): LocalTask[] {
  if (companyId === "all") return [...tasks];
  return tasks.filter((t) => t.company_id === companyId);
}

export function getTasksByAssignee(assigneeId: string): LocalTask[] {
  return tasks.filter((t) => t.assignee_id === assigneeId);
}

export function addTask(task: Omit<LocalTask, "id" | "created_at">): LocalTask {
  const newTask: LocalTask = {
    ...task,
    id: `t${Date.now()}`,
    created_at: new Date().toISOString(),
    notified_create: false,
    notified_1day: false,
    notified_1hour: false,
  };
  tasks = [newTask, ...tasks];
  return newTask;
}

export function updateTask(id: string, updates: Partial<LocalTask>): LocalTask | null {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  return tasks[idx];
}

export function markNotified(id: string, field: "notified_create" | "notified_1day" | "notified_1hour") {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) tasks[idx][field] = true;
}
