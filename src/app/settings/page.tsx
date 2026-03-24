import { TrendingUp, Settings, LogOut, MessageSquare } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Sozlamalar</h1>
        <p className="text-muted-foreground">Profil va tizim sozlamalarini boshqarish.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 border border-white/20 flex items-center justify-center font-bold text-white uppercase">
                A
             </div>
             <div>
                <h3 className="text-lg font-bold text-white">Alisher</h3>
                <p className="text-sm text-muted-foreground">Admin</p>
             </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
             <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
                <div className="text-sm text-white/90">alisher@bpg.uz</div>
             </div>
          </div>
        </div>

        <TelegramConnect />
      </div>

      {/* Other settings can go here */}
    </div>
  );
}

import { TelegramConnect } from "@/components/TelegramConnect";
