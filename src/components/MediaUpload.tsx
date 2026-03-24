"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, FileImage, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaUploadProps {
  onUploadComplete: (urls: string[]) => void;
  existingUrls?: string[];
}

export function MediaUpload({ onUploadComplete, existingUrls = [] }: MediaUploadProps) {
  const [urls, setUrls] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newUrls = [...urls];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `tasks/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("smm-assets")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("smm-assets")
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setUrls(newUrls);
      onUploadComplete(newUrls);
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (urlToRemove: string) => {
    const newUrls = urls.filter(u => u !== urlToRemove);
    setUrls(newUrls);
    onUploadComplete(newUrls);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={i} className="relative w-24 h-24 rounded-xl border border-white/10 overflow-hidden group">
            <img src={url} alt="Media" className="w-full h-full object-cover" />
            <button
              onClick={() => removeMedia(url)}
              className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <label className={cn(
          "w-24 h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-muted-foreground hover:text-purple-400",
          uploading && "opacity-50 cursor-not-allowed"
        )}>
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent" />
          ) : (
            <>
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">Yuklash</span>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
        Rasm yoki videolarni vazifaga biriktirish (SMM uchun)
      </p>
    </div>
  );
}
