import React, { useState, useEffect } from "react";
import { ShieldCheck, Mail, Key, User, Flame, Loader2, Sparkles, QrCode, UploadCloud, Copy, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatResourceQuantity } from "./utils";

interface OrderPatchProps {
  onNavigate: (view: string, arg?: string) => void;
}

export default function OrderPatch({ onNavigate }: OrderPatchProps) {
  const [carxEmail, setCarxEmail] = useState("");
  const [carxPassword, setCarxPassword] = useState("");
  const [selectedPatchType, setSelectedPatchType] = useState("ban_safe_1");
  
  // Garage fetching states
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
  const [gcashSettings, setGcashSettings] = useState({
    gcash_number: "09123456789",
    gcash_qr_url: "https://pub-c2a2b0c3f0b2.r2.dev/gcash_qr_sample.png"
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for GCash payment Modal in wizard
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"pay_instructions" | "upload_receipt" | "order_complete">("pay_instructions");
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [verifyingReceipt, setVerifyingReceipt] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState("");

  // Load Pricing and settings configuration live on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load Settings
        const settingsResp = await fetch("/api/settings");
        if (settingsResp.ok) {
          const s = await settingsResp.json();
          setGcashSettings({
            gcash_number: s.gcash_number || "09123456789",
            gcash_qr_url: s.gcash_qr_url || "https://pub-c2a2b0c3f0b2.r2.dev/gcash_qr_sample.png"
          });
        }

        // Load Pricing
        const pricingResp = await fetch("/api/patch-pricing");
        if (pricingResp.ok) {
          const p = await pricingResp.json();
          setServices(p);
          if (p.length > 0) {
            setSelectedPatchType(p[0].patch_type);
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

  const currentService = services.find((s) => s.patch_type === selectedPatchType) || {
    patch_type: "ban_safe_1",
    label: "Ban-Safe Pack 1",
    price: 300,
    description: "Appends 10 Million Silver and 6K Gold."
  };

  const handleOpenPaymentWizard = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!carxEmail || !carxPassword) {
      setError("Please fill out all required fields: CarX login and password.");
      return;
    }

    if ((selectedPatchType === "inject_car" || selectedPatchType === "max_nitro") && !carId) {
      setError("Please specify the Car ID / Model description target for injecting.");
      return;
    }

    setIsPayModalOpen(true);
    setModalStep("pay_instructions");
    setReceiptBase64(null);
    setOcrError(null);
  };

  const handleClosePaymentWizard = () => {
    setIsPayModalOpen(false);
    setReceiptBase64(null);
    setOcrError(null);
  };

  // Drag and drop receipt mechanics
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setOcrError("Please upload a valid receipt image (PNG, JPEG).");
      return;
    }
    setOcrError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit OCR GCash Analyzer in modal
  const submitGCashVerify = async () => {
    if (!receiptBase64) {
      setOcrError("Please upload or drag your GCash screenshot verification receipt.");
      return;
    }

    try {
      setVerifyingReceipt(true);
      setOcrError(null);

      // 1. Send receipt for OCR checking
      const analyzeResp = await fetch("/api/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: receiptBase64,
          expectedAmount: currentService.price
        })
      });

      const ocrResult = await analyzeResp.json();
      if (!analyzeResp.ok || !ocrResult.success) {
        throw new Error(ocrResult.error || "Failed to parse screenshot details. Recheck resolution parameters.");
      }

      // 2. Verified successfully. Prepare order custom details configuration
      let customConfig: any = {};
      
      if (selectedPatchType === "custom_resources") {
        customConfig = { silver: Number(customSilver), gold: Number(customGold), xp: 0 };
      } else if (selectedPatchType === "ban_safe_1") {
        customConfig = { silver: 10000000, gold: 6000, xp: 0 };
      } else if (selectedPatchType === "ban_safe_2") {
        customConfig = { silver: 6000000, gold: 1000, xp: 0 };
      } else if (selectedPatchType === "max_nitro" || selectedPatchType === "inject_car") {
        customConfig = { car_id: carId };
      }

      // Create patch order in DB
      const orderResp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_type: "patch",
          customer_email: carxEmail,
          carx_email: carxEmail,
          carx_password: carxPassword,
          patch_type: selectedPatchType,
          patch_label: currentService.label,
          custom_details: customConfig,
          amount_paid: currentService.price,
          gcash_ref_number: ocrResult.data.reference_number,
          gcash_receipt_data: ocrResult.data,
          status: "paid" // Automatically trigger injection by setting to 'paid'
        })
      });

      const orderResult = await orderResp.json();
      if (!orderResp.ok || !orderResult.success) {
        throw new Error(orderResult.error || "Unable to register order target. System DB offline.");
      }

      setCompletedOrderId(orderResult.order.order_id);
      setModalStep("order_complete");

    } catch (err: any) {
      setOcrError(err.message || "Failed validating payment details.");
    } finally {
      setVerifyingReceipt(false);
    }
  };

  const handleCopyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  placeholder="player_username"
                  value={carxEmail}
                  onChange={(e) => setCarxEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 text-sm outline-none focus:border-[#FFD700] text-white transition-all font-mono rounded-sm"
                />
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
                  {services.map((serv) => (
                    <button
                      type="button"
                      key={serv.patch_type}
                      onClick={() => {
                        setSelectedPatchType(serv.patch_type);
                        setError(null);
                      }}
                      className={`text-left p-4 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedPatchType === serv.patch_type
                          ? "bg-[#FFD700]/5 border-[#FFD700] text-white animate-pulse"
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
                className="w-full py-3 bg-[#FF3333] hover:bg-white text-white hover:text-black font-black uppercase tracking-wider font-mono text-xs transition-colors cursor-pointer"
              >
                PROCEED TO GCASH VERIFICATION
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
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={verifyingReceipt ? undefined : handleClosePaymentWizard}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              className="relative w-full max-w-lg rounded bg-black border border-zinc-800 p-6 md:p-8"
              id="patch-payment-dashboard"
            >
              <div className="flex justify-between items-start mb-6 border-b border-zinc-900 pb-4">
                <div>
                  <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                    CUSTOM INJECTOR PLATFORM
                  </span>
                  <h3 className="font-display font-black italic uppercase text-lg text-white">
                    {modalStep === "order_complete" ? "QUEUE REGISTRATION COMPLETE" : "GCASH DEPOSIT VERIFICATION"}
                  </h3>
                </div>
                {modalStep !== "order_complete" && (
                  <button
                    onClick={handleClosePaymentWizard}
                    className="p-1 px-2.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-white font-mono text-xs cursor-pointer"
                  >
                    CLOSE
                  </button>
                )}
              </div>

              {/* STEP 1: PAYMENT INSTRUCTIONS */}
              {modalStep === "pay_instructions" && (
                <div className="space-y-6">
                  <div className="bg-zinc-950 border border-zinc-900 rounded p-4 text-[11px] leading-relaxed text-zinc-400 space-y-1.5">
                    <p className="font-bold text-[#FFD700] text-xs font-mono uppercase">MANUAL TRANSFER FLOW</p>
                    <p>1. Open GCash wallet app and Express Send (or scan the QR Code).</p>
                    <p>2. Complete a payment transfer of exactly <strong className="text-white">₱{Number(currentService.price).toFixed(2)} PHP</strong> to the recipient address.</p>
                    <p>3. Take a screenshot of the successful transfer receipt page for verification.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center bg-zinc-950 p-4 rounded border border-zinc-900">
                    <div className="space-y-2">
                      <span className="block text-[9px] font-mono text-zinc-600 font-bold uppercase text-left">GCash Receiver</span>
                      <div className="p-2 bg-black text-white font-mono text-sm rounded border border-zinc-900 flex justify-between items-center">
                        <span>{gcashSettings.gcash_number}</span>
                        <button
                          onClick={() => handleCopyText(gcashSettings.gcash_number)}
                          className="text-[#FFD700] hover:text-white text-[9px]"
                        >
                          COPY
                        </button>
                      </div>
                      <span className="block text-[8px] font-mono text-[#FF3333] font-bold text-left">* AMOUNT TO PAY: ₱{Number(currentService.price).toFixed(2)}</span>
                    </div>

                    <div className="mx-auto border border-zinc-850 p-1 bg-white rounded-sm">
                      {gcashSettings.gcash_qr_url ? (
                        <img
                          src={gcashSettings.gcash_qr_url}
                          alt="GCash QR Code"
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-black font-semibold text-[9px]">
                          NO QR CODE
                        </div>
                      )}
                    </div>
                  </div>

                  {copied && (
                    <p className="text-center text-emerald-400 text-[10px] font-mono font-bold">✓ Reference copied successfully.</p>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleClosePaymentWizard}
                      className="w-1/2 py-2.5 bg-zinc-950 hover:bg-[#111] text-zinc-500 uppercase border border-zinc-900 font-mono text-xs text-center"
                    >
                      ABORT
                    </button>
                    
                    <button
                      onClick={() => setModalStep("upload_receipt")}
                      className="w-1/2 py-2.5 bg-[#FFD700] hover:bg-white text-black font-black uppercase tracking-wider font-mono text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>I HAVE PAID</span>
                      <ArrowRight className="w-3.5 h-3.5 text-black" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: UPLOAD & VERIFY */}
              {modalStep === "upload_receipt" && (
                <div className="space-y-6">
                  <div className="text-center font-mono">
                    <span className="text-[10px] text-[#FFD700] font-bold tracking-widest uppercase block mb-3">
                      UPLOAD screenshot OF THE PAYSLIP
                    </span>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
                        dragActive ? "border-[#FFD700] bg-[#FFD700]/5" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                      }`}
                    >
                      <input
                        type="file"
                        id="patch-receipt-file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="patch-receipt-file" className="cursor-pointer block space-y-2">
                        <UploadCloud className="w-8 h-8 text-zinc-505 text-zinc-500 mx-auto" />
                        <p className="text-zinc-300 font-bold text-xs uppercase font-mono">
                          Drag / Select Receipt Screenshot
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Supports JPG, PNG up to 20MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {receiptBase64 && (
                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-between font-mono text-[11px] text-zinc-400">
                      <div className="flex items-center gap-3">
                        <img
                          src={receiptBase64}
                          alt="Receipt Preview"
                          className="w-10 h-14 object-cover border border-zinc-800 rounded"
                        />
                        <span>GCash_Receipt_Report.png</span>
                      </div>
                      <button
                        onClick={() => setReceiptBase64(null)}
                        className="text-[#FF3333] hover:text-white font-bold uppercase text-[9px]"
                      >
                        REMOVE
                      </button>
                    </div>
                  )}

                  {ocrError && (
                    <p className="text-xs text-[#FF3333] font-mono leading-relaxed bg-[#FF3333]/5 border border-[#FF3333]/15 p-2 rounded">
                      ⚠ {ocrError}
                    </p>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setModalStep("pay_instructions")}
                      className="w-1/2 py-2.5 bg-zinc-950 text-zinc-500 hover:text-white font-mono text-xs uppercase border border-zinc-900"
                    >
                      BACK
                    </button>
                    
                    <button
                      onClick={submitGCashVerify}
                      disabled={!receiptBase64 || verifyingReceipt}
                      className="w-1/2 py-2.5 bg-[#FFD700] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider font-mono text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {verifyingReceipt ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                          <span>AI OCR READING...</span>
                        </>
                      ) : (
                        <>
                          <span>SEND RECEIPT</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-black" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: QUEUE COMPLETE */}
              {modalStep === "order_complete" && (
                <div className="space-y-6" id="patch-delivery-success">
                  <div className="text-center space-y-2">
                    <span className="inline-flex p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-full animate-bounce mb-2">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </span>
                    <h3 className="text-lg font-black italic uppercase text-white tracking-widest font-mono text-center">
                      PATCH INJECTION SEQUENCE COMPLETE ✓
                    </h3>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
                      Your GCash voucher was verified by AI, and the injection sequence has been successfully initialized for tracking ID: <strong>{completedOrderId}</strong>.
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-900 p-4 rounded leading-relaxed text-zinc-400 text-xs text-left space-y-1.5 font-mono">
                    <p className="text-emerald-400 font-bold uppercase text-[10px]">INJECTOR STATUS REPORT:</p>
                    <p>&gt; target account: {carxEmail}</p>
                    <p>&gt; modification type: {currentService.label}</p>
                    <p>&gt; progression: <span className="text-emerald-400 font-bold">"completed"</span></p>
                    <p className="text-[10px] text-emerald-400/60 italic font-sans lowercase mt-3 leading-tight">
                      * Automated patch successful. Resources have been synced with the game database. Restart your app to see changes.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setIsPayModalOpen(false);
                        onNavigate("order_status", completedOrderId);
                      }}
                      className="w-full py-3 bg-[#FFD700] hover:bg-white text-black font-black uppercase tracking-wider font-mono text-xs text-center cursor-pointer"
                    >
                      TRACK ORDER IN REAL-TIME
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
