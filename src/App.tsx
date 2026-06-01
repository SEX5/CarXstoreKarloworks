import React, { useState, useEffect } from "react";
import { 
  Flame, Coins, UserCheck, ShieldCheck, Mail, MessageCircle, HelpCircle, 
  Send, Compass, Menu, X, ArrowUpRight, Info 
} from "lucide-react";

import Home from "./components/Home";
import AccountsCatalog from "./components/AccountsCatalog";
import OrderPatch from "./OrderPatch";
import OrderStatus from "./components/OrderStatus";
import AdminPanel from "./components/AdminPanel";
import SuccessPage from "./components/SuccessPage";
import CancelPage from "./components/CancelPage";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [orderIdParam, setOrderIdParam] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const [configStatus, setConfigStatus] = useState({
    stripeConfigured: false,
    supabaseConfigured: false,
    sandboxMode: false,
    adminEmail: "admin@carxstreet.store",
    adminPassword: "CarxStreetAdminSecurePass123"
  });
  const [showSandboxNotice, setShowSandboxNotice] = useState(true);

  // Sync state with url address path for perfect deep links on reload
  useEffect(() => {
    // Fetch configuration status
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => setConfigStatus(data))
      .catch((err) => console.log("Config load failed or skipped:", err));

    const syncViewWithURL = () => {
      const path = window.location.pathname;
      const parts = path.split("/").filter(Boolean); // e.g., ["order-status", "ORD-1234"]
      if (path === "/accounts") {
        setCurrentView("accounts");
      } else if (path === "/order") {
        setCurrentView("order");
      } else if ((parts[0] === "order-status" || parts[0] === "order_status") && parts[1]) {
        setCurrentView("order_status");
        setOrderIdParam(parts[1]);
      } else if (path === "/admin") {
        setCurrentView("admin");
      } else if (path === "/success") {
        setCurrentView("success");
      } else if (path === "/cancel") {
        setCurrentView("cancel");
      } else {
        setCurrentView("home");
      }
    };

    syncViewWithURL();
    window.addEventListener("popstate", syncViewWithURL);
    return () => window.removeEventListener("popstate", syncViewWithURL);
  }, []);

  const navigateTo = (view: string, arg?: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    if (arg) {
      setOrderIdParam(arg);
    }
    const targetPath = view === "home" ? "/" : `/${view}${arg ? `/${arg}` : ""}`;
    window.history.pushState({}, "", targetPath);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col justify-between font-sans" id="app-container">
      {/* 1. Sleek Navigation Header bar */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo Brand / Launcher - Sleek Style with Skewed X Accent */}
          <div 
            onClick={() => navigateTo("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-[#FFD700] flex items-center justify-center rounded-sm skew-x-[-10deg] transition-all group-hover:scale-105 duration-250">
              <span className="text-black font-black text-lg italic skew-x-[10deg]">X</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none text-white">
                <span className="text-[#FFD700]">CarX</span> Street <span className="text-[#FF3333]">Store</span>
              </h1>
              <span className="text-[8px] font-mono tracking-[0.2em] text-zinc-500 uppercase font-bold leading-none block mt-1">
                KARLOWORKS
              </span>
            </div>
          </div>

          {/* Desktop Navigation panel */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.2em]">
            <button
              onClick={() => navigateTo("home")}
              className={`cursor-pointer transition-colors hover:text-white pb-1 border-b-2 ${
                currentView === "home" ? "text-[#FFD700] border-[#FFD700]" : "text-gray-400 border-transparent"
              }`}
            >
              Lobby
            </button>

            <button
              onClick={() => navigateTo("accounts")}
              className={`cursor-pointer transition-colors hover:text-white pb-1 border-b-2 ${
                currentView === "accounts" ? "text-[#FFD700] border-[#FFD700]" : "text-gray-400 border-transparent"
              }`}
            >
              Accounts
            </button>

            <button
              onClick={() => navigateTo("order")}
              className={`cursor-pointer transition-colors hover:text-white pb-1 border-b-2 ${
                currentView === "order" ? "text-[#FFD700] border-[#FFD700]" : "text-gray-400 border-transparent"
              }`}
            >
              Patches
            </button>

            <span className="w-px h-4 bg-[#1A1A1A]" />

            <button
              onClick={() => navigateTo("admin")}
              className={`px-4 py-2 bg-transparent text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all border ${
                currentView === "admin"
                  ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5"
                  : "border-[#1A1A1A] text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              Admin Cockpit
            </button>
          </nav>

          {/* Mobile responsive toggle button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-[#080808] border border-[#1A1A1A] text-gray-400 rounded hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-[#1A1A1A] flex flex-col gap-4 px-2">
            <button
              onClick={() => navigateTo("home")}
              className={`text-left py-2 font-mono text-xs font-bold uppercase tracking-wide ${
                currentView === "home" ? "text-[#FFD700]" : "text-gray-400"
              }`}
            >
              Lobby
            </button>
            <button
              onClick={() => navigateTo("accounts")}
              className={`text-left py-2 font-mono text-xs font-bold uppercase tracking-wide ${
                currentView === "accounts" ? "text-[#FFD700]" : "text-gray-400"
              }`}
            >
              Resource Packages
            </button>
            <button
              onClick={() => navigateTo("order")}
              className={`text-left py-2 font-mono text-xs font-bold uppercase tracking-wide ${
                currentView === "order" ? "text-[#FFD700]" : "text-gray-400"
              }`}
            >
              Order Patch
            </button>
            <button
              onClick={() => navigateTo("admin")}
              className="text-left py-2 px-3 bg-[#080808] border border-[#1A1A1A] rounded font-mono text-xs font-bold uppercase tracking-wide text-[#FFD700]"
            >
              Admin Control Cockpit
            </button>
          </div>
        )}
      </header>

      {/* Interactive Sandbox Mode Notice ribbon */}
      {showSandboxNotice && configStatus.sandboxMode && (
        <div className="bg-gradient-to-r from-[#0A0A0A] via-[#111111] to-[#0A0A0A] border-b border-[#FFD700]/15 px-4 py-2.5 text-xs text-gray-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#FFD700] shrink-0" />
              <p className="font-sans leading-normal">
                <span className="text-[#FFD700] font-bold">Interactive Sandbox Engaged:</span> Stripe & Supabase settings are in default demo state. Injections and checkouts run fully local.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3.5 text-[10px] font-mono">
              <span>
                ADMIN USERNAME: <strong className="text-white bg-black px-1.5 py-0.5 border border-[#222] rounded-sm">{configStatus.adminEmail}</strong>
              </span>
              <span>
                SECRET KEY: <strong className="text-white bg-black px-1.5 py-0.5 border border-[#222] rounded-sm">{configStatus.adminPassword}</strong>
              </span>
              <button
                onClick={() => navigateTo("admin")}
                className="cursor-pointer text-[#FFD700] hover:text-white underline font-bold uppercase tracking-wider text-[9px]"
              >
                ACCESS ADMIN PANEL &rarr;
              </button>
              <button
                onClick={() => setShowSandboxNotice(false)}
                className="cursor-pointer text-gray-500 hover:text-white"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Page Render viewport */}
      <main className="flex-grow py-8 px-4 max-w-7xl mx-auto w-full">
        {currentView === "home" && <Home onNavigate={navigateTo} />}
        {currentView === "accounts" && <AccountsCatalog onNavigate={navigateTo} />}
        {currentView === "order" && <OrderPatch onNavigate={navigateTo} />}
        {currentView === "order_status" && <OrderStatus orderId={orderIdParam || ""} onNavigate={navigateTo} />}
        {currentView === "admin" && <AdminPanel />}
        {currentView === "success" && <SuccessPage onNavigate={navigateTo} />}
        {currentView === "cancel" && <CancelPage onNavigate={navigateTo} />}
      </main>

      {/* 3. Dynamic Ticker Footer from Sleek Interface design */}
      <div className="h-9 bg-[#FFD700] px-4 md:px-8 flex items-center justify-between text-black overflow-hidden font-display font-black text-[10px] uppercase tracking-widest select-none">
        <marquee scrollamount="4" className="w-full">
          <span className="inline-flex gap-16 whitespace-nowrap">
            <span>ACTIVE PLAYERS INJECTING: 1,492</span>
            <span>•</span>
            <span>DELIVERY PIPELINE: OPERATIONAL ✓</span>
            <span>•</span>
            <span>AVERAGE COMPLETION TIMELINE: 4 MINUTES</span>
            <span>•</span>
            <span>SECURE STRIPE TLS 1.3 ENCRYPTION ENFORCED</span>
            <span>•</span>
            <span>GOLD & SILVER PACKS AUTO-DELIVERED IN REALTIME</span>
          </span>
        </marquee>
        <div className="bg-black text-[#FFD700] px-4 h-full hidden sm:flex items-center font-bold tracking-widest text-[9px] whitespace-nowrap">
          SUPPORT AGENTS ACTIVE
        </div>
      </div>

      {/* 4. Sleek Footer Section */}
      <footer className="border-t border-[#1A1A1A] py-10 px-4 md:px-8 bg-[#080808] text-gray-500 font-sans">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-zinc-900 rounded border border-[#1A1A1A] flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-[#FF3333]" />
              </div>
              <span className="font-display font-extrabold text-white text-sm uppercase tracking-wider">KARLO WORKS SHOP</span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-xl">
              A fast and convenient website for us. Explore our catalog of affordable grind and mod accounts delivered instantly to your device.
            </p>
          </div>

          <div className="md:col-span-6 md:text-right space-y-2 mt-4 md:mt-0 font-mono text-[11px]">
            <h4 className="font-bold text-gray-400 uppercase tracking-widest leading-none">AUTO BOT TELEGRAM SYSTEM</h4>
            <p className="text-zinc-500">
              Pipeline: <span className="text-emerald-400 font-bold">ONLINE ✓</span> &bull; Sandbox Mode: <span className="text-[#FFD700] font-bold">READY</span>
            </p>
            <div className="text-[10px] text-zinc-600">
              © 2026 CarX Street Reseller Store. All telemetry keys managed securely.
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Floating Client Assistant Button Drawer */}
      <div className="fixed bottom-12 right-6 z-50">
        <div className="relative">
          {/* Support Prompt Pop balloon */}
          {showSupportPrompt && (
            <div className="absolute bottom-16 right-0 w-64 bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-4 shadow-2xl space-y-3 mr-1">
              <h4 className="text-xs font-display font-bold text-[#FFD700] uppercase tracking-wide">
                Need Help synchronizing?
              </h4>
              <p className="text-[11px] text-gray-400 leading-normal font-sans">
                Our support resellers are active 24/7 on instant messaging! Contact us directly:
              </p>

              <div className="space-y-2 pt-1 font-mono text-[11px] font-semibold">
                {/* Telegram */}
                <a 
                  href="https://t.me/CarXResellerSupportBot" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-[#111] hover:bg-[#161616] hover:text-white border border-[#222] rounded transition-all"
                >
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Send className="w-3.5 h-3.5" />
                    Telegram Support
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-gray-600" />
                </a>

                {/* Messenger */}
                <a 
                  href="https://m.me/lark.abalunan.1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-[#111] hover:bg-[#161616] hover:text-white border border-[#222] rounded transition-all"
                >
                  <span className="flex items-center gap-1.5 text-[#0084FF]">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Messenger Support
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-gray-600" />
                </a>
              </div>
            </div>
          )}

          {/* Core Support Button Bubble */}
          <button
            onClick={() => setShowSupportPrompt(!showSupportPrompt)}
            className="h-14 w-14 rounded-full bg-[#25D366] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-4 border-[#050505] cursor-pointer transition-all"
            id="floating-support-btn"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
