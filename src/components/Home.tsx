import React, { useEffect, useState } from "react";
import { Shield, Zap, Compass, Flame, ArrowRight, Star, HeartHandshake, HelpCircle, HardDrive, ToggleLeft, Loader2, Cloud, UploadCloud, Facebook, Users } from "lucide-react";
import { motion } from "motion/react";

const DEV_AVATAR_URL = "https://kqybljxyobhlakrxcrld.supabase.co/storage/v1/object/public/Profile/FB_IMG_1781767207427.jpg";

interface HomeProps {
  onNavigate: (view: string, arg?: string) => void;
  settings?: {
    is_online?: string;
    maintenance_mode?: string;
    telegram_link?: string;
  };
}

export default function Home({ onNavigate, settings = {} }: HomeProps) {
  const isOnline = settings.is_online !== "false";
  const inMaintenance = settings.maintenance_mode === "true";

  const [pricingRange, setPricingRange] = useState("₱100 ~ ₱350");
  const [orderCount, setOrderCount] = useState("1,500+");

  useEffect(() => {
    async function fetchStats() {
      try {
        const pResp = await fetch("/api/patch-pricing");
        if (pResp.ok) {
          const pricing = await pResp.json();
          if (pricing && pricing.length > 0) {
            const prices = pricing.map((p: any) => Number(p.price));
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setPricingRange(`₱${min} ~ ₱${max}`);
          }
        }

        const oResp = await fetch("/api/orders");
        if (oResp.ok) {
          const orders = await oResp.json();
          const baseCount = 1000;
          const currentCount = orders && Array.isArray(orders) ? orders.length : 0;
          setOrderCount(`${(baseCount + currentCount).toLocaleString()}+`);
        }
      } catch (err) {
        console.error("Home stats fetch failed:", err);
      }
    }
    fetchStats();
  }, []);

  // If Maintenance mode is active, block viewing with immersive, clean warning card screen
  if (inMaintenance) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6" id="maintenance-mode-active">
        <div className="h-16 w-16 bg-amber-500/5 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <HardDrive className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">System Offline for Maintenance</h1>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto font-sans">
          Our bot compilers and registration services are currently receiving a software calibration block to support the latest CarX Street mobile application build. We will return online shortly.
        </p>
        <div className="bg-black border border-zinc-900 rounded p-4 text-left font-mono text-[10px] space-y-1 text-zinc-500">
          <p className="text-[#FFD700]">STATUS_LOG:</p>
          <p>&gt; checking live client version compatibility: 1.4.2</p>
          <p>&gt; recompiling safe anti-cheat bypass tunnels... OK</p>
          <p>&gt; average calibration ETA: 20 minutes</p>
        </div>
        {settings.telegram_link && (
          <a
            href={settings.telegram_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD700] hover:bg-white text-black font-black uppercase text-xs tracking-wider rounded transition-colors"
          >
            <span>JOIN DISCORD / TELEGRAM FOR UPDATES</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 animate-fade-in" id="home-view">
      
      {/* 1. OFF-LINE BANNER */}
      {!isOnline && (
        <div className="bg-[#FF3333]/15 border border-[#FF3333]/30 px-5 py-4 rounded-lg mb-8 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono" id="store-offline-banner">
          <div className="flex items-center gap-2.5 text-[#FF3333]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3333] animate-ping" />
            <strong>NOTICE: AUTOMATIC DELIVERIES PAUSED TEMPORARILY</strong>
          </div>
          <p className="text-zinc-300 text-left font-sans sm:flex-1 sm:px-4">
            Our CarX automated queues are resting. You can still order accounts and patches; receipts are saved and fulfillment processes will execute in order once queues open.
          </p>
          <span className="text-[10px] uppercase font-bold text-[#FF3333] bg-black px-2 py-0.5 border border-[#FF3333]/25 whitespace-nowrap">
            OFFLINE QUEER
          </span>
        </div>
      )}

      {/* Community Connections */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <a 
          href="https://www.facebook.com/share/1Cc8cdwQ9F/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-lg bg-[#0F0F0F] border border-[#0084FF]/20 hover:border-[#0084FF] transition-all flex items-center gap-5 group cursor-pointer"
          id="link-dev-fb"
        >
          <div className="relative shrink-0">
            <img 
              src={DEV_AVATAR_URL} 
              alt="Karl Abalunan" 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#0084FF]/40 group-hover:border-[#0084FF] transition-all"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#0084FF] p-1 rounded-full border border-[#0F0F0F]">
              <Facebook className="w-3 h-3 text-white fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight leading-none">Karl Abalunan</h3>
              <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-1 group-hover:text-[#0084FF] transition-all" />
            </div>
            <span className="inline-block px-1.5 py-0.5 bg-[#0084FF]/10 text-[#0084FF] border border-[#0084FF]/20 text-[8px] font-mono font-bold uppercase rounded-sm mb-1.5">
              OFFICIAL DEVELOPER
            </span>
            <p className="text-zinc-400 text-[10px] leading-relaxed font-sans uppercase tracking-wider font-semibold block">
              Follow Karl Abalunan for direct dev updates
            </p>
          </div>
        </a>

        <a 
          href="https://www.facebook.com/share/g/1DPEhA9sbK/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-lg bg-[#0F0F0F] border border-[#0084FF]/20 hover:border-[#0084FF] transition-all flex items-center gap-5 group cursor-pointer"
          id="link-group-fb"
        >
          <div className="p-4 bg-[#0084FF]/10 border border-[#0084FF]/20 text-[#0084FF] rounded-sm group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight">Community Group</h3>
              <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-1 group-hover:text-[#0084FF] transition-all" />
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed font-sans uppercase tracking-wider font-semibold">
              Join CarX Street Philippines (MOD/GRIND)
            </p>
          </div>
        </a>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A] border border-[#222] p-8 md:p-14 mb-14 shadow-2xl">
        {/* Decorative Grid Lines / Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-[#FF3333]/15 blur-3xl rounded-full" />
        <div className="absolute -right-10 -bottom-10 w-45 h-45 bg-[#FFD700]/10 blur-3xl rounded-full" />

        <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 flex flex-col items-start space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#050505] border border-[#222] rounded-sm text-[10px] font-mono font-bold tracking-widest text-[#FFD700]"
            >
              <Zap className="w-3.5 h-3.5 text-[#FFD700] animate-pulse" />
              <span>ACTIVE SYSTEM PIPELINE AUTOMATION</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-red-500 animate-pulse'}`} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-none text-white"
            >
              CARX STREET <span className="text-[#FFD700]">RESOURCE</span> SHOP
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-400 text-sm sm:text-base max-w-xl font-sans leading-relaxed"
            >
              Fast delivery (~30 seconds) on modded accounts and automated resource calibrations. Universal receipt scanner integration ensures instant on-screen logins, with zero admin wait times.
            </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto pt-2"
              >
                {/* Slanted skew button */}
                <button
                  onClick={() => onNavigate("accounts")}
                  className="group relative cursor-pointer px-6 py-3.5 bg-[#FFD700] hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all rounded-sm flex items-center justify-center gap-2"
                  id="btn-nav-catalog"
                >
                  <span>Browse Resource Packages</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
                </button>

                <button
                  onClick={() => onNavigate("order")}
                  className="group relative cursor-pointer px-6 py-3.5 bg-transparent border border-[#FF3333] hover:bg-[#FF3333] hover:text-white text-[#FF3333] font-black uppercase text-xs tracking-wider transition-all rounded-sm flex items-center justify-center gap-2"
                  id="btn-nav-order"
                >
                  <span>Order a Patch</span>
                  <Flame className="w-4 h-4 hover:scale-110 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate("recovery")}
                  className="group relative cursor-pointer px-6 py-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-400 hover:text-white font-black uppercase text-xs tracking-wider transition-all rounded-sm flex items-center justify-center gap-2"
                  id="btn-nav-recovery"
                >
                  <span>🛠️ Replacement & Refills</span>
                </button>
              </motion.div>
          </div>

          <div className="md:col-span-5 relative hidden md:block">
            {/* Visual element representing high speed racing */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.2 }}
              className="relative rounded-lg overflow-hidden shadow-2xl border border-[#222]"
            >
              <img
                src="https://picsum.photos/seed/carxstreet/600/400"
                alt="CarX Street High Speed Racing Garage"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-[#0A0A0A]/95 border border-[#222] p-4 rounded-sm text-xs font-mono">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">BOT INJECTION PROTOCOL</span>
                  <span className={`text-[10px] font-bold ${isOnline ? 'text-emerald-400' : 'text-[#FF3333]'}`}>
                    {isOnline ? 'OPERATIONAL ✓' : 'STANDBY PAUSE'}
                  </span>
                </div>
                <div className="text-white font-bold text-[11px] tracking-wider uppercase">
                  ACTIVE PIPELINE: UNIVERSAL SCAN v2.4
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

        {/* Feature Highlights Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-14" id="features-highlights">
          {/* Card 1 */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700] transition-colors flex flex-col items-start gap-4 group">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight mb-2">Safe & Tested</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                All injection packages utilize secure file mirroring structures. Banned bypass tunnels have 99.8% safe rating indexes.
              </p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700] transition-colors flex flex-col items-start gap-4 group">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-sm">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight mb-2">Instant Analysis</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                Send payment manually via GCash or Other Wallets, upload your receipt block, and let our Gemini AI verify transaction hashes in real-time.
              </p>
            </div>
          </div>
        </div>



      {/* Quick Live Stats / Trust Element */}
      <div className="rounded-lg bg-[#080808] border border-[#1A1A1A] p-8 flex flex-col md:flex-row justify-around items-center gap-8 text-center mb-10">
        <div>
          <div className="text-3xl font-black italic uppercase text-white tracking-tight">{orderCount}</div>
          <div className="text-zinc-500 text-[10px] font-mono uppercase mt-1.5 tracking-widest font-bold">Fulfillments Delivered</div>
        </div>
        <div className="hidden md:block w-px h-10 bg-[#1A1A1A]" />
        <div>
          <div className="text-3xl font-black italic uppercase text-white tracking-tight">100% AUTO</div>
          <div className="text-[#FF3333] text-[10px] font-mono uppercase mt-1.5 tracking-widest font-bold">No Admin Verification Required</div>
        </div>
        <div className="hidden md:block w-px h-10 bg-[#1A1A1A]" />
        <div>
          <div className="text-3xl font-black italic uppercase text-white tracking-tight">{pricingRange}</div>
          <div className="text-[#FFD700] text-[10px] font-mono uppercase mt-1.5 tracking-widest font-bold">Cheap Resource Patch Rates</div>
        </div>
      </div>
    </div>
  );
}
