// Jamoa a'zolari ma'lumotlari
// Keyinchalik Supabase profiles jadvalidan olinadi

export interface TeamMember {
  id: string;
  full_name: string;
  role: "admin" | "manager" | "editor";
  email?: string;
  telegram_chat_id?: string;
  avatar_color?: string;
}

// Demo jamoa a'zolari — haqiqiy chat_id larni qo'shing
export const teamMembers: TeamMember[] = [
  {
    id: "u1",
    full_name: "Nodir (Admin)",
    role: "admin",
    telegram_chat_id: "", // Bu yerga admin chat_id
    avatar_color: "#0071e3",
  },
  {
    id: "u2",
    full_name: "Aziz",
    role: "editor",
    telegram_chat_id: "", // Editor chat_id
    avatar_color: "#bf5af2",
  },
  {
    id: "u3",
    full_name: "Dilnoza",
    role: "editor",
    telegram_chat_id: "", // Editor chat_id
    avatar_color: "#30d158",
  },
  {
    id: "u4",
    full_name: "Sardor",
    role: "editor",
    telegram_chat_id: "", // Editor chat_id
    avatar_color: "#ff9f0a",
  },
  {
    id: "u5",
    full_name: "Madina",
    role: "manager",
    telegram_chat_id: "", // Manager chat_id
    avatar_color: "#ff375f",
  },
];

export function getMemberById(id: string): TeamMember | undefined {
  return teamMembers.find((m) => m.id === id);
}

export function getMemberInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
