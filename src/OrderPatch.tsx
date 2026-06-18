import React, { useState, useEffect } from "react";
import { ShieldCheck, Mail, Key, User, Flame, Loader2, Sparkles, QrCode, UploadCloud, Copy, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatResourceQuantity } from "./utils";

interface OrderPatchProps {
  onNavigate: (view: string, arg?: string) => void;
  viewParam?: any;
}

import PaymentWizard from "./components/PaymentWizard";

export default function OrderPatch({ onNavigate, viewParam }: OrderPatchProps) {
  const [carxEmail, setCarxEmail] = useState("");
  const [carxPassword, setCarxPassword] = useState("");
  const [selectedPatchType, setSelectedPatchType] = useState("ban_safe_t1");
  const [selectedBackupPath, setSelectedBackupPath] = useState<string | null>(null);
  const [isBanSafeDropdownOpen, setIsBanSafeDropdownOpen] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(carxEmail);
  const isFormValid = isEmailValid && carxPassword.trim().length > 0;
  
  const [banSafeTiers, setBanSafeTiers] = useState([
    { id: "ban_safe_t1", label: "Ban Safe (1.6M Silver & 1,750 Gold)", price: 100.00, silver: 1600000, gold: 1750 },
    { id: "ban_safe_t2", label: "Ban Safe (2.5M Silver & 2,900 Gold)", price: 150.00, silver: 2500000, gold: 2900 },
    { id: "ban_safe_t3", label: "Ban Safe (4M Silver & 4,000 Gold)", price: 200.00, silver: 4000000, gold: 4000 },
    { id: "ban_safe_t4", label: "Ban Safe (6M Silver & 6,000 Gold)", price: 250.00, silver: 6000000, gold: 6000 },
    { id: "ban_safe_t5", label: "Ban Safe (8M Silver & 8,000 Gold)", price: 300.00, silver: 8000000, gold: 8000 },
    { id: "ban_safe_t6", label: "Ban Safe (10M Silver & 10,000 Gold)", price: 350.00, silver: 10000000, gold: 10000 },
  ]);
  const [garageCars, setGarageCars] = useState<any[]>([]);
  const [isLoadingGarage, setIsLoadingGarage] = useState(false);
  const [garageError, setGarageError] = useState<string | null>(null);

  // Master Catalog States
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Custom states that trigger on selective packs
  const [customSilver, setCustomSilver] = useState(20000000);
  const [customGold, setCustomGold] = useState(10000);
  const [carId, setCarId] = useState("");

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Wizard State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [verifyingCredentials, setVerifyingCredentials] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState("");

  // Load Pricing and settings configuration live on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load Pricing
        const pricingResp = await fetch("/api/patch-pricing");
        if (pricingResp.ok) {
          let p = await pricingResp.json();
          
          // Filter out restore service from regular patcher
          const filteredServices = p.filter((s: any) => s.patch_type !== "restore");
          setServices(filteredServices);

          // Synchronize banSafeTiers prices and labels from DB
          setBanSafeTiers(prev => prev.map(tier => {
            const dbPriceInfo = p.find((s: any) => s.patch_type === tier.id);
            if (dbPriceInfo) {
              return { 
                ...tier, 
                price: Number(dbPriceInfo.price),
                label: dbPriceInfo.label
              };
            }
            return tier;
          }));

          if (filteredServices.length > 0) {
            setSelectedPatchType(filteredServices[0].patch_type);
          }
        }

        // Load Master Catalog
        loadCatalog();
      } catch (err: any) {
        setError("Error synchronizing active patch definitions: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    async function loadCatalog() {
      try {
        setIsLoadingCatalog(true);
        setCatalogError(null);
        const resp = await fetch("/api/master-catalog");
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Failed to retrieve master catalog");
        setMasterCatalog(data.catalog || []);
      } catch (err: any) {
        setCatalogError(err.message);
      } finally {
        setIsLoadingCatalog(false);
      }
    }

    loadData();
  }, []);

  // Fetch garage data when credentials and patch type are valid
  useEffect(() => {
    let isMounted = true;
    const fetchGarage = async () => {
      if (!carxEmail || !carxPassword) return;
      if (selectedPatchType !== "inject_car" && selectedPatchType !== "max_nitro") return;

      try {
        setIsLoadingGarage(true);
        setGarageError(null);
        const resp = await fetch("/api/get-garage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: carxEmail, password: carxPassword })
        });
        
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Failed to fetch garage data");

        if (isMounted) {
          setGarageCars(data.cars || []);
          if (data.cars && data.cars.length > 0) {
            setCarId(data.cars[0].car_id);
          }
        }
      } catch (err: any) {
        if (isMounted) setGarageError(err.message);
      } finally {
        if (isMounted) setIsLoadingGarage(false);
      }
    };

    const timeoutId = setTimeout(fetchGarage, 500); // Debounce
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [carxEmail, carxPassword, selectedPatchType]);

  const currentService = services.find((s) => s.patch_type === selectedPatchType) || 
    banSafeTiers.find(t => t.id === selectedPatchType) || {
    patch_type: "ban_safe_t1",
    label: "Ban Safe (1.6M Silver & 1,750 Gold)",
    price: 100,
    description: "1.6M Silver + 1,750 Gold"
  };

  const handleOpenPaymentWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation check before allowing the wizard to open
    if (!isFormValid) {
      if (!carxEmail || !isEmailValid) {
        setError("⚠️ A valid email address is required to proceed with the patch injection.");
      } else if (!carxPassword.trim()) {
        setError("⚠️ Your account password is required for the injection synchronization.");
      }
      return;
    }

    if ((selectedPatchType === "inject_car" || selectedPatchType === "max_nitro") && !carId) {
      setError("Please specify the Car ID / Model description target for injecting.");
      return;
    }

    if (selectedPatchType === "restore" && !selectedBackupPath) {
      setError("Restore mode is now managed directly in the Cloud Vault dashboard.");
      return;
    }

    // NEW: Live Credential Verification Step
    try {
      setVerifyingCredentials(true);
      const verifyResp = await fetch("/api/verify-carx-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: carxEmail, password: carxPassword })
      });
      
      const verifyData = await verifyResp.json();
      if (!verifyResp.ok) {
        throw new Error(verifyData.error || "Login Verification Failed");
      }

      // Success! Proceed to payment
      setIsPayModalOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to verify game account sync details.");
      // Scroll to error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setVerifyingCredentials(false);
    }
  };

  const currentCustomDetails = () => {
    if (selectedPatchType === "custom_resources") return { silver: Number(customSilver), gold: Number(customGold), xp: 0 };
    if (selectedPatchType.startsWith("ban_safe_")) {
      const tier = banSafeTiers.find(t => t.id === selectedPatchType);
      return { silver: tier?.silver || 0, gold: tier?.gold || 0, xp: 0 };
    }
    if (selectedPatchType === "max_nitro" || selectedPatchType === "inject_car") return { car_id: carId };
    if (selectedPatchType === "restore") return { backupPath: selectedBackupPath };
    return {};
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 animate-fade-in" id="patch-order-view">
      <div className="text-center md:text-left mb-12">
        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">
          COCKPIT <span className="text-[#FFD700]">RESOURCE</span> PATCHER
        </h1>
        <p className="text-zinc-500 font-sans max-w-2xl text-xs md:text-sm leading-relaxed">
          Inject premium configurations into your active iOS/Android CarX Street games. Logins are encrypted end-to-end on our secure servers, and deleted on success.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <p className="font-mono text-[10px] text-zinc-500 tracking-wider">RETRIEVING DYNAMIC FORMS MATRIX...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form config & parameters */}
          <div className="lg:col-span-7 bg-[#0A0A0A] border border-[#1A1A1A] rounded p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#FF3333]/5 blur-3xl rounded-full" />
            
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#FFD700] mb-6 border-b border-zinc-900 pb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]"></span>
              Configure Player Node Setup
            </h2>

            <form onSubmit={handleOpenPaymentWizard} className="space-y-6">
              {/* Game Login Profile Email */}
              <div className="space-y-1.5">
                <label htmlFor="carx-email" className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">
                  CARX LOGIN EMAIL / ID <span className="text-[#FF3333]">*</span>
                </label>
                <input
                  id="carx-email"
                  type="text"
                  required
                  placeholder="email address"
                  value={carxEmail}
                  onChange={(e) => setCarxEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-sm outline-none focus:border-[#FFD700] text-white transition-all font-mono rounded-sm"
                />
                {carxEmail && !isEmailValid && (
                  <p className="text-[10px] text-[#FF3333] font-mono mt-1 font-bold animate-pulse">
                    ⚠️ Please enter a valid email address (e.g., name@email.com) before verifying.
                  </p>
                )}
              </div>

              {/* Game Account Secret Code Password */}
              <div className="space-y-1.5">
                <label htmlFor="carx-pass" className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider flex justify-between items-center">
                  <span>CARX GAME ACCOUNT PASSWORD <span className="text-[#FF3333]">*</span></span>
                  <span className="text-zinc-650 text-[8px] uppercase tracking-wider font-semibold text-emerald-400">
                    🛡 AES KEY SYSTEM SECURE
                  </span>
                </label>
                <input
                  id="carx-pass"
                  type="password"
                  required
                  placeholder="••••••••••••••"
                  value={carxPassword}
                  onChange={(e) => setCarxPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-sm outline-none focus:border-[#FFD700] text-white transition-all font-mono rounded-sm"
                />
              </div>

              {/* Patch Selector List Grid */}
              <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">
                  Select Patch Service Formula
                </label>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* GROUPED BAN-SAFE BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsBanSafeDropdownOpen(!isBanSafeDropdownOpen);
                      if (!selectedPatchType.startsWith("ban_safe_")) {
                        setSelectedPatchType("ban_safe_t1");
                      }
                      setError(null);
                    }}
                    className={`text-left p-4 rounded border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      selectedPatchType.startsWith("ban_safe_")
                        ? "bg-[#FFD700]/5 border-[#FFD700] text-white shadow-[0_0_15px_rgba(255,215,0,0.05)]"
                        : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-mono uppercase bg-black px-1.5 py-0.5 rounded border border-[#1A1A1A] text-[#FFD700] font-bold">
                          PROTECTED LINE
                        </span>
                        <ShieldCheck className={`w-3.5 h-3.5 ${selectedPatchType.startsWith("ban_safe_") ? "text-[#FFD700]" : "text-zinc-600"}`} />
                      </div>
                      <h4 className="font-bold text-xs text-white tracking-wide leading-none uppercase">
                        🛡️ BAN-SAFE RESOURCES
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-sans mt-2 leading-relaxed">
                        Grouped high-stability resource injections with zero ban risk metrics.
                      </p>
                    </div>
                  </button>

                  {/* OTHER SERVICES (Excluding individual Ban-Safe buttons) */}
                  {services.filter(s => !s.patch_type.startsWith("ban_safe_")).map((serv) => (
                    <button
                      type="button"
                      key={serv.patch_type}
                      onClick={() => {
                        setSelectedPatchType(serv.patch_type);
                        setIsBanSafeDropdownOpen(false);
                        setError(null);
                      }}
                      className={`text-left p-4 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedPatchType === serv.patch_type
                          ? "bg-[#FFD700]/5 border-[#FFD700] text-white"
                          : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[8px] font-mono uppercase bg-black px-1.5 py-0.5 rounded border border-[#1A1A1A] text-zinc-500 font-bold">
                            FORMULA MODE
                          </span>
                          <strong className="text-xs font-mono text-[#FFD700]">₱{Number(serv.price).toFixed(2)}</strong>
                        </div>
                        <h4 className="font-bold text-xs text-white tracking-wide leading-none uppercase">
                          {serv.label}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-2 leading-relaxed">
                          {serv.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Restore Meta Display */}
                {selectedPatchType === "restore" && selectedBackupPath && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-[#FFD700]/5 border border-[#FFD700]/30 rounded-sm space-y-2"
                  >
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono font-black text-[#FFD700] uppercase tracking-widest leading-none">TARGET SNAPSHOT LOADED</span>
                       <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
                    </div>
                    <div className="font-mono text-[9px] text-zinc-400 truncate">
                       DISK_PATH: {selectedBackupPath}
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-relaxed italic">
                      Proceeding will inject the resources from this specific cloud identity into the destination account provided above.
                    </p>
                  </motion.div>
                )}

                {/* NESTED BAN-SAFE SELECTION SUB-MENU */}
                <AnimatePresence>
                  {(selectedPatchType.startsWith("ban_safe_") || isBanSafeDropdownOpen) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-black border border-[#FFD700]/20 rounded p-4 mt-2 grid gap-2"
                    >
                      <span className="text-[9px] font-mono font-black text-[#FFD700] uppercase tracking-widest block mb-1">
                        Select Injection Tier:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {banSafeTiers.map((tier) => (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatchType(tier.id);
                              setError(null);
                            }}
                            className={`text-left px-3 py-2.5 rounded border text-[10px] uppercase font-bold tracking-tight transition-all flex justify-between items-center ${
                              selectedPatchType === tier.id
                                ? "bg-[#FFD700] border-[#FFD700] text-black"
                                : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <span>{tier.label.split(' — ')[0]}</span>
                            <span className="font-mono">₱{tier.price.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dynamic Custom Configuration sliders / parameters */}
              {(selectedPatchType === "custom_resources" || selectedPatchType === "max_level") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-black border border-zinc-900 p-5 rounded space-y-4"
                >
                  <div className="text-[10px] font-mono font-bold text-[#FFD700] uppercase tracking-wider border-b border-zinc-900 pb-2">
                    {selectedPatchType === "max_level" ? "⚡ AUTOMATED LEVEL INJECTION ACTIVE" : "🛠 Set target resource limits (Unlimited Sandbox)"}
                  </div>

                  {selectedPatchType === "max_level" ? (
                    <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-900 rounded">
                      <Sparkles className="w-4 h-4 text-[#FFD700]" />
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-relaxed">
                        Purchasing this pack will instantly set account Level to <span className="text-white">MAX (Value: 93060)</span>. Currency values remain unchanged.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Custom Silver Slider */}
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                            <span>SILVER OVERRIDE</span>
                            <strong className="text-white">{formatResourceQuantity(customSilver)}</strong>
                          </div>
                          <input
                            type="range"
                            min={1000000}
                            max={50000000}
                            step={1000000}
                            value={customSilver}
                            onChange={(e) => setCustomSilver(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#FFD700]"
                          />
                        </div>

                        {/* Custom Gold Slider */}
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                            <span>GOLD CALIBRATOR</span>
                            <strong className="text-white">{formatResourceQuantity(customGold)}</strong>
                          </div>
                          <input
                            type="range"
                            min={500}
                            max={30000}
                            step={500}
                            value={customGold}
                            onChange={(e) => setCustomGold(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#FFD700]"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Custom Car OR Max Nitro target Car spec */}
              {(selectedPatchType === "inject_car" || selectedPatchType === "max_nitro") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-black border border-zinc-900 p-5 rounded space-y-4"
                >
                  <label htmlFor="input-car-spec" className="block text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">
                    {selectedPatchType === "inject_car" ? "🏁 SELECT VEHICLE FROM MASTER CATALOG" : "✍ SELECT TARGET VEHICLE FROM GARAGE"}
                  </label>

                  {selectedPatchType === "inject_car" ? (
                    isLoadingCatalog ? (
                      <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-900 rounded">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest text-[#FFD700]">Booting Master Catalog...</span>
                      </div>
                    ) : catalogError ? (
                      <div className="p-3 bg-red-500/5 border border-red-500/10 rounded text-[10px] text-red-400 font-mono italic">
                        ⚠ ERROR: {catalogError}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {masterCatalog.map((car) => (
                          <div
                            key={car.car_id}
                            onClick={() => setCarId(car.car_id)}
                            className={`p-2 rounded border transition-all cursor-pointer group flex flex-col gap-2 ${
                              carId === car.car_id 
                                ? "bg-[#FFD700]/10 border-[#FFD700]" 
                                : "bg-zinc-950 border-zinc-900 hover:border-zinc-800"
                            }`}
                          >
                            <div className="aspect-video bg-zinc-900 rounded overflow-hidden relative">
                              {car.image_url ? (
                                <img 
                                  src={car.image_url} 
                                  alt={car.name} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Sparkles className="w-4 h-4 text-zinc-800" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] p-1 text-[8px] font-mono text-zinc-400">
                                ID: {car.car_id}
                              </div>
                            </div>
                            <div className={`text-[9px] font-bold uppercase truncate ${carId === car.car_id ? "text-white" : "text-zinc-500"}`}>
                              {car.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    isLoadingGarage ? (
                      <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-900 rounded">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Scanning Garage Pipelines...</span>
                      </div>
                    ) : garageError ? (
                      <div className="p-3 bg-red-500/5 border border-red-500/10 rounded text-[10px] text-red-400 font-mono italic">
                        ⚠ ERROR: {garageError}
                      </div>
                    ) : garageCars.length > 0 ? (
                      <select
                        id="input-car-spec"
                        value={carId}
                        onChange={(e) => setCarId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded text-sm text-white font-mono outline-none focus:border-[#FFD700] appearance-none"
                      >
                        {garageCars.map((car) => (
                          <option key={car.car_id} value={car.car_id}>
                            {car.name} ({car.car_id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded text-[10px] text-zinc-500 font-mono italic">
                        Enter credentials above to fetch your garage inventory automatically.
                      </div>
                    )
                  )}
                  
                  <span className="block text-[10px] text-zinc-650 text-zinc-500 font-mono leading-relaxed mt-2">
                    * Automated injector uses the selected Car ID to apply modifications. Ensure your app is closed during injection.
                  </span>
                </motion.div>
              )}

              {error && (
                <p className="font-mono text-xs text-[#FF3333] leading-relaxed">
                  ⚠ {error}
                </p>
              )}

              {/* Submit triggers modal popup pay steps */}
              <button
                type="submit"
                disabled={!isFormValid || verifyingCredentials}
                className={`w-full py-3 font-black uppercase tracking-wider font-mono text-xs transition-colors flex items-center justify-center gap-2 ${
                  isFormValid && !verifyingCredentials
                    ? "bg-[#FF3333] hover:bg-white text-white hover:text-black cursor-pointer" 
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {verifyingCredentials ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                    <span>VERIFYING GAME ACCOUNT...</span>
                  </>
                ) : (
                  <span>PROCEED TO GCASH VERIFICATION</span>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Checkout Summary Panel */}
          <div className="lg:col-span-5 bg-[#0A0A0A] border border-[#1A1A1A] rounded p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold uppercase italic tracking-tighter text-white">
              Formula Invoice Summary
            </h3>

            <div className="bg-black rounded border border-zinc-900 p-5 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] font-mono">SELECTED TYPE:</span>
                <span className="font-bold text-white uppercase italic tracking-tight">{currentService.label}</span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-zinc-900 pt-3.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] font-mono">DELIVERY MODE:</span>
                <span className="font-mono font-bold text-emerald-400 uppercase tracking-wide">Instant Automatic Patch</span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-zinc-900 pt-3.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] font-mono">VERIFIER CHROME:</span>
                <span className="text-[#FFD700] font-mono text-[10px] font-bold">GCASH GEMINI SCANNER</span>
              </div>

              <div className="flex justify-between items-center border-t border-zinc-900 pt-4">
                <span className="text-sm font-bold uppercase text-white font-mono">GRAND TOTAL:</span>
                <span className="text-2xl font-mono text-[#FFD700] font-black">₱{Number(currentService.price).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 rounded border border-zinc-905 border-zinc-900 bg-zinc-950 text-center flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-500 leading-normal text-left font-sans">
                Patch orders require user account passwords to sync server changes. Real-time updates complete instantly via automated injection. Safe, tested with zero sandbox penalty triggers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GCash Payment wizard modal */}
      <PaymentWizard
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        serviceLabel={currentService.label}
        servicePrice={currentService.price}
        carxEmail={carxEmail}
        carxPassword={carxPassword}
        patchType={selectedPatchType}
        customDetails={currentCustomDetails()}
        onComplete={(orderId) => {
          setCompletedOrderId(orderId);
        }}
        onNavigate={onNavigate}
      />

    </div>
  );
}
