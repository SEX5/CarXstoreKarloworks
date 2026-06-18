import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  UploadCloud, 
  DownloadCloud, 
  Search, 
  History, 
  ShieldCheck, 
  Loader2, 
  ChevronRight,
  Database,
  Lock,
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PaymentWizard from "./PaymentWizard";

interface CloudVaultProps {
  onNavigate: (view: string, arg?: any) => void;
}

export default function CloudVault({ onNavigate }: CloudVaultProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isAutoEnabled] = useState(true);
  const [isProcessingAuto, setIsProcessingAuto] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [restorePrice, setRestorePrice] = useState(50);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    fetch("/api/patch-pricing")
      .then(r => r.json())
      .then(data => {
        const restore = data.find((p: any) => p.patch_type === "restore");
        if (restore) setRestorePrice(restore.price);
      })
      .catch(err => console.error("Failed to load restoration price:", err));
  }, []);

  useEffect(() => {
    if (email && email.includes("@")) {
      checkAutoBackupStatus(email);
    }
  }, [email]);

  const checkAutoBackupStatus = async (targetEmail: string) => {
    try {
      const resp = await fetch("/api/garage/autobackup/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await resp.json();
      if (resp.ok) {
        // Status is forced active in UI
      }
    } catch (err) {
      console.error("Auto-backup status check failed:", err);
    }
  };

  const handleToggleAutoBackup = async () => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Please enter account email and password to configure auto-backup." });
      return;
    }

    try {
      setIsProcessingAuto(true);
      const resp = await fetch("/api/garage/autobackup/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, enabled: !isAutoEnabled })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to update settings");
      
      setMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsProcessingAuto(false);
    }
  };

  // Restoration State Logic
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [targetPassword, setTargetPassword] = useState("");
  const [verifyingRestoreCredentials, setVerifyingRestoreCredentials] = useState(false);
  const [selectedBackupPath, setSelectedBackupPath] = useState("");
  const [restorationStep, setRestorationStep] = useState<"list" | "credentials">("list");

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsBackingUp(true);
      setMessage(null);
      
      const resp = await fetch("/api/garage/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Cloud sync failed");

      setMessage({ type: "success", text: "Profile snapshot successfully securely stored in Virtual Cloud Disk." });
      setSearchEmail(email);
      refreshBackups(email);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsBackingUp(false);
    }
  };

  const refreshBackups = async (targetEmail: string) => {
    if (!targetEmail) return;
    try {
      setIsLoadingBackups(true);
      const resp = await fetch("/api/garage/backups/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await resp.json();
      if (resp.ok) setBackups(data.backups || []);
    } catch (err) {
      console.error("Backups fetch failed:", err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleStartRestore = (backupPath: string) => {
    setSelectedBackupPath(backupPath);
    setRestorationStep("credentials");
  };

  const handleOpenPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !targetPassword) return;

    try {
      setVerifyingRestoreCredentials(true);
      setMessage(null);
      
      const verifyResp = await fetch("/api/verify-carx-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword })
      });
      
      const verifyData = await verifyResp.json();
      if (!verifyResp.ok) {
        throw new Error(verifyData.error || "Login Verification Failed");
      }

      // Success! Proceed to payment
      setIsPayModalOpen(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      // Scroll to error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setVerifyingRestoreCredentials(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 animate-fade-in" id="cloud-vault-view">
      <div className="text-center md:text-left mb-12">
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-[#FFD700]/10 rounded border border-[#FFD700]/20">
             <Cloud className="w-6 h-6 text-[#FFD700]" />
           </div>
           <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
             BACKUP & <span className="text-[#FFD700]">RESTORE</span>
           </h1>
        </div>
        <p className="text-zinc-500 font-sans max-w-2xl text-xs md:text-sm leading-relaxed">
          The Virtual Cloud Disk (VCD) allows you to bridge your progression across accounts or store secure snapshots of your profile resources. Backups are FREE. Restore requires a premium service key.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Free Backup Tool */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <UploadCloud className="w-24 h-24 text-white" />
            </div>

            <h2 className="text-xs font-bold uppercase tracking-widest text-[#FFD700] mb-6 border-b border-zinc-900 pb-3 flex items-center gap-2">
              <Lock className="w-3 h-3" />
              CREATE FREE CLOUD SNAPSHOT
            </h2>

            <form onSubmit={handleCreateBackup} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">CARX ACCOUNT EMAIL</label>
                <input
                  type="email"
                  required
                  placeholder="name@provider.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2.5 text-sm outline-none focus:border-[#FFD700] text-white font-mono rounded"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">ACCOUNT PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2.5 text-sm outline-none focus:border-[#FFD700] text-white font-mono rounded"
                />
              </div>

              <button
                type="submit"
                disabled={isBackingUp || !email || !password}
                className={`w-full py-3 font-black uppercase tracking-wider font-mono text-[10px] transition-all flex items-center justify-center gap-2 rounded ${
                  !isBackingUp ? "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20" : "bg-zinc-900 text-zinc-600 border-zinc-800"
                }`}
              >
                {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                SYNC IDENTITY TO CLOUD
              </button>

              <div className={`flex flex-col gap-3 p-5 rounded border transition-all duration-500 relative overflow-hidden ${
                isAutoEnabled 
                ? "bg-emerald-500/10 border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.1)] ring-1 ring-[#FFD700]/30" 
                : "bg-black border-zinc-900 shadow-none"
              }`}>
                {isAutoEnabled && (
                  <div className="absolute top-0 right-0 p-1">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-3 bg-emerald-500/20 animate-pulse" />
                      <div className="w-1 h-3 bg-emerald-500/40 animate-pulse delay-75" />
                      <div className="w-1 h-3 bg-emerald-500/60 animate-pulse delay-150" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className={`w-3 h-3 ${isAutoEnabled ? "text-emerald-400" : "text-zinc-600"}`} />
                       <span className={`text-[10px] font-mono font-black uppercase tracking-wider ${isAutoEnabled ? "text-emerald-400" : "text-zinc-200"}`}>
                         Automation Node
                       </span>
                    </div>
                    <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold tracking-tight">Adaptive 24h Snapshot Protocol</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black italic text-[#FFD700] uppercase tracking-widest bg-[#FFD700]/10 px-2 py-1 rounded border border-[#FFD700]/30 animate-pulse">
                      PERMANENTLY ACTIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900/50">
                   <div className={`flex flex-col gap-1 p-2 rounded border font-mono transition-all ${isAutoEnabled ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black border-zinc-900/80"}`}>
                      <span className="text-[7px] text-zinc-500 uppercase font-bold tracking-tighter">RETENTION NODE</span>
                      <span className={`text-[9px] font-black italic ${isAutoEnabled ? "text-emerald-400" : "text-zinc-700"}`}>7 SNAPSHOTS</span>
                   </div>
                   <div className={`flex flex-col gap-1 p-2 rounded border font-mono transition-all ${isAutoEnabled ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black border-zinc-900/80"}`}>
                      <span className="text-[7px] text-zinc-500 uppercase font-bold tracking-tighter">AUTO-SAFETY</span>
                      <span className={`text-[9px] font-black italic ${isAutoEnabled ? "text-emerald-400" : "text-zinc-700"}`}>FAIL-SAFE ON</span>
                   </div>
                </div>

                {isAutoEnabled && (
                   <div className="flex items-center gap-2 bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                     <span className="text-[8px] font-mono text-emerald-400/80 uppercase font-black tracking-widest">Global Synchronizer Live</span>
                   </div>
                )}
              </div>

              <p className="text-[9px] text-zinc-600 italic leading-relaxed text-center">
                * We will securely fetch your current Gold, Silver, and XP and store it as a restorable snapshot in your private disk.
              </p>
            </form>

            {message && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`mt-6 p-4 rounded border font-mono text-[10px] relative ${
                    message.type === "success" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                 }`}
               >
                 <button 
                  onClick={() => setMessage(null)}
                  className="absolute top-2 right-2 hover:opacity-70"
                 >
                   <X className="w-3 h-3" />
                 </button>
                 {message.type === "success" ? "✓ SUCCESS: " : "⚠ ERROR: "}
                 {message.text}
               </motion.div>
            )}
          </div>
        </div>

        {/* Right: Snapshots & Restore (PAID) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded p-6 md:p-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#FFD700] mb-6 border-b border-zinc-900 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-3 h-3" />
                {restorationStep === "credentials" ? "TARGET ACCOUNT AUTHENTICATION" : "RESTORE CENTER (MANAGEMENT)"}
              </div>
              {restorationStep === "credentials" && (
                <button 
                  onClick={() => setRestorationStep("list")}
                  className="text-zinc-600 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </h2>

            {restorationStep === "credentials" ? (
              <form onSubmit={handleOpenPayment} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded flex items-center gap-3">
                  <DownloadCloud className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase italic">Target Account Selection</h3>
                    <p className="text-[10px] text-zinc-400 font-sans leading-tight">
                      Where should this cloud snapshot be injected? Provide target login credentials.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">TARGET CARX EMAIL</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter destination account email"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 text-sm outline-none focus:border-[#FFD700] text-white font-mono rounded"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">TARGET ACCOUNT PASSWORD</label>
                    <input
                      type="password"
                      required
                      placeholder="Destination password"
                      value={targetPassword}
                      onChange={(e) => setTargetPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2.5 text-sm outline-none focus:border-[#FFD700] text-white font-mono rounded"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setRestorationStep("list")}
                    className="w-1/3 py-3 bg-zinc-950 border border-zinc-900 text-zinc-500 font-mono font-bold text-[10px] uppercase hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={verifyingRestoreCredentials}
                    className="w-2/3 py-3 bg-[#FFD700] hover:bg-white text-black font-black uppercase tracking-wider font-mono text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyingRestoreCredentials ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        VERIFYING...
                      </>
                    ) : (
                      <>
                        SECURE RESTORE (₱{restorePrice}) <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter target account ID/Email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="w-full bg-black border border-zinc-900 p-2 pl-8 text-[10px] outline-none focus:border-[#FFD700] text-zinc-300 font-mono rounded"
                    />
                    <Search className="w-3 h-3 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button 
                    onClick={() => refreshBackups(searchEmail)}
                    className="px-4 py-2 bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white rounded font-mono text-[9px] font-bold uppercase"
                  >
                    SCAN DISK
                  </button>
               </div>

               <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar min-h-[140px]">
                  {isLoadingBackups ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                       <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
                       <span className="text-[9px] font-mono uppercase tracking-widest">Verifying Storage Nodes...</span>
                    </div>
                  ) : backups.length > 0 ? (
                    backups.map((bak, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="p-4 bg-black border border-zinc-900 rounded group flex items-center justify-between hover:border-[#FFD700]/30 transition-all"
                      >
                         <div className="flex items-center gap-4">
                           <div className="w-8 h-8 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-center text-[#FFD700]">
                             <Database className="w-4 h-4" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-mono font-black text-zinc-300 uppercase tracking-tighter truncate max-w-[150px]">{bak.name}</span>
                             <span className="text-[8px] text-zinc-600 font-mono italic">{(new Date(bak.created_at)).toLocaleString()}</span>
                           </div>
                         </div>
                         <button 
                           onClick={() => handleStartRestore(bak.path)}
                           className="bg-[#FFD700]/10 hover:bg-[#FFD700] text-[#FFD700] hover:text-black px-3 py-1.5 rounded text-[9px] font-mono font-black uppercase flex items-center gap-1 transition-all"
                         >
                           RESTORE <ArrowRight className="w-3 h-3" />
                         </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-30">
                       <History className="w-6 h-6 text-zinc-650" />
                       <span className="text-[10px] italic">No active snapshots found. Enter ID above to scan.</span>
                    </div>
                  )}
               </div>

               <div className="mt-6 p-4 bg-zinc-950 border border-zinc-900 rounded space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-mono font-black text-white uppercase italic">Premium Policy</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-relaxed font-sans">
                    Restoration involves re-injecting identity data into a target account. This process requires a <strong>₱{restorePrice.toFixed(2)} Service Fee</strong> per execution to cover data synchronization costs.
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <PaymentWizard
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        serviceLabel="Cloud Snapshot Restoration"
        servicePrice={restorePrice}
        carxEmail={targetEmail}
        carxPassword={targetPassword}
        patchType="restore"
        customDetails={{ backupPath: selectedBackupPath }}
        onComplete={(orderId) => {
          setMessage({ 
            type: "success", 
            text: `Restoration complete. You can now login to your new account. (Order #${orderId.toUpperCase()})` 
          });
          setRestorationStep("list");
          setTargetEmail("");
          setTargetPassword("");
        }}
        onNavigate={onNavigate}
      />
    </div>
  );
}
