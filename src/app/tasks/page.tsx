import { TaskModal } from "@/components/TaskModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_TASKS = [
  { id: 1, title: "Safia SMM Postlar tayyorlash", type: "SMM", client: "Safia Bakery", assignee: "Alisher", deadline: "2026-03-20", status: "Jarayonda" },
  { id: 2, title: "Akay City Instagram Reels montaj", type: "Video", client: "Akay City", assignee: "Bobur", deadline: "2026-03-18", status: "Kechikkan" },
  { id: 3, title: "Loretto Logo redizayn va brandbook", type: "Design", client: "Loretto", assignee: "Sarvar", deadline: "2026-03-25", status: "Rejada" },
  { id: 4, title: "Muxlis Porshen uchun Target yozish", type: "Reklama", client: "Muxlis Porshen", assignee: "Zarina", deadline: "2026-03-19", status: "Bajarilgan" },
  { id: 5, title: "Ekskluziv mebel katalok dizayni", type: "Design", client: "Ekskluziv", assignee: "Sarvar", deadline: "2026-03-22", status: "Jarayonda" },
];

export default function TasksPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Ishlar Ro'yxati</h1>
          <p className="text-muted-foreground text-sm">Barcha ishlarni shu yerdan boshqaring va kuzatasiz.</p>
        </div>
        <TaskModal />
      </div>

      <div className="glass-panel border-white/5 rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-black/40 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[350px] text-muted-foreground font-medium h-12 uppercase tracking-wider text-[11px]">Ish nomi</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12 uppercase tracking-wider text-[11px]">Turi</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12 uppercase tracking-wider text-[11px]">Mijoz</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12 uppercase tracking-wider text-[11px]">Bajaruvchi</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12 uppercase tracking-wider text-[11px]">Deadline</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12 uppercase tracking-wider text-[11px]">Status</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium h-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TASKS.map((task) => (
                <TableRow key={task.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <TableCell className="font-medium text-white/90 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground border border-white/5 group-hover:scale-105 group-hover:border-primary/20 group-hover:text-primary transition-all">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="truncate">{task.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{task.type}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{task.client}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary/80 to-blue-500/80 flex items-center justify-center text-[10px] text-white font-bold border border-white/10 shadow-sm">
                        {task.assignee[0]}
                      </div>
                      <span className="text-white/80 text-sm">{task.assignee}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/80 text-sm whitespace-nowrap">{task.deadline}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                        task.status === "Bajarilgan" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        task.status === "Jarayonda" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        task.status === "Kechikkan" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {task.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
