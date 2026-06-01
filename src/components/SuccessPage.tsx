import React, { useState, useEffect } from "react";
import { CheckCircle2, Copy, Sparkles, LogIn, ChevronRight, Loader2, KeyRound, Mail } from "lucide-react";
import { motion } from "motion/react";

interface SuccessPageProps {
  onNavigate: (view: string) => void;
}

export default function SuccessPage({ onNavigate }: SuccessPageProps) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Parsing checkout session ID from URL queries
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setError("No transaction receipt identifier was detected in the redirection query.");
      setLoading(false);
      return;
    }

    async function verifyInvoice() {
      try {
        const resp = await fetch("/api/payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        const data = await resp.json();
        
        if (resp.ok && data.success && data.verified) {
          setInvoice(data.invoice);
        } else {
          setError(data.message || "The payment transaction is still processing or was not recognized. Please verify with Support.");
        }
      } catch (err: any) {
        setError("Network verification timed out. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    verifyInvoice();
  }, []);

  const handleCopyCredentials = () => {
    if (!invoice || !invoice.credentials) return;
    navigator.clipboard.writeText(invoice.credentials);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16" id="success-view">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <p className="font-mono text-[10px] text-gray-500 tracking-widest text-center uppercase">
            VERIFYING TRANSACTION SECURE CODES...
          </p>
        </div>
      ) : error ? (
        <div className="rounded bg-[#0A0A0A] border border-[#1A1A1A] p-8 text-center space-y-6">
          <div className="h-12 w-12 bg-red-500/5 text-red-500 border border-red-500/15 rounded-full flex items-center justify-center mx-auto text-xl">
            ⚠
          </div>
          <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">Invoice Pending Verification</h1>
          <p className="text-gray-400 text-xs font-mono leading-relaxed bg-black p-4 border border-[#222]">
            {error}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => onNavigate("home")}
              className="w-1/2 cursor-pointer py-2.5 bg-[#111] hover:bg-[#222] border border-[#222] text-gray-400 font-bold text-xs uppercase tracking-wider"
            >
              Back Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-1/2 cursor-pointer py-2.5 bg-[#FFD700] hover:bg-white text-black font-black text-xs uppercase tracking-wider"
            >
              Reverify Invoice
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded bg-[#0A0A0A] border border-[#1A1A1A] p-8 md:p-10 relative overflow-hidden"
        >
          {/* Decorative Sparkles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/5 blur-3xl rounded-full" />
          <div className="absolute top-8 right-8 text-[#FFD700]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          <div className="text-center mb-8">
            <span className="inline-flex p-4 bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 rounded-sm mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase">
              PAYMENT APPROVED!
            </h1>
            <p className="text-gray-500 text-[9px] font-mono uppercase mt-1 tracking-wider text-[#FFD700] font-bold">
              Automatic resource delivery triggered
            </p>
          </div>

          {/* Invoice Summary Card */}
          <div className="bg-black border border-[#222] rounded p-5 mb-8 space-y-3.5 font-sans">
            <div className="flex justify-between text-xs text-gray-400">
              <span className="uppercase tracking-wider text-[9px] font-bold text-gray-500">Customer Email:</span>
              <strong className="text-white">{invoice.customerEmail}</strong>
            </div>

            <div className="flex justify-between text-xs text-gray-400 border-t border-[#1A1A1A] pt-3">
              <span className="uppercase tracking-wider text-[9px] font-bold text-gray-500">Item Description:</span>
              <strong className="text-gray-300 text-right max-w-[200px] truncate">{invoice.title}</strong>
            </div>

            <div className="flex justify-between text-xs text-[#FFD700] border-t border-[#1A1A1A] pt-3 font-semibold">
              <span className="uppercase tracking-wider text-[9px] font-bold text-gray-500">Charged Total:</span>
              <strong className="text-base text-white font-mono">${invoice.price}</strong>
            </div>
          </div>

          {/* Core Access Box (Conditional for Account delivery) */}
          {invoice.productType === "account" && invoice.credentials ? (
            <div className="space-y-3 mb-8">
              <div className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#FFD700]" />
                Your Instant Login Credentials
              </div>

              <div className="relative rounded bg-black border border-[#222] p-5 overflow-hidden">
                <pre className="text-[#FFD700] hover:text-white transition-colors duration-100 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre">
                  {invoice.credentials}
                </pre>

                <button
                  onClick={handleCopyCredentials}
                  className="absolute right-4 bottom-4 p-2 bg-[#111] hover:bg-[#222] border border-[#222] text-gray-400 hover:text-emerald-400 rounded transition-all flex items-center gap-1 text-[9px] font-mono cursor-pointer uppercase tracking-wider"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "COPIED" : "COPY CODE"}
                </button>
              </div>

              {copied && (
                <p className="text-center text-emerald-400 text-xs font-mono">
                  ✓ Credentials copied! Safe racing.
                </p>
              )}
            </div>
          ) : (
            /* Modification patch acknowledgment notice */
            <div className="bg-indigo-950/5 border border-indigo-500/15 p-5 rounded space-y-2 mb-8">
              <h3 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                🛡 BOT PIPELINE STATUS: paid & queued
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed font-sans">
                {invoice.message}
              </p>
            </div>
          )}

          {/* Action Navigation triggers */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate("home")}
              className="sm:w-1/2 cursor-pointer py-2.5 bg-[#111] hover:bg-[#222] border border-[#222] text-gray-400 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Back to Home page
            </button>

            <button
              onClick={() => onNavigate("accounts")}
              className="sm:w-1/2 cursor-pointer py-2.5 bg-[#FFD700] hover:bg-white text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1"
            >
              Continue shopping
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
