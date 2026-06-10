import React, { useEffect, useState } from "react";
import { 
  Shield, Zap, Compass, Flame, ArrowRight, Star, HeartHandshake, 
  HelpCircle, HardDrive, ToggleLeft, Loader2, Camera, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [orderCount, setOrderCount] = useState("32,500+");
  const [recentProofs, setRecentProofs] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (recentProofs.length > 0) {
      const timer = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % recentProofs.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [recentProofs]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // ... pricing fetch
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

        // ... orders fetch
        const oResp = await fetch("/api/orders");
        if (oResp.ok) {
          const orders = await oResp.json();
          if (orders && orders.length > 5) {
            setOrderCount(`${orders.length.toLocaleString()}+`);
          }
        }

        // Fetch proofs for preview
        const proofResp = await fetch("/api/proofs");
        if (proofResp.ok) {
          const proofs = await proofResp.json();
          setRecentProofs(proofs.slice(0, 3));
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
              Fast delivery (~30 seconds) on modded accounts and automated resource calibrations. Full GCash scanner integration ensures instant on-screen logins, with zero admin wait times.
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
                  ACTIVE PIPELINE: GCASH SCAN v2.4
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14" id="features-highlights">
        {/* Card 1 */}
        <div className="p-6 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700] transition-colors flex flex-col items-start gap-4 group">
          <div className="p-3 bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] rounded-sm">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight mb-2">Fast Delivery</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Credentials show up right on your screen automatically once paid. Real-time automatic injection is successfully applied in seconds.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700] transition-colors flex flex-col items-start gap-4 group">
          <div className="p-3 bg-red-655 bg-[#FF3333]/10 border border-[#FF3333]/20 text-[#FF3333] rounded-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight mb-2">Safe & Tested</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              All injection packages utilize secure file mirroring structures. Banned bypass tunnels have 99.8% safe rating indexes.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700] transition-colors flex flex-col items-start gap-4 group">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-sm">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight mb-2">GCash Payment</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Send GCash manually, upload your receipt block, and let our Gemini AI verify transaction hashes in real-time.
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-6 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700] transition-colors flex flex-col items-start gap-4 group">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-sm">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white uppercase italic tracking-tight mb-2">24/7 Support</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Our support resellers are active 24/7 on instant messaging logs to support you on profile calibrations.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Live Stats / Trust Element */}
      <div className="rounded-lg bg-[#080808] border border-[#1A1A1A] p-8 flex flex-col md:flex-row justify-around items-center gap-8 text-center mb-14">
        {/* ... (existing stats) */}
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

      {/* Customer Success Timeline Section */}
      <section className="space-y-6 pt-6">
        <div className="flex items-end justify-between border-l-4 border-[#FF3333] pl-6 py-1">
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">
              RECENT <span className="text-[#FF3333]">DELIVERIES</span>
            </h2>
            <p className="text-zinc-500 text-[10px] font-mono tracking-widest mt-1 uppercase">Live Proof of Successful Account Patches</p>
          </div>
          <button 
            onClick={() => onNavigate("proofs")}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFD700] hover:text-white transition-colors group"
          >
            <span>View Full Timeline</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {recentProofs.length > 0 ? (
          <div className="relative h-64 md:h-80 overflow-hidden group/slider rounded-sm border border-[#1A1A1A]">
            <AnimatePresence mode="wait">
              {recentProofs.map((proof, idx) => (
                idx === activeSlide && (
                  <motion.div
                    key={proof.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => onNavigate("proofs")}
                  >
                    <img 
                      src={proof.image_url} 
                      alt="Success Proof" 
                      className="w-full h-full object-cover brightness-75 transition-all group-hover/slider:scale-105 duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <div className="px-2 py-0.5 bg-[#FFD700] text-black text-[9px] font-black uppercase skew-x-[-10deg]">
                             <span className="skew-x-[10deg]">Verified Delivery</span>
                           </div>
                           <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-[#FFD700] text-[#FFD700]" />)}
                           </div>
                        </div>
                        <h3 className="text-xl font-black italic uppercase text-white tracking-tight">{proof.customer_name}</h3>
                        <p className="text-zinc-400 text-xs italic line-clamp-1 max-w-md">"{proof.review || 'Successfully injected resources and account features. Ready to race!'}"</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {recentProofs.map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1 transition-all duration-500 rounded-full ${i === activeSlide ? 'w-8 bg-[#FFD700]' : 'w-2 bg-white/20'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] border-dashed p-10 text-center rounded-sm">
             <Camera className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
             <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]">Scanning for recent delivery data logs...</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  );
}
