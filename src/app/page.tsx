import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, CalendarIcon, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { title: "Bajarilgan", value: "12", desc: "Shu oy", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { title: "Jarayonda", value: "8", desc: "Hozirgi", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { title: "Kechikkan", value: "2", desc: "Tezkor", icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    { title: "Kelgusi", value: "5", desc: "Rejada", icon: CalendarIcon, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ];

  const recentTasks = [
    { title: "Safia SMM Postlar", status: "Jarayonda", assignee: "Alisher", date: "Bugun" },
    { title: "Akay City Video Montaj", status: "Kechikkan", assignee: "Bobur", date: "Kecha" },
    { title: "Loretto Logo Design", status: "Bajarilgan", assignee: "Sarvar", date: "2 kun oldin" },
    { title: "Muxlis Porshen Target", status: "Kelgusi", assignee: "Zarina", date: "Ertaga" },
  ];

  return (
    <div className="space-y-8 animate-in mt-2 fade-in slide-in-from-bottom-6 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Xush kelibsiz 👋</h1>
        <p className="text-muted-foreground">BPG Marketing Agentligining ishlar boshqaruvi platformasi.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass-panel border-white/5 overflow-hidden group hover:border-white/10 transition-colors duration-300 relative shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl border ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color} group-hover:scale-110 transition-transform`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground font-medium">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel border-white/5 col-span-1 shadow-none overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-lg">So'nggi Ishlar</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              {recentTasks.map((task, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 hover:bg-black/40 transition-colors border border-white/[0.05]">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-white/95 text-sm">{task.title}</span>
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{task.assignee}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{task.date}</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      task.status === "Bajarilgan" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      task.status === "Jarayonda" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                      task.status === "Kechikkan" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1 border border-white/5 rounded-2xl glass-panel flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-primary/10 via-transparent to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />
             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center mb-6 border border-primary/20 shadow-lg shadow-primary/20 backdrop-blur-md relative z-10 group">
                 <CheckCircle2 className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-500" />
             </div>
             <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-3 relative z-10">Ajoyib ko'rsatkich!</h3>
             <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed relative z-10">Bugun belgilangan barcha ishlarni namunali ravishda vaqtida yopdingiz. Bir finjon qahva bilan hordiq chiqaring ☕</p>
        </div>
      </div>
    </div>
  );
}
