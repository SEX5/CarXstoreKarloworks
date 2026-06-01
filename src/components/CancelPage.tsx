import React from "react";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { motion } from "motion/react";

interface CancelPageProps {
  onNavigate: (view: string) => void;
}

export default function CancelPage({ onNavigate }: CancelPageProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-20" id="cancel-view">
      <div className="rounded bg-[#0A0A0A] border border-[#1A1A1A] p-8 text-center space-y-6">
        <div className="h-12 w-12 bg-amber-500/5 text-[#FFD700] border border-amber-500/15 rounded-full flex items-center justify-center mx-auto text-xl">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div>
          <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">Checkout Aborted</h1>
          <p className="text-gray-500 text-[10px] font-mono uppercase mt-1 tracking-widest text-[#FF3333] font-bold">Transaction voided</p>
        </div>

        <p className="text-gray-400 text-xs leading-relaxed font-sans max-w-sm mx-auto">
          No worries. The items remain in our catalog. You can review account specifications, change resource metrics, or complete checkout at any time.
        </p>

        <div className="flex gap-4 pt-2">
          <button
            onClick={() => onNavigate("home")}
            className="w-1/2 cursor-pointer py-2.5 bg-[#111] hover:bg-[#222] border border-[#222] text-gray-400 font-bold text-xs uppercase tracking-wider transition-all"
          >
            Back Home
          </button>

          <button
            onClick={() => onNavigate("accounts")}
            className="w-1/2 cursor-pointer py-2.5 bg-[#FFD700] hover:bg-white text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Check Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
