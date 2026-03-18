import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"];

const mockTasks: Record<number, { title: string, color: string }[]> = {
  4: [{ title: "Loretto Logo", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }],
  10: [{ title: "Safia SMM", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }],
  15: [{ title: "Dizayn post", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }],
  18: [
      { title: "Akay City Video", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
      { title: "Muxlis Target", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
  ],
  22: [{ title: "Ekskluziv Mebel", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" }],
  25: [{ title: "Loretto Brendbuk", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" }],
};

export default function CalendarPage() {
  const days = Array.from({ length: 35 }).map((_, i) => {
    const dayNum = i - 5; 
    const isCurrentMonth = dayNum > 0 && dayNum <= 31;
    const isToday = dayNum === 18; 

    return {
       dayNum: isCurrentMonth ? dayNum : null,
       isCurrentMonth,
       isToday,
       tasks: isCurrentMonth && mockTasks[dayNum] ? mockTasks[dayNum] : []
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Kalendar</h1>
          <p className="text-muted-foreground text-sm">Barcha ishlarning deadline'larini oylik formatda ko'rish.</p>
        </div>
        <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-xl border border-white/5 glass-panel">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10">
             <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold tracking-wide w-32 text-center text-white/90 uppercase">Mart 2026</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10">
             <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 glass-panel border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-lg shadow-black/20">
        <div className="grid grid-cols-7 border-b border-white/5 bg-black/40">
           {DAYS.map(day => (
              <div key={day} className="py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest border-r border-white/5 last:border-r-0">
                 {day}
              </div>
           ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-background/20">
           {days.map((dayObj, i) => (
             <div 
                key={i} 
                className={`border-b border-r border-white/5 p-2 transition-all hover:bg-white/[0.03] flex flex-col gap-1.5 group min-h-[100px]
                ${!dayObj.isCurrentMonth ? "bg-black/30" : ""}
                ${[6,13,20,27,34].includes(i) ? "border-r-0" : ""}
                ${[28,29,30,31,32,33,34].includes(i) ? "border-b-0" : ""}`}
             >
                {dayObj.isCurrentMonth && (
                   <div className="flex justify-between items-center mb-1">
                      <span className={`text-[13px] font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300
                        ${dayObj.isToday 
                            ? "bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.6)]" 
                            : "text-muted-foreground group-hover:text-white group-hover:bg-white/5"
                        }`}>
                        {dayObj.dayNum}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   </div>
                )}
                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto w-full no-scrollbar pr-1">
                   {dayObj.tasks.map((t, idx) => (
                      <div key={idx} className={`text-[11px] font-medium px-2 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity truncate w-full ${t.color}`}>
                         {t.title}
                      </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
