import { Bell, Search } from "lucide-react";
import { Input } from "./ui/input";

export function Header() {
  return (
    <header className="h-20 flex items-center justify-between px-8 glass-panel border-b border-white/5 sticky top-0 z-10">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Qidiruv..." 
            className="w-full pl-11 h-11 bg-black/20 border-white/10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-black/40 rounded-full transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2.5 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md">
          <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border border-background shadow-[0_0_8px_rgba(124,58,237,0.8)] animate-pulse"></span>
        </button>
        <div className="flex items-center space-x-3 border-l border-white/10 pl-5 ml-1">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none text-white/90">Alisher</p>
            <p className="text-xs text-muted-foreground mt-1">Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
            <span className="text-white text-sm font-bold">A</span>
          </div>
        </div>
      </div>
    </header>
  );
}
