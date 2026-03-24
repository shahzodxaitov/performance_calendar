"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export function TelegramConnect() {
  const { user, role } = useAuth();
  const [chatId, setChatId] = useState("");
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    if (!user || !chatId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ telegram_chat_id: chatId })
      .eq("id", user.id);

    if (!error) {
      setSuccess(true);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20">
          <Send className="w-5 h-5 text-[#0088cc]" />
        </div>
        <h3 className="text-lg font-bold text-white">Telegram Botga Ulanish</h3>
      </div>
      
      <p className="text-sm text-muted-foreground leading-relaxed">
        Botdan xabarlarni olish uchun Telegram'da botga <b>/start</b> buyrug'ini yuboring va bot sizga bergan <b>Chat ID</b> raqamini pastga kiriting.
      </p>

      {success ? (
        <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20">
          <CheckCircle2 className="w-5 h-5" />
          Muvaffaqiyatli ulandi!
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Chat ID (masalan: 1234567)"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            className="flex-1 h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#0088cc] transition-all"
          />
          <button
            onClick={handleConnect}
            className="h-11 px-6 rounded-xl bg-[#0088cc] hover:bg-[#0088cc]/80 text-white font-bold transition-all shadow-lg shadow-[#0088cc]/20"
          >
            Ulash
          </button>
        </div>
      )}
    </div>
  );
}
