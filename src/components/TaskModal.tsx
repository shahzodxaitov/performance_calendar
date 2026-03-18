"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";

export function TaskModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] border-none">
          <Plus className="w-4 h-4" />
          Yangi ish qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass-panel border-white/10 text-white shadow-2xl overflow-hidden rounded-2xl p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="p-6 relative z-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight">Yangi ish yaratish</DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setOpen(false); }}>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground text-xs uppercase tracking-wider">Ish nomi</Label>
              <Input id="title" placeholder="Masalan: Safia uchun yangi post" className="bg-black/20 border-white/10 focus-visible:ring-primary rounded-xl h-11" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-muted-foreground text-xs uppercase tracking-wider">Turi</Label>
                <select id="type" className="flex h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-white/90">
                  <option value="SMM" className="bg-[#0f172a]">SMM</option>
                  <option value="Design" className="bg-[#0f172a]">Dizayn</option>
                  <option value="Video" className="bg-[#0f172a]">Video/Montaj</option>
                  <option value="Reklama" className="bg-[#0f172a]">Target/Reklama</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client" className="text-muted-foreground text-xs uppercase tracking-wider">Mijoz</Label>
                <Input id="client" placeholder="Mijoz nomi" className="bg-black/20 border-white/10 focus-visible:ring-primary rounded-xl h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-muted-foreground text-xs uppercase tracking-wider">Deadline</Label>
                <Input id="deadline" type="date" className="bg-black/20 border-white/10 focus-visible:ring-primary rounded-xl h-11 [color-scheme:dark]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee" className="text-muted-foreground text-xs uppercase tracking-wider">Bajaruvchi</Label>
                <select id="assignee" className="flex h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-white/90">
                  <option value="alisher" className="bg-[#0f172a]">Alisher</option>
                  <option value="bobur" className="bg-[#0f172a]">Bobur</option>
                  <option value="zarina" className="bg-[#0f172a]">Zarina</option>
                  <option value="sarvar" className="bg-[#0f172a]">Sarvar</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-5 space-x-3 mt-4 border-t border-white/5">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10 hover:bg-white/5 bg-transparent h-11">Bekor qilish</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/90 rounded-xl h-11 shadow-lg shadow-primary/20">O'zgarishlarni Saqlash</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
