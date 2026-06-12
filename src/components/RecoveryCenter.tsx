import React, { useState } from "react";
import { 
  RefreshCw, ShieldAlert, Zap, Loader2, 
  CheckCircle2, AlertTriangle, KeyRound, 
  Copy, Hash, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RecoveryCenterProps {
  onNavigate: (view: string) => void;
}

export default function RecoveryCenter({ onNavigate }: RecoveryCenterProps) {
  const [activeTab, setActiveTab] = useState<"replacement" | "refill">("replacement");
  const [gcashRefNumber, setGcashRefNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const sanitizeRef = (val: string) => val.replace(/\D/g, "");

  const handleRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGcashRefNumber(sanitizeRef(e.target.value));
  };

  const resetForm = () => {
    setError(null);
    setSuccessData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);
    setIsLoading(true);

    const endpoint = activeTab === "replacement" ? "/api/orders/replace" : "/api/orders/refill";
    const body = activeTab === "replacement" 
      ? { gcashRefNumber } 
      : { gcashRefNumber, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      let result;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        // Fallback for non-JSON responses (HTML errors from infrastructure)
        const text = await response.text();
        if (!response.ok) {
          // If it's a 403/404/500 with HTML, show a clean message instead of the raw HTML
          if (response.status === 403) throw new Error("Access Denied: Your request was blocked by security filters. Please try again later.");
          if (response.status >= 500) throw new Error("Server maintenance in progress. Please try again in a few minutes.");
          
          // Strip HTML tags for other errors
          const cleanText = text.replace(/<[^>]*>?/gm, "").trim().slice(0, 100);
          throw new Error(cleanText || `Error ${response.status}: ${response.statusText}`);
        }
        result = text; // Should not happen for success usually
      }

      if (!response.ok) {
        throw new Error(result.error || result.message || "Request failed. Please check your credentials.");
      }

      setSuccessData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 mb-4">
          <RefreshCw className="w-8 h-8 text-[#FFD700]" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">
          Account <span className="text-[#FFD700]">Replacement</span> Center
        </h2>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-2">
          Automated account maintenance • Claims & Replacements
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-[#1A1A1A] mb-8">
        <button
          onClick={() => { setActiveTab("replacement"); resetForm(); }}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === "replacement" ? "text-[#FFD700]" : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          Modded Replacement
          {activeTab === "replacement" && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />
          )}
        </button>
        <button
          onClick={() => { setActiveTab("refill"); resetForm(); }}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === "refill" ? "text-[#FFD700]" : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          Grind Free Refill
          {activeTab === "refill" && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />
          )}
        </button>
      </div>

      {/* Instructions Accordion/Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h4 className="text-[10px] font-black uppercase text-white tracking-widest">How to Claim Replacement</h4>
          </div>
          <ul className="space-y-2 text-[10px] text-zinc-500 font-sans list-none p-0">
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold shrink-0">01.</span>
              <span>Find your 13-digit GCash Reference Number from your original modded account purchase.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold shrink-0">02.</span>
              <span>Select <strong>Modded Replacement</strong> tab and enter your Reference Number below.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold shrink-0">03.</span>
              <span>The system will verify your eligibility and generate a brand-new account immediately.</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <h4 className="text-[10px] font-black uppercase text-white tracking-widest">How to Request Refill</h4>
          </div>
          <ul className="space-y-2 text-[10px] text-zinc-500 font-sans list-none p-0">
            <li className="flex gap-2">
              <span className="text-amber-400 font-bold shrink-0">01.</span>
              <span>Locate your Tracking ID (GCash Ref) and have your account password ready.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 font-bold shrink-0">02.</span>
              <span>Select <strong>Grind Free Refill</strong> tab. Enter your ID and current password.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 font-bold shrink-0">03.</span>
              <span>Wait 60 seconds for the resource injection to complete. Restart your game to see balance.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg overflow-hidden shadow-2xl">
        <div className="p-8">
          <AnimatePresence mode="wait">
            {!successData ? (
              <motion.form
                key="recovery-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Visual Context Info */}
                <div className="flex items-start gap-4 p-4 bg-[#111] border border-zinc-900 rounded-sm">
                  {activeTab === "replacement" ? (
                    <ShieldAlert className="w-5 h-5 text-[#FF3333] shrink-0 mt-0.5" />
                  ) : (
                    <Zap className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-white tracking-wider">
                      {activeTab === "replacement" ? "Automated Replacement Protocol" : "Resource Refill Pipeline"}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-sans mt-1 leading-relaxed">
                      {activeTab === "replacement" 
                        ? "Eligibility: Only for 'Modded' Account Packages. This will generate a fresh account if yours was banned. Max 3 claims allowed."
                        : "Eligibility: Only for 'Grind' Accounts. This will top up your resources to the original package amount. 3-day cooldown applies."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* GCash Ref Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-[#FFD700]" />
                        13-Digit GCash Reference Number
                      </div>
                      {gcashRefNumber.length > 0 && gcashRefNumber.length < 13 && (
                        <span className="text-amber-500 animate-pulse">Waiting for 13 digits...</span>
                      )}
                      {gcashRefNumber.length === 13 && (
                        <span className="text-emerald-500">Ready</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter the reference number from your receipt"
                      value={gcashRefNumber}
                      onChange={handleRefChange}
                      maxLength={13}
                      className="w-full bg-black border border-zinc-800 p-3 rounded font-mono text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                  </div>

                  {/* Password Input (Refill Only) */}
                  {activeTab === "refill" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-3 h-3 text-[#FFD700]" />
                          Current Account Password
                        </div>
                        {!password && <span className="text-amber-500 animate-pulse">Required</span>}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Your current game credentials password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-zinc-800 p-3 rounded font-mono text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-[#FF3333]/10 border border-[#FF3333]/30 rounded flex items-center gap-2 text-[#FF3333] text-[11px] font-bold italic animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || gcashRefNumber.length !== 13 || (activeTab === "refill" && !password)}
                  className={`w-full py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                    isLoading 
                      ? "bg-zinc-800 text-zinc-500 cursor-wait" 
                      : "bg-[#FFD700] hover:bg-white text-black cursor-pointer shadow-lg hover:shadow-[#FFD700]/20"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      EXECUTING {activeTab.toUpperCase()} PROTOCOL...
                    </>
                  ) : (
                    <>
                      REQUEST {activeTab === "replacement" ? "FRESH ACCOUNT" : "INSTANT REFILL"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-display"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-white font-black uppercase text-xl italic tracking-tight">
                    {activeTab === "replacement" ? "Account Replaced!" : "Refill Successful!"}
                  </h3>
                  <p className="text-zinc-500 text-[11px] font-sans px-4">
                    {successData.message}
                  </p>
                </div>

                {activeTab === "replacement" && successData.credentials && (
                  <div className="mt-8 space-y-3">
                    <div className="p-4 bg-black border border-zinc-800 rounded-sm space-y-4">
                      <div className="text-left">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">New User Email</div>
                        <div className="flex items-center justify-between bg-[#111] p-2.5 rounded border border-zinc-900">
                          <span className="text-sm font-mono text-white">{successData.credentials.email}</span>
                          <button 
                            onClick={() => copyToClipboard(successData.credentials.email)}
                            className="p-1 px-2 text-[9px] bg-zinc-800 text-zinc-300 hover:text-white rounded uppercase font-bold flex items-center gap-1 transition-colors"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">New Secure Password</div>
                        <div className="flex items-center justify-between bg-[#111] p-2.5 rounded border border-zinc-900">
                          <span className="text-sm font-mono text-[#FFD700]">{successData.credentials.password}</span>
                          <button 
                            onClick={() => copyToClipboard(successData.credentials.password)}
                            className="p-1 px-2 text-[9px] bg-zinc-800 text-zinc-300 hover:text-white rounded uppercase font-bold flex items-center gap-1 transition-colors"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded text-[10px] text-emerald-400 font-medium italic">
                      💡 Please log in with these new credentials immediately. Your previous account is now inactive.
                    </div>
                  </div>
                )}

                {activeTab === "refill" && (
                   <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded text-[10px] text-emerald-400 font-medium space-y-2">
                     <p>Your account resources have been injected successfully.</p>
                     <p className="font-bold uppercase tracking-widest">PLEASE RESTART YOUR GAME TO VIEW CHANGES! 😊</p>
                   </div>
                )}

                <button
                  onClick={resetForm}
                  className="w-full py-3 bg-[#111] hover:bg-[#1a1a1a] text-white border border-zinc-800 font-black uppercase tracking-widest text-[10px] rounded-sm transition-all"
                >
                  RETURN TO REPLACEMENT CENTER
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer info in actions card */}
        <div className="px-8 py-4 bg-black/40 border-t border-[#1A1A1A] flex items-center justify-between text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
           <span>SYSTEM NODE: ONLINE</span>
           <span>SECURE TLS 1.3 TUNNEL ACTIVE</span>
        </div>
      </div>

      {/* Support section if stuck */}
      <div className="mt-12 text-center p-6 bg-[#080808] border border-[#1A1A1A] rounded-lg">
        <h4 className="text-[10px] font-black uppercase text-white tracking-widest mb-2">Still having issues?</h4>
        <p className="text-zinc-500 text-[10px] leading-relaxed max-w-md mx-auto mb-4">
          If your reference number is not being recognized or you have a special request, please contact our support resellers on Messenger for manual assistance.
        </p>
        <button 
          onClick={() => (window as any).open("https://m.me/lark.abalunan.1", "_blank")}
          className="px-6 py-2 bg-transparent border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-all scale-100 active:scale-95"
        >
          CONTACT HUMAN SUPPORT &rarr;
        </button>
      </div>
    </div>
  );
}
