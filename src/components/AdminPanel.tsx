import React, { useState, useEffect } from "react";
import { 
  Key, Mail, LogIn, LayoutDashboard, Database, ClipboardList, TrendingUp, 
  Trash2, Plus, LogOut, CheckCircle2, RefreshCw, Layers, ShieldCheck, Eye, EyeOff,
  Settings, DollarSign, Coins, Image, XCircle, ArrowRight, ToggleLeft, ToggleRight
} from "lucide-react";
import { CarXAccount, PatchOrder, Stats } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { formatResourceQuantity } from "../utils";

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("carx_admin_token"));
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // 6 Dashboard Tabs: "orders" | "accounts" | "pricing" | "stats" | "settings" | "logs"
  const [activeTab, setActiveTab] = useState<"orders" | "accounts" | "pricing" | "stats" | "settings" | "logs">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [patchPricing, setPatchPricing] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  // Settings collection states
  const [settings, setSettings] = useState<any>({
    gcash_number: "09123963204",
    gcash_name: "KA•L A.",
    gcash_qr_url: "",
    telegram_link: "https://t.me/CarXResellerSupportBot",
    is_online: "true",
    maintenance_mode: "false"
  });

  // Filters & Toggles
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [showPasswordMap, setShowPasswordMap] = useState<{ [key: string]: boolean }>({});
  
  // Expanded visual receipt modal view
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [activeOcrData, setActiveOcrData] = useState<any | null>(null);

  // Account creation form parameters
  const [newAccName, setNewAccName] = useState("");
  const [newAccSilver, setNewAccSilver] = useState(25000000);
  const [newAccGold, setNewAccGold] = useState(8500);
  const [newAccXp, setNewAccXp] = useState(35);
  const [newAccCars, setNewAccCars] = useState(12);
  const [newAccMaps, setNewAccMaps] = useState(10);
  const [newAccPrice, setNewAccPrice] = useState(499.00);
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [newAccSnapUrl, setNewAccSnapUrl] = useState("");
  const [newAccImageUrl, setNewAccImageUrl] = useState("");
  const [newAccCarImages, setNewAccCarImages] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCar, setUploadingCar] = useState(false);
  const [accFormError, setAccFormError] = useState<string | null>(null);
  const [accFormSuccess, setAccFormSuccess] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isLocalUpload, setIsLocalUpload] = useState(false);

  // Replacement & Refill Limits
  const [newAccMaxReplacements, setNewAccMaxReplacements] = useState(1);
  const [newAccMaxRefills, setNewAccMaxRefills] = useState(1);

  // Dynamic Patch Pricing edit states
  const [editPrices, setEditPrices] = useState<{ [key: string]: number }>({});
  const [savingPriceMap, setSavingPriceMap] = useState<{ [key: string]: boolean }>({});

  // Settings update loader state
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Manual Order Entry States
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualOrderRef, setManualOrderRef] = useState("");
  const [manualOrderEmail, setManualOrderEmail] = useState("");
  const [manualOrderType, setManualOrderType] = useState<"account" | "patch">("account");
  const [manualOrderAccountId, setManualOrderAccountId] = useState("");
  const [manualOrderPatchType, setManualOrderPatchType] = useState("");
  const [manualOrderAmount, setManualOrderAmount] = useState("");
  const [manualOrderLoading, setManualOrderLoading] = useState(false);
  const [manualOrderError, setManualOrderError] = useState<string | null>(null);
  const [manualOrderSuccess, setManualOrderSuccess] = useState(false);

  const [deletingOrderId, setDeletingOrderId] = useState<string | number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | number | null>(null);
  
  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Authentication keys rejected.");
      }

      localStorage.setItem("carx_admin_token", data.token);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || "An error occurred authenticating Admin session.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("carx_admin_token");
    setToken(null);
  };

  // Load all central dashboard metrics
  const loadDashboardData = async () => {
    if (!token) return;
    try {
      setLoadingDb(true);

      const headers = { "Authorization": `Bearer ${token}` };

      // Batch load
      const [oResp, aResp, pResp, sResp, stResp] = await Promise.all([
        fetch("/api/admin/orders", { headers }),
        fetch("/api/admin/accounts", { headers }),
        fetch("/api/patch-pricing"),
        fetch("/api/settings"),
        fetch("/api/admin/stats", { headers })
      ]);

      if (oResp.status === 401 || aResp.status === 401) {
        handleLogout();
        return;
      }

      const o = await oResp.json();
      const a = await aResp.json();
      const p = await pResp.json();
      const s = await sResp.json();
      const st = await stResp.json();

      setOrders(o);
      setAccounts(a);
      setPatchPricing(p);
      setSettings(s);
      setStats(st);

      // Prepopulate pricing edits variables
      const edits: { [key: string]: number } = {};
      p.forEach((item: any) => {
        edits[item.patch_type] = item.price;
      });
      setEditPrices(edits);

    } catch (err) {
      console.error("Dashboard database synchronization failed: ", err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  // Update Patch Order Status (Approve / Reject / Mark Complete)
  const handleOrderStatusAction = async (id: string, nextStatus: string) => {
    if (!token) return;
    try {
      const resp = await fetch(`/api/admin/orders/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      
      if (resp.ok) {
        loadDashboardData();
      }
    } catch (e: any) {
      console.error("Failed executing order patch approve:", e.message);
    }
  };

  // Add or Update preset accounts
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccFormError(null);
    setAccFormSuccess(false);

    if (!newAccName || isNaN(newAccPrice) || (!newAccSnapUrl && (!newAccEmail || !newAccPassword))) {
      setAccFormError("Please fill out Name, Price, and either Snapshot URL (for modded) or Credentials (for legacy backup).");
      return;
    }
    
    try {
      const payload = {
        name: newAccName,
        silver: newAccSilver,
        gold: newAccGold,
        xp: newAccXp,
        cars_unlocked: newAccCars,
        maps_unlocked: newAccMaps,
        price: newAccPrice,
        snapshot_url: newAccSnapUrl,
        image_url: newAccImageUrl,
        car_images: newAccCarImages,
        email: newAccEmail,
        password: newAccPassword,
        max_replacements: newAccMaxReplacements,
        max_refills: newAccMaxRefills
      };

      const endpoint = editingAccountId ? `/api/admin/accounts/${editingAccountId}/update` : "/api/admin/accounts";
      const method = "POST";
      
      const resp = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errJson = await resp.json();
        throw new Error(errJson.error || "Failed database insertion.");
      }

      setAccFormSuccess(true);
      if (!editingAccountId) {
        setNewAccName("");
        setNewAccEmail("");
        setNewAccPassword("");
        setNewAccSnapUrl("");
        setNewAccImageUrl("");
        setNewAccCarImages("");
        setNewAccMaxReplacements(1);
        setNewAccMaxRefills(1);
      }
      setEditingAccountId(null);
      loadDashboardData();

    } catch (err: any) {
      setAccFormError(err.message);
    }
  };

  const handleEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setNewAccName(acc.name);
    setNewAccSilver(acc.silver);
    setNewAccGold(acc.gold);
    setNewAccXp(acc.xp);
    setNewAccCars(acc.cars_unlocked);
    setNewAccMaps(acc.maps_unlocked);
    setNewAccPrice(acc.price);
    setNewAccSnapUrl(acc.snapshot_url || "");
    setNewAccImageUrl(acc.image_url || "");
    setNewAccCarImages(acc.car_images || "");
    setNewAccMaxReplacements(acc.max_replacements !== undefined ? acc.max_replacements : 1);
    setNewAccMaxRefills(acc.max_refills !== undefined ? acc.max_refills : 1);
    
    // Credentials are JSON stringified and encrypted in DB
    // We try to decode them if they look like the expected format
    if (acc.credentials && acc.decoded_credentials) {
      const parts = acc.decoded_credentials.split(" | ");
      const emailPart = parts[0]?.split(": ")[1];
      const passPart = parts[1]?.split(": ")[1];
      setNewAccEmail(emailPart || "");
      setNewAccPassword(passPart || "");
    }
    
    // Jump to form
    const formElement = document.getElementById("account-assemble-form");
    if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isCarImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isCarImage) {
      setUploadingCar(true);
    } else {
      setUploadingImage(true);
    }

    try {
      const reader = new FileReader();
      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            const res = await fetch("/api/admin/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                base64
              })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            resolve(data.url);
          } catch (uploadErr) {
            reject(uploadErr);
          }
        };
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });

      const url = await uploadPromise;
      if (isCarImage) {
        setNewAccCarImages(prev => prev ? `${prev},${url}` : url);
      } else {
        setNewAccImageUrl(url);
      }
      
      if (url.startsWith("/uploads/")) {
        setIsLocalUpload(true);
      } else {
        setIsLocalUpload(false);
      }
    } catch (err: any) {
      setAccFormError("Upload failed: " + err.message);
    } finally {
      if (isCarImage) {
        setUploadingCar(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  // Save specific patch pricing rates
  const handleSavePatchPrice = async (pt: string) => {
    if (!token) return;
    try {
      setSavingPriceMap(prev => ({ ...prev, [pt]: true }));
      const selected = patchPricing.find((item) => item.patch_type === pt);
      if (!selected) return;

      const resp = await fetch("/api/admin/patch-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          patch_type: pt,
          price: editPrices[pt],
          label: selected.label,
          description: selected.description
        })
      });

      if (resp.ok) {
        loadDashboardData();
      }
    } catch (e: any) {
      console.error("Price change exception:", e.message);
    } finally {
      setSavingPriceMap(prev => ({ ...prev, [pt]: false }));
    }
  };

  // Delete account row
  const handleDeleteAccount = async (id: string) => {
    if (!token) return;
    try {
      const resp = await fetch(`/api/admin/accounts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) {
        loadDashboardData();
      }
    } catch (e: any) {
      console.error("Delete account error:", e.message);
    }
  };

  // Update general configurations (GCash, Support link, Offline toggle)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);
    setUpdatingSettings(true);

    try {
      const resp = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          gcash_number: settings.gcash_number,
          gcash_name: settings.gcash_name,
          gcash_qr_url: settings.gcash_qr_url,
          telegram_link: settings.telegram_link,
          is_online: settings.is_online,
          maintenance_mode: settings.maintenance_mode
        })
      });

      if (resp.ok) {
        setSettingsSuccess(true);
        loadDashboardData();
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Failed saving settings layout:", err.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setManualOrderLoading(true);
    setManualOrderError(null);
    setManualOrderSuccess(false);

    try {
      const resp = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          gcash_ref: manualOrderRef,
          customer_email: manualOrderEmail,
          type: manualOrderType,
          account_id: manualOrderAccountId,
          patch_type: manualOrderPatchType,
          amount: manualOrderAmount,
          status: "completed"
        })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to create manual order.");

      setManualOrderSuccess(true);
      loadDashboardData();
      // Reset form
      setManualOrderRef("");
      setManualOrderEmail("");
      setManualOrderAmount("");
      setTimeout(() => {
        setManualOrderSuccess(false);
        setShowManualOrderModal(false);
      }, 2000);
    } catch (err: any) {
      setManualOrderError(err.message);
    } finally {
      setManualOrderLoading(false);
    }
  };
  
  const handleDeleteOrder = async (id: string | number) => {
    if (!token) return;
    
    // Safety check: require two clicks
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      setTimeout(() => setConfirmingDeleteId(null), 3000); // Reset after 3 seconds
      return;
    }

    setDeletingOrderId(id);
    setConfirmingDeleteId(null);
    
    try {
      const resp = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to delete order.");

      // Refresh data
      loadDashboardData();
    } catch (err: any) {
      console.error("Delete order error:", err);
      // We'll show errors via a more visible mechanism if possible, 
      // but for now, we'll keep the alert fallback just in case, but styled or logged.
      alert(`SYSTEM ERROR: ${err.message}`);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleToggleOnline = () => {
    const nextVal = settings.is_online === "true" ? "false" : "true";
    setSettings((prev: any) => ({ ...prev, is_online: nextVal }));
  };

  const handleToggleMaintenance = () => {
    const nextVal = settings.maintenance_mode === "true" ? "false" : "true";
    setSettings((prev: any) => ({ ...prev, maintenance_mode: nextVal }));
  };

  const togglePasswordMap = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // RENDER LOGIN MODULE
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 animate-fade-in" id="admin-login-view">
        <div className="relative rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#FF3333]/5 blur-3xl rounded-full" />
          
          <div className="text-center mb-8">
            <span className="inline-flex p-3 bg-[#FF3333]/5 border border-[#FF3333]/15 text-[#FF3333] rounded-sm mb-3">
              <Key className="w-5 h-5 text-[#FFD700]" />
            </span>
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">RESELLER PORTAL</h1>
            <p className="text-gray-500 font-mono text-[9px] uppercase mt-1.5 tracking-widest text-[#FFD700] font-bold">Reseller Credential Check</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="admin-email" className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                Admin Email Coordinate
              </label>
              <input
                id="admin-email"
                type="email"
                required
                placeholder="admin@carxstreet.store"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded text-sm text-white font-mono focus:border-[#FFD700]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-pass" className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                Access Security Password
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                placeholder="••••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded text-sm text-white font-mono focus:border-[#FFD700]"
              />
            </div>

            {loginError && (
              <p className="text-xs text-center text-[#FF3333] p-2 bg-[#FF3333]/5 border border-[#FF3333]/15 rounded font-mono">
                ⚠ {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#FF3333] hover:bg-white text-white hover:text-black font-black uppercase text-xs tracking-widest transition-colors cursor-pointer"
            >
              {loginLoading ? "CHECKING ACCESS AUTH..." : "VERIFY COCKPIT INJECTOR"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter orders by status
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "all") return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 animate-fade-in" id="admin-dashboard-view">
      
      {/* Dashboard Brand Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-[#FFD700]" />
            RESELLER CONTROL CENTER
          </h1>
          <p className="text-zinc-500 text-[10px] font-mono uppercase mt-1">CarX Game Reseller Bot Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loadingDb}
            className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded cursor-pointer"
            title="Reload metrics database"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDb ? "animate-spin text-[#FFD700]" : "text-zinc-400"}`} />
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-[#FF3333] hover:bg-white text-white hover:text-black font-black text-xs uppercase tracking-wide cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            DISCONNECT LOCKOUT
          </button>
        </div>
      </div>

      {/* 5-TAB SELECTION ROWS */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 mb-8" id="admin-tabs-nav">
        {[
          { tab: "orders", icon: <ClipboardList className="w-4 h-4" />, label: `ORDERS QUEUE (${orders.length})` },
          { tab: "accounts", icon: <Database className="w-4 h-4" />, label: `GARAGE STOCK (${accounts.length})` },
          { tab: "pricing", icon: <Coins className="w-4 h-4" />, label: "PATCH PRICING PHP" },
          { tab: "stats", icon: <TrendingUp className="w-4 h-4" />, label: "PERFORMANCE STATS" },
          { tab: "settings", icon: <Settings className="w-4 h-4" />, label: "SYSTEM SETTINGS" },
          { tab: "logs", icon: <Layers className="w-4 h-4" />, label: `ALERTS & LOGS (${stats?.system_logs?.length || 0})` }
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab as any)}
            className={`px-4 py-3 font-semibold text-xs font-mono tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 cursor-pointer ${
              activeTab === item.tab
                ? "border-[#FFD700] text-[#FFD700] bg-zinc-950 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ORDERS COCKPIT */}
      {activeTab === "orders" && (
        <div className="space-y-6" id="admin-tab-orders">
          {/* Status Filter selectors */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="orders-status-filters">
            <div className="flex flex-wrap gap-2">
              {["all", "pending_fulfillment", "paid", "completed", "rejected"].map((sf) => (
                <button
                  key={sf}
                  onClick={() => setOrderStatusFilter(sf)}
                  className={`px-3 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-wide font-bold cursor-pointer border ${
                    orderStatusFilter === sf
                      ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30"
                      : "bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-805 hover:text-zinc-300"
                  }`}
                >
                  {sf.replace("_", " ")}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowManualOrderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] hover:bg-white text-black font-black uppercase text-[10px] tracking-wider transition-colors rounded shadow-lg shadow-[#FFD700]/10"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Manual Order
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center border border-zinc-900 rounded bg-[#0A0A0A] text-zinc-500 font-mono text-xs uppercase">
              No orders queued in filter matching.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-900 rounded bg-[#0A0A0A]" id="orders-table-wrapper">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-black/80 font-mono text-[9px] text-zinc-500 uppercase tracking-wider border-b border-zinc-900">
                    <th className="p-4">Track ID</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">User Info</th>
                    <th className="p-4">GCash Detail</th>
                    <th className="p-4">Amount Paid</th>
                    <th className="p-4">Screenshot</th>
                    <th className="p-4">Fulfillment / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A] text-zinc-300">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-950/40">
                      <td className="p-4 font-mono font-bold text-white whitespace-nowrap">{o.order_id}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold text-xs ${
                          o.order_type === "account" ? "bg-cyan-500/5 text-cyan-400 border-cyan-500/10" : "bg-purple-500/5 text-purple-400 border-purple-500/10"
                        }`}>
                          {o.order_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 max-w-[200px] truncate">
                          <p>📧 Delivery: <strong className="text-white">{o.customer_email}</strong></p>
                          {o.carx_email && <p className="text-zinc-500">🛒 Game User ID: <span className="text-zinc-350 text-zinc-300 font-mono">{o.carx_email}</span></p>}
                          {o.carx_password && (
                            <p className="text-zinc-500 flex items-center gap-1.5">
                              🔑 Password: 
                              <span className="text-[#FF3333] font-mono bg-black px-1 rounded border border-zinc-900 inline-flex items-center gap-1">
                                {showPasswordMap[o.id] ? o.decrypted_password : "••••••••"}
                                <button type="button" onClick={() => togglePasswordMap(o.id)} className="text-zinc-400 hover:text-white">
                                  {showPasswordMap[o.id] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                                </button>
                              </span>
                            </p>
                          )}

                          {/* 🎫 DYNAMIC CLAIMS & REFILL TELEMETRY DISPLAY */}
                          {o.order_type === "account" && (
                            <div className="pt-2 border-t border-zinc-900 mt-2 text-[10px] space-y-1">
                              <p className="text-[8.5px] font-mono text-[#FFD700] uppercase font-bold tracking-widest font-bold">🎫 Claims Telemetry</p>
                              {(() => {
                                // Find the associated catalog package in accounts memory to check if it's Modded or Grind
                                const pkg = accounts.find((a: any) => a.id === o.account_id);
                                const lowerPkgName = (pkg?.name || "").toLowerCase();
                                const isModded = lowerPkgName.includes("modded");
                                
                                if (isModded) {
                                  const max_replacements = pkg?.max_replacements || o.gcash_receipt_data?.max_replacements || 1;
                                  return (
                                    <>
                                      <p className="text-cyan-400 font-bold font-mono">🔄 Replacement: {o.replacements_count || 0}/{max_replacements} Claims</p>
                                      {o.last_replacement_at && (
                                        <p className="text-[7.5px] text-zinc-500 font-mono leading-tight">
                                          Last: {new Date(o.last_replacement_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                      )}
                                    </>
                                  );
                                } else {
                                  const max_refills = pkg?.max_refills || o.gcash_receipt_data?.max_refills || 1;
                                  return (
                                    <>
                                      <p className="text-amber-400 font-bold font-mono">🔋 Refills: {o.refills_count || 0}/{max_refills} Claims</p>
                                      {o.last_refill_at && (
                                        <p className="text-[7.5px] text-zinc-500 font-mono leading-tight">
                                          Last: {new Date(o.last_refill_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                      )}
                                    </>
                                  );
                                }
                              })()}
                            </div>
                          )}
                          {o.order_type !== "account" && (
                             <div className="pt-2 border-t border-zinc-900 mt-2">
                               <p className="text-[9px] text-zinc-700 italic">N/A - Resource Patcher</p>
                             </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono whitespace-nowrap">
                        <div className="space-y-0.5">
                          {o.gcash_ref_number || o.gcash_receipt_data?.reference_number || o.gcash_receipt_data?.gcash_ref_number ? (
                            <p className="text-white text-[11px] font-bold">
                              {o.gcash_ref_number || o.gcash_receipt_data?.reference_number || o.gcash_receipt_data?.gcash_ref_number}
                            </p>
                          ) : (
                            <p className="text-[#FF3333] text-[9px] font-bold uppercase p-0.5 bg-red-400/5 border border-red-500/20 rounded inline-block">
                              MISSING REF
                            </p>
                          )}
                          {o.gcash_receipt_data?.sender_name && (
                            <p className="text-[9px] text-zinc-500 font-sans tracking-wide">Sender: {o.gcash_receipt_data.sender_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[#FFD700] font-bold whitespace-nowrap">₱{Number(o.amount_paid).toFixed(2)}</td>
                      
                      {/* Receipt thumbnail linking clicking expands */}
                      <td className="p-4 whitespace-nowrap">
                        {o.gcash_receipt_data ? (
                          <button
                            onClick={() => {
                              setActiveReceiptUrl(o.gcash_receipt_url || "");
                              setActiveOcrData({
                                ...o.gcash_receipt_data,
                                decrypted_password: o.decrypted_password
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#111] hover:bg-[#222] text-zinc-400 hover:text-[#FFD700] rounded text-[10px] font-mono border border-zinc-800 transition-colors"
                          >
                            <Image className="w-3.5 h-3.5 text-zinc-400" />
                            <span>INSPECT OCR</span>
                          </button>
                        ) : (
                          <span className="text-zinc-700 italic">-</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1 max-w-[120px]">
                          {/* Account orders are automatic */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded font-bold tracking-widest ${
                              o.status === "completed" 
                                ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/20" 
                                : o.status === "paid" 
                                ? "bg-[#FFD700]/5 text-[#FFD700] border border-[#FFD700]/15" 
                                : o.status === "rejected"
                                ? "bg-red-500/5 text-red-400 border border-red-500/15"
                                : "bg-amber-500/5 text-amber-500 border border-amber-500/15"
                            }`}>
                              {o.status}
                            </span>
                          </div>

                          {/* Trigger actions manually for pending patch requests */}
                          {o.order_type === "patch" && o.status !== "completed" && o.status !== "rejected" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOrderStatusAction(o.id, "completed")}
                                className="px-2 py-1 text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase rounded-sm cursor-pointer transition-colors"
                              >
                                APPROVE
                              </button>
                              
                              <button
                                onClick={() => handleOrderStatusAction(o.id, "rejected")}
                                className="px-2 py-1 text-[9px] bg-[#FF3333] hover:bg-[#ff1a1a] text-white font-extrabold uppercase rounded-sm cursor-pointer transition-colors"
                              >
                                REJECT
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            disabled={deletingOrderId === o.id}
                            className={`mt-3 flex items-center justify-center gap-2 py-1.5 px-3 rounded border transition-all ${
                              deletingOrderId === o.id 
                                ? "bg-zinc-900 border-zinc-900 text-zinc-500 opacity-50 cursor-not-allowed" 
                                : confirmingDeleteId === o.id
                                ? "bg-red-600 border-red-500 text-white animate-pulse cursor-pointer shadow-[0_0_15px_-3px_rgba(220,38,38,0.5)]"
                                : "bg-zinc-950/50 border-zinc-900/50 text-zinc-500 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 cursor-pointer"
                            }`}
                          >
                            {deletingOrderId === o.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : confirmingDeleteId === o.id ? (
                                <Trash2 className="w-3.5 h-3.5" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[9px] font-mono font-black uppercase tracking-wider">
                              {deletingOrderId === o.id 
                                ? "Deleting..." 
                                : confirmingDeleteId === o.id 
                                ? "Confirm Erasure?" 
                                : "Delete Order"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRE-MADE ACCOUNTS */}
      {activeTab === "accounts" && (
        <div className="grid lg:grid-cols-12 gap-8 animate-fade-in" id="admin-tab-accounts">
          
          <div className="lg:col-span-12" id="account-assemble-form">
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 md:p-8 rounded space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#FFD700] flex items-center gap-2 font-mono">
                  <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-ping"></span>
                  {editingAccountId ? "Edit Stock Garage" : "Assemble Stock Garage"}
                </h2>
                {editingAccountId && (
                  <button 
                    onClick={() => {
                      setEditingAccountId(null);
                      setNewAccName("");
                      setNewAccEmail("");
                      setNewAccPassword("");
                      setNewAccSnapUrl("");
                      setNewAccImageUrl("");
                      setNewAccCarImages("");
                    }}
                    className="text-[9px] font-mono text-zinc-500 hover:text-white uppercase"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Storage Persistence Guide</span>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal">
                  To ensure images (Garage Vehicles & Receipts) never disappear after a server restart, you MUST:
                  <br />- 1. Create a bucket in <strong className="text-white">Supabase Storage</strong> named <strong className="text-white">package-images</strong>.
                  <br />- 2. Set the bucket to <strong className="text-white">Public</strong> in Supabase settings.
                  <br />- 3. Uploaded images will Then be hosted on Supabase CDN permanently.
                </p>
              </div>

              {isLocalUpload && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded flex items-start gap-3">
                  <span className="text-amber-500 text-lg">⚠</span>
                  <div>
                    <p className="text-[10px] font-mono text-amber-500 font-bold uppercase">Local Storage Detected</p>
                    <p className="text-[9px] text-zinc-400 leading-tight">Images are saving to the local server folder. These will disappear if the server restarts. Create a <strong className="text-white">package-images</strong> bucket in Supabase Storage for permanent persistence.</p>
                  </div>
                </div>
              )}

            <form onSubmit={handleAddAccount} className="space-y-4 font-sans text-xs text-zinc-400">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Account Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Level 45 Ultimate Garage"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-sm text-white rounded outline-none focus:border-[#FFD700] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Silver Balance</label>
                  <input
                    type="number"
                    value={newAccSilver}
                    onChange={(e) => setNewAccSilver(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Gold Balance</label>
                  <input
                    type="number"
                    value={newAccGold}
                    onChange={(e) => setNewAccGold(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Level XP</label>
                  <input
                    type="number"
                    value={newAccXp}
                    onChange={(e) => setNewAccXp(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Cars</label>
                  <input
                    type="number"
                    value={newAccCars}
                    onChange={(e) => setNewAccCars(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Maps Unl.</label>
                  <input
                    type="number"
                    value={newAccMaps}
                    onChange={(e) => setNewAccMaps(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Profile JSON Snapshot URL (Supabase)</label>
                <input
                  type="text"
                  placeholder="https://.../elite.json"
                  value={newAccSnapUrl}
                  onChange={(e) => setNewAccSnapUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Replacements Limit</label>
                  <select
                    value={newAccMaxReplacements}
                    onChange={(e) => setNewAccMaxReplacements(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono text-xs focus:border-[#FFD700]"
                  >
                    <option value={0}>No Free Replacements (0x)</option>
                    <option value={1}>1x Free Replacement</option>
                    <option value={2}>2x Free Replacements</option>
                    <option value={3}>3x Free Replacements</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Refills / Top-ups Limit</label>
                  <select
                    value={newAccMaxRefills}
                    onChange={(e) => setNewAccMaxRefills(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono text-xs focus:border-[#FFD700]"
                  >
                    <option value={0}>No Free Refills (0x)</option>
                    <option value={1}>1x Free Refill</option>
                    <option value={2}>2x Free Refills</option>
                    <option value={3}>3x Free Refills</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider font-mono">Inventory Display Image (Vehicle Theme)</label>
                <div className="flex gap-2">
                  <select
                    value={newAccImageUrl}
                    onChange={(e) => setNewAccImageUrl(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono text-xs focus:border-[#FFD700]"
                  >
                    <option value="">Default Tuner Fallback</option>
                    <option value="drift_car_pack_bg">Tokyo JDM Drift (Generated)</option>
                    <option value="hypercar_pack_bg">Minimalist Hypercar (Generated)</option>
                  </select>
                  <label className="cursor-pointer bg-[#FFD700] hover:bg-white text-black text-[10px] font-bold px-3 py-2 uppercase font-mono flex items-center justify-center rounded transition-colors select-none text-center">
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, false)}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Or paste custom image URL directly..."
                  value={newAccImageUrl}
                  onChange={(e) => setNewAccImageUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono text-[10px] mt-1"
                />
              </div>

              {/* NEW CAR INVENTORY IMAGES LIST */}
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider font-mono">Cars images in this package (comma-separated)</label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="https://link1.png, https://link2.png"
                    value={newAccCarImages}
                    onChange={(e) => setNewAccCarImages(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono text-[10px]"
                  />
                  <label className="cursor-pointer bg-zinc-900 border border-zinc-800 hover:border-[#FFD700] hover:bg-[#FFD700] hover:text-black text-[#E0E0E0] text-[10px] font-bold px-3 py-2 uppercase font-mono flex items-center justify-center rounded transition-colors select-none h-fit self-center">
                    {uploadingCar ? "Uploading..." : "+ Add Vehicle"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, true)}
                      className="hidden"
                      disabled={uploadingCar}
                    />
                  </label>
                </div>
                <p className="text-[8.5px] text-zinc-500 font-mono">
                  Paste URLs or select file uploads to list individual cars in this package. Buyers can click on packages inside the catalog to view this inventory.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Target ID Email</label>
                  <input
                    type="text"
                    required
                    placeholder="racer_target@carx.shop"
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Target ID Password</label>
                  <input
                    type="text"
                    required
                    placeholder="SecureCarXPass"
                    value={newAccPassword}
                    onChange={(e) => setNewAccPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-2 text-white rounded font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Retail Price (PHP equivalencies)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="299.00"
                  value={newAccPrice}
                  onChange={(e) => setNewAccPrice(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-base text-white font-mono font-bold"
                />
              </div>

              {accFormError && <p className="text-xs text-[#FF3333] font-mono">⚠ {accFormError}</p>}
              {accFormSuccess && <p className="text-xs text-emerald-400 font-mono">✓ Stock compiled successfully!</p>}

              <button
                type="submit"
                className={`w-full py-2.5 font-black uppercase text-xs font-mono tracking-wider transition-colors cursor-pointer ${editingAccountId ? "bg-cyan-500 hover:bg-white text-black" : "bg-[#FFD700] hover:bg-white text-black"}`}
              >
                {editingAccountId ? "COMMMIT GARAGE UPDATES" : "DEPLOY GARAGE UNIT"}
              </button>
            </form>
          </div>
        </div>

        {/* Catalog active grid */}
          <div className="lg:col-span-7 bg-[#0A0A0A] border border-[#1A1A1A] p-6 md:p-8 rounded space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              ACTIVE SQUAD STOCK LIST ({accounts.length})
            </h2>

            {accounts.length === 0 ? (
              <p className="text-zinc-500 font-mono text-xs text-center py-12">Catalogue remains empty.</p>
            ) : (
              <div className="divide-y divide-[#1A1A1A] max-h-[500px] overflow-y-auto pr-3 space-y-3 pt-2">
                {accounts.map((a) => (
                  <div key={a.id} className="py-3 flex justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-white font-sans">{a.name}</strong>
                        {a.is_sold ? (
                          <span className="text-[8px] font-mono uppercase bg-black text-zinc-600 border border-zinc-900 px-1.5 py-0.5 rounded">SOLD</span>
                        ) : (
                          <span className="text-[8px] font-mono bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded">STOCK</span>
                        )}
                        <span className="text-xs font-mono font-bold text-[#FFD700]">₱{Number(a.price).toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        Level: {a.xp} XP | Silver: {formatResourceQuantity(a.silver)} | Gold: {formatResourceQuantity(a.gold)} | snapshot Url: {a.snapshot_url ? "YES" : "NO"}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] text-cyan-400 font-mono bg-cyan-400/5 px-2 py-0.5 border border-cyan-400/10 rounded uppercase font-bold">
                          {a.max_replacements || 0}x Replacements
                        </span>
                        <span className="text-[9px] text-amber-400 font-mono bg-amber-400/5 px-2 py-0.5 border border-amber-400/10 rounded uppercase font-bold">
                          {a.max_refills || 0}x Refills
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-400 mt-1 font-mono bg-black px-2 py-0.5 border border-zinc-900 rounded inline-block">
                        🔐 logins: {a.decoded_credentials}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAccount(a)}
                        className="p-2.5 bg-black hover:bg-cyan-500/15 hover:border-cyan-500/30 border border-[#222] text-zinc-600 hover:text-cyan-400 transition-colors rounded cursor-pointer"
                        title="Edit Account"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(a.id)}
                        className="p-2.5 bg-black hover:bg-[#FF3333]/15 hover:border-[#FF3333]/30 border border-[#222] text-zinc-600 hover:text-[#FF3333] transition-colors rounded cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PATCH PRICING PHP LEVEL CONFIGURATOR */}
      {activeTab === "pricing" && (
        <div className="max-w-3xl mx-auto bg-[#0A0A0A] border border-[#1A1A1A] p-6 md:p-8 rounded space-y-6" id="admin-tab-pricing">
          <div className="border-b border-zinc-900 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">PATCH FORMULA PRICING DECK</h2>
            <p className="text-zinc-500 text-[10px] font-mono mt-1 leading-relaxed">
              * Set pricing rules in PHP. The AI engine references this list to evaluate user transfers in OCR receipts screenshot verification checks.
            </p>
          </div>

          <div className="divide-y divide-zinc-900">
            {patchPricing.map((item) => (
              <div key={item.patch_type} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase font-sans">{item.label}</h4>
                  <p className="text-xs text-zinc-500 leading-normal max-w-md font-sans">{item.description}</p>
                  <span className="text-[9px] font-mono bg-black border border-zinc-920 border-zinc-900 px-1.5 py-0.5 text-zinc-500 rounded uppercase font-bold inline-block mt-1">
                    alias code: {item.patch_type}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-sm font-mono text-zinc-500">₱</span>
                  <input
                    type="number"
                    value={editPrices[item.patch_type] || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditPrices((prev) => ({ ...prev, [item.patch_type]: val }));
                    }}
                    className="w-24 bg-zinc-950 border border-zinc-900 p-1.5 text-center text-sm font-mono text-[#FFD700] rounded font-bold"
                  />
                  <button
                    onClick={() => handleSavePatchPrice(item.patch_type)}
                    disabled={savingPriceMap[item.patch_type]}
                    className="px-3 py-1.5 bg-[#FFD700] hover:bg-white text-black font-extrabold uppercase font-mono text-[10px] rounded transition-colors cursor-pointer"
                  >
                    {savingPriceMap[item.patch_type] ? "SAVING..." : "SAVE"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMANCE STATISTICS */}
      {activeTab === "stats" && (
        <div className="space-y-8 animate-fade-in" id="admin-tab-stats">
          {!stats ? (
            <p className="text-xs font-mono py-12 text-zinc-500 text-center uppercase">REBUFERING STATISTICAL DECK...</p>
          ) : (
            <div className="space-y-8">
              {/* Highlight Metrics */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric Card 1 */}
                <div className="p-6 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1.5">GLOBAL CASH REVENUES</span>
                    <strong className="text-3xl font-black italic uppercase text-white tracking-tighter text-[#FFD700]">₱{stats.totalRevenue.toLocaleString()}</strong>
                  </div>
                  <Coins className="w-6 h-6 text-[#FFD700] animate-bounce" />
                </div>

                {/* Metric Card 2 */}
                <div className="p-6 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1.5">DAILY DEPLOYMENTS</span>
                    <strong className="text-3xl font-black italic uppercase text-white tracking-tighter">{stats.ordersToday}</strong>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-[#FF3333]" />
                </div>

                {/* Metric Card 3 */}
                <div className="p-6 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1.5">CATALOG STOCK</span>
                    <strong className="text-3xl font-black italic uppercase text-white tracking-tighter">{stats.activeAccountsCount}</strong>
                  </div>
                  <Database className="w-6 h-6 text-cyan-400" />
                </div>

                {/* Metric Card 4 */}
                <div className="p-6 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1.5">TOTAL SOLD UNITS</span>
                    <strong className="text-3xl font-black italic uppercase text-white tracking-tighter">{stats.soldAccountsCount}</strong>
                  </div>
                  <Layers className="w-6 h-6 text-zinc-400" />
                </div>
              </div>

              {/* Aggregation visual bars */}
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded relative overflow-hidden">
                <h3 className="text-xs font-mono font-bold text-white mb-6 uppercase tracking-wider">
                  📈 DISPATCH QUEUE STATISTICS
                </h3>

                <div className="grid md:grid-cols-2 gap-8 items-center bg-black border border-zinc-900 p-6 rounded">
                  <div className="space-y-4 font-mono text-[11px] text-zinc-400">
                    <p className="font-bold text-[#FFD700] uppercase mb-1">State Breakdown Aggregators:</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Fulfillments:</span>
                        <strong className="text-white">{stats.ordersCount.completed}</strong>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(stats.ordersCount.completed / Math.max(orders.length, 1)) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Paid Queues:</span>
                        <strong className="text-white">{stats.ordersCount.paid}</strong>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded overflow-hidden">
                        <div className="h-full bg-[#FFD700]" style={{ width: `${(stats.ordersCount.paid / Math.max(orders.length, 1)) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Pending Submissions:</span>
                        <strong className="text-white">{stats.ordersCount.pending}</strong>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${(stats.ordersCount.pending / Math.max(orders.length, 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-900 rounded p-6 text-center space-y-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">SECURITY AUDIT PASS</p>
                    <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                      AI OCR Receipt algorithms and dynamic parameters validation systems running safely. Zero server failures in active logs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SYSTEM CONFIGURATION SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-[#0A0A0A] border border-[#1A1A1A] p-6 md:p-8 rounded space-y-6" id="admin-tab-settings">
          <div className="border-b border-zinc-900 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">RESELLER SYSTEM CONFIGURATOR</h2>
            <p className="text-zinc-500 text-[10px] font-mono mt-1">Configure payment credentials, external support routes, and toggle page operational indicators.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 font-mono text-[11px] text-zinc-400">
            {/* GCash Phone Number */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Receiver Account Name</label>
                <input
                  type="text"
                  required
                  value={settings.gcash_name || ""}
                  onChange={(e) => setSettings({ ...settings, gcash_name: e.target.value })}
                  placeholder="e.g. KA•L A."
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-sm text-[#FFD700] font-bold outline-none focus:border-[#FFD700]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Receiver Account Number</label>
                <input
                  type="text"
                  required
                  value={settings.gcash_number}
                  onChange={(e) => setSettings({ ...settings, gcash_number: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-sm text-white font-bold outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>

            {/* GCash QR Code URL */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Payment QR Code Image URL</label>
              <input
                type="text"
                required
                value={settings.gcash_qr_url}
                onChange={(e) => setSettings({ ...settings, gcash_qr_url: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-900 p-2 text-xs text-white"
              />
            </div>

            {/* Telegram Support BOT link */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Telegram Reseller Support Bot Link</label>
              <input
                type="text"
                required
                value={settings.telegram_link}
                onChange={(e) => setSettings({ ...settings, telegram_link: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-900 p-2 text-xs text-white"
              />
            </div>

            {/* Stores Toggles */}
            <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-5">
              
              {/* Online/Offline status */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-[10px] font-bold text-white uppercase mb-1">RESELLER OFFLINE MODE</h4>
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    Toggling this mode shows a red banner informing customers that automatic registration is briefly sleeping.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className="inline-flex items-center gap-2 self-start text-[#FFD700] hover:text-white"
                >
                  {settings.is_online === "true" ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase"><ToggleRight className="w-5 h-5" /> GATEWAY LIVE</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#FF3333] font-bold uppercase"><ToggleLeft className="w-5 h-5" /> GATEWAY SLEEP</span>
                  )}
                </button>
              </div>

              {/* Maintenance mode */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-[10px] font-bold text-white uppercase mb-1">MAINTENANCE CALIBRATION</h4>
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    Shows a diagnostic overlay locking out navigation pages on the Home path during version releases.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  className="inline-flex items-center gap-2 self-start text-[#FF3333] hover:text-white"
                >
                  {settings.maintenance_mode === "true" ? (
                    <span className="flex items-center gap-1.5 text-[#FF3333] font-bold uppercase"><ToggleRight className="w-5 h-5" /> UNDER CALIBRATION</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase"><ToggleLeft className="w-5 h-5" /> STANDBY NORMAL</span>
                  )}
                </button>
              </div>
            </div>

            {settingsSuccess && <p className="text-xs text-emerald-400 font-bold">✓ Reseller systems updated successfully!</p>}

            <button
              type="submit"
              disabled={updatingSettings}
              className="w-full py-3 bg-[#FF3333] hover:bg-white text-white hover:text-black font-black uppercase text-xs transition-colors cursor-pointer"
            >
              {updatingSettings ? "PROPAGATING PARAMETERS..." : "COMMIT GLOBAL SETTINGS"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: SYSTEM ALERTS AND LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-6" id="admin-tab-logs">
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded">
            <div className="border-b border-zinc-900 pb-4 mb-6">
              <h2 className="text-sm font-mono font-bold text-[#FFD700] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FFD700] animate-pulse" />
                🚨 LIVE OCR SYSTEM ALERTS & TELEMETRY QUEUE
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-sans leading-relaxed">
                These notifications and telemetry events are generated and stored automatically whenever client receipt scanner checks fail, validation anomalies occur, or cloner pipeline exceptions trigger. Directly click on m.me links or details to assist customers manually.
              </p>
            </div>

            {!stats?.system_logs || stats.system_logs.length === 0 ? (
              <div className="p-12 text-center bg-black border border-zinc-900 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-[#FFD700] mx-auto opacity-75 mb-3" />
                <p className="font-mono text-zinc-400 text-xs uppercase font-bold tracking-wider">
                  ✓ ALL CHANNELS NOMINAL — ZERO FAILURES REGISTERED
                </p>
                <p className="text-[10px] text-zinc-500 mt-2 font-sans max-w-sm mx-auto leading-relaxed">
                  The automated OpenRouter/Gemini receipt scanning engine has completed all transactions with pristine integrity.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...stats.system_logs].reverse().map((log: any, idx: number) => {
                  const isScanFail = log.type === "GCASH_SCAN_FAILED";
                  return (
                    <div 
                      key={log.id || idx} 
                      className={`p-4 border rounded bg-black flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-zinc-950/40 ${
                        isScanFail ? "border-[#FF3333]/20 hover:border-[#FF3333]/40" : "border-yellow-500/20 hover:border-yellow-500/40"
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase rounded ${
                            isScanFail ? "bg-[#FF3333]/10 text-[#FF3333]" : "bg-yellow-500/10 text-[#FFD700]"
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-zinc-200 text-xs font-mono leading-relaxed select-text">
                          {log.message}
                        </p>

                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-950">
                          {log.fileName && (
                            <span className="flex items-center gap-1">
                              📁 FILE: <strong className="text-zinc-300">{log.fileName}</strong>
                            </span>
                          )}
                          {log.expectedAmount && (
                            <span className="flex items-center gap-1">
                              💰 ASKED PRICE: <strong className="text-zinc-300">₱{log.expectedAmount} PHP</strong>
                            </span>
                          )}
                          {log.orderId && (
                            <span className="flex items-center gap-1">
                              📦 ORDER NO: <strong className="text-[#FFD700]">{log.orderId}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center">
                        <a 
                          href="https://m.me/lark.abalunan.1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-[#FFD700] hover:text-black hover:border-transparent border border-zinc-800 rounded font-mono text-[9px] text-zinc-300 uppercase font-black tracking-wider transition-all animate-pulse"
                        >
                          💬 MESSAGE CUSTOMER
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded visual receipt inspection OCR overlay Modal */}
      <AnimatePresence>
        {activeReceiptUrl !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveReceiptUrl(null);
                setActiveOcrData(null);
              }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-3xl rounded bg-black border border-zinc-800 p-6 flex flex-col md:flex-row gap-6"
            >
              {/* Image box */}
              <div className="w-full md:w-1/2 rounded bg-zinc-950 border border-zinc-900 p-2 flex flex-col items-center justify-center aspect-[5/7] max-h-[450px]">
                {activeReceiptUrl ? (
                  <img
                    src={activeReceiptUrl}
                    alt="GCash Paid Screenshot"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-zinc-650 font-mono text-xs uppercase italic flex flex-col items-center gap-2">
                    <Image className="w-8 h-8 text-zinc-700 animate-pulse" />
                    <span>Receipt payload was passed directly via Base64 stream (Not permanently stored)</span>
                  </div>
                )}
              </div>

              {/* Extracted Details metadata */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div className="space-y-5">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">
                      PARSER PIPELINE
                    </span>
                    <h3 className="text-lg font-black italic uppercase text-white tracking-widest font-mono">
                      GEMINI AI OCR EXTRACTION
                    </h3>
                  </div>

                  <div className="space-y-3 font-mono text-xs text-zinc-400 bg-zinc-950 border border-zinc-900 p-4 rounded-sm">
                    <div>
                      <span className="text-zinc-600 block text-[9px] font-bold">GCASH SENDER NAME</span>
                      <strong className="text-white text-sm">{activeOcrData?.sender_name || "NOT EXTRACTABLE"}</strong>
                    </div>

                    <div className="border-t border-zinc-900 pt-2">
                      <span className="text-zinc-600 block text-[9px] font-bold">TRANSACTION REFERENCE NO</span>
                      <strong className="text-emerald-400 font-mono text-sm">{activeOcrData?.reference_number || "NOT EXTRACTABLE"}</strong>
                    </div>

                    <div className="border-t border-zinc-900 pt-2">
                      <span className="text-zinc-600 block text-[9px] font-bold">IDENTIFIED PAID AMOUNT (PHP)</span>
                      <strong className="text-[#FFD700] text-base">₱{Number(activeOcrData?.amount_php || 0).toFixed(2)}</strong>
                    </div>

                    <div className="border-t border-zinc-900 pt-2">
                      <span className="text-zinc-600 block text-[9px] font-bold">TRANSACTION TIMESTAMP</span>
                      <strong className="text-white">{activeOcrData?.datetime || "NOT EXTRACTABLE"}</strong>
                    </div>

                    <div className="border-t border-zinc-900 pt-2">
                      <span className="text-zinc-600 block text-[9px] font-bold">RECIPIENT CHANNEL</span>
                      <strong className="text-zinc-500 uppercase">{activeOcrData?.recipient || "STORE MANUAL ENTRY"}</strong>
                    </div>

                    {activeOcrData?.decrypted_password && (
                      <div className="border-t border-zinc-900 pt-2 bg-[#FF3333]/5 p-2 rounded">
                        <span className="text-[#FF3333] block text-[9px] font-bold">DECRYPTED PASSWORD</span>
                        <strong className="text-white font-mono break-all selection:bg-[#FF3333] selection:text-white">{activeOcrData.decrypted_password}</strong>
                      </div>
                    )}

                    {activeOcrData?.carx_id && (
                      <div className="border-t border-zinc-900 pt-2">
                        <span className="text-cyan-600 block text-[9px] font-bold">CARX ID</span>
                        <strong className="text-cyan-400 font-mono text-[10px]">{activeOcrData.carx_id}</strong>
                      </div>
                    )}

                    {activeOcrData?.refresh_token && (
                      <div className="border-t border-zinc-900 pt-2">
                        <span className="text-zinc-600 block text-[9px] font-bold">REFRESH TOKEN</span>
                        <div className="max-h-20 overflow-y-auto mt-1 p-1 bg-black rounded border border-zinc-900">
                          <p className="text-[8px] text-zinc-500 font-mono break-all">{activeOcrData.refresh_token}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 text-right">
                  <button
                    onClick={() => {
                      setActiveReceiptUrl(null);
                      setActiveOcrData(null);
                    }}
                    className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:text-white rounded font-mono text-xs uppercase"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Order Registration Modal */}
      <AnimatePresence>
        {showManualOrderModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !manualOrderLoading && setShowManualOrderModal(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl bg-[#0A0A0A] border border-zinc-800 p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#FFD700]/5 blur-3xl rounded-full" />
              
              <div className="relative mb-6">
                <h2 className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2.5">
                  <Plus className="w-5 h-5 text-[#FFD700]" />
                  Internal Order Registration
                </h2>
                <p className="text-zinc-500 text-[10px] font-mono mt-1 uppercase tracking-widest font-bold">Manual Backend Entry System</p>
              </div>

              <form onSubmit={handleCreateManualOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Customer Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@email.com"
                    value={manualOrderEmail}
                    onChange={(e) => setManualOrderEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-lg text-sm text-white font-mono focus:border-[#FFD700] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">13-Digit GCash Ref Number</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    placeholder="2039 1827 3645 1"
                    value={manualOrderRef}
                    onChange={(e) => setManualOrderRef(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-lg text-sm text-white font-mono focus:border-[#FFD700] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Order Category</label>
                    <select
                      value={manualOrderType}
                      onChange={(e) => setManualOrderType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-lg text-sm text-white font-mono focus:border-[#FFD700] transition-colors"
                    >
                      <option value="account">ACCOUNT UNIT</option>
                      <option value="patch">INJECTION PATCH</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Price Paid (PHP)</label>
                    <input
                      type="number"
                      required
                      placeholder="299.00"
                      value={manualOrderAmount}
                      onChange={(e) => setManualOrderAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-lg text-sm text-[#FFD700] font-mono font-bold focus:border-[#FFD700] transition-colors"
                    />
                  </div>
                </div>

                {manualOrderType === "account" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Link Package Unit</label>
                    <select
                      value={manualOrderAccountId}
                      onChange={(e) => setManualOrderAccountId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-lg text-sm text-white font-mono focus:border-[#FFD700] transition-colors"
                    >
                      <option value="">Select Account Unit...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (₱{a.price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {manualOrderType === "patch" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Inject Formula Type</label>
                    <select
                      value={manualOrderPatchType}
                      onChange={(e) => setManualOrderPatchType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-lg text-sm text-white font-mono focus:border-[#FFD700] transition-colors"
                    >
                      <option value="">Select Patch Type...</option>
                      {patchPricing.map(p => (
                        <option key={p.patch_type} value={p.patch_type}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {manualOrderError && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-[#FF3333] font-mono bg-[#FF3333]/5 border border-[#FF3333]/15 p-3 rounded-lg"
                  >
                    ⚠ {manualOrderError}
                  </motion.p>
                )}

                {manualOrderSuccess && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs text-emerald-400 font-mono bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-lg text-center font-bold"
                  >
                    ✓ ORDER REGISTERED IN DATABASE
                  </motion.p>
                )}

                <div className="flex gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowManualOrderModal(false)}
                    disabled={manualOrderLoading}
                    className="flex-1 py-3 border border-zinc-900 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-[10px] tracking-widest transition-colors rounded-lg font-mono"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    disabled={manualOrderLoading || !manualOrderRef || !manualOrderEmail}
                    className={`flex-1 py-3 bg-[#FFD700] hover:bg-white text-black font-black uppercase text-[10px] tracking-widest transition-colors rounded-lg font-mono flex items-center justify-center gap-2 ${manualOrderLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {manualOrderLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "DEPLOY ORDER"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
