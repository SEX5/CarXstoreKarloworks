import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Loader2, 
  QrCode, 
  UploadCloud, 
  Copy, 
  ArrowRight, 
  CheckCircle2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PaymentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLabel: string;
  servicePrice: number;
  carxEmail: string;
  carxPassword: string;
  patchType: string;
  customDetails: any;
  orderType?: "patch" | "account" | "replacement" | "refill";
  onComplete: (orderId: string, refNumber: string) => void;
  onNavigate?: (view: string, arg?: any) => void;
}

export default function PaymentWizard({
  isOpen,
  onClose,
  serviceLabel,
  servicePrice,
  carxEmail,
  carxPassword,
  patchType,
  customDetails,
  orderType = "patch",
  onComplete,
  onNavigate
}: PaymentWizardProps) {
  const [modalStep, setModalStep] = useState<"pay_instructions" | "upload_receipt" | "order_complete">("pay_instructions");
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "other">("gcash");
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [verifyingReceipt, setVerifyingReceipt] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState("");
  const [deliveredRefNumber, setDeliveredRefNumber] = useState("");
  const [gcashSettings, setGcashSettings] = useState({
    gcash_number: "09123963204",
    gcash_name: "KA•L A.",
    gcash_qr_url: "https://pub-c2a2b0c3f0b2.r2.dev/gcash_qr_sample.png"
  });

  useEffect(() => {
    if (isOpen) {
      setModalStep("pay_instructions");
      setReceiptBase64(null);
      setOcrError(null);
      loadSettings();
    }
  }, [isOpen]);

  async function loadSettings() {
    try {
      const resp = await fetch("/api/settings");
      if (resp.ok) {
        const s = await resp.json();
        setGcashSettings({
          gcash_number: s.gcash_number || "09123963204",
          gcash_name: s.gcash_name || "KA•L A.",
          gcash_qr_url: s.gcash_qr_url || "https://pub-c2a2b0c3f0b2.r2.dev/gcash_qr_sample.png"
        });
      }
    } catch (err) {
      console.error("Failed to load GCash settings:", err);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
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

  const submitGCashVerify = async () => {
    if (!receiptBase64) {
      setOcrError("Please upload or drag your GCash screenshot verification receipt.");
      return;
    }

    try {
      setVerifyingReceipt(true);
      setOcrError(null);

      const analyzeResp = await fetch("/api/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: receiptBase64,
          expectedAmount: servicePrice,
          paymentMethod: paymentMethod
        })
      });

      const ocrResult = await analyzeResp.json();
      if (!analyzeResp.ok || !ocrResult.success) {
        throw new Error(ocrResult.error || "Failed to parse screenshot details.");
      }

      const orderResp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_type: orderType,
          customer_email: carxEmail,
          carx_email: carxEmail,
          carx_password: carxPassword,
          patch_type: patchType,
          patch_label: serviceLabel,
          account_id: orderType === "account" ? patchType : null,
          custom_details: customDetails,
          amount_paid: servicePrice,
          gcash_ref_number: ocrResult.data.reference_number,
          gcash_receipt_url: ocrResult.data.receipt_url,
          payment_method: paymentMethod,
          gcash_receipt_data: ocrResult.data,
          status: "paid"
        })
      });

      const orderResult = await orderResp.json();
      if (!orderResp.ok || !orderResult.success) {
        throw new Error(orderResult.error || "Unable to register order target.");
      }

      setCompletedOrderId(orderResult.order.order_id);
      setDeliveredRefNumber(ocrResult.data.reference_number);
      setModalStep("order_complete");
      onComplete(orderResult.order.order_id, ocrResult.data.reference_number);

    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("fetch") || err.message.toLowerCase().includes("network"))) {
        setOcrError("INTERRUPT DETECTED: Scanning failed due to a network timeout. Please click 'TRY AGAIN' to re-verify.");
      } else {
        setOcrError(err.message || "Failed validating payment details.");
      }
    } finally {
      setVerifyingReceipt(false);
    }
  };

  const handleCopyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={verifyingReceipt ? undefined : onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        className="relative w-full max-w-lg rounded bg-[#0A0A0A] border border-[#1A1A1A] p-6 md:p-8"
      >
        <div className="flex justify-between items-start mb-6 border-b border-zinc-900 pb-4">
          <div>
            <span className="font-mono text-[9px] font-bold text-[#FFD700] uppercase tracking-wider block">
              SECURE TRANSACTION GATEWAY
            </span>
            <h3 className="font-display font-black italic uppercase text-lg text-white">
              {modalStep === "order_complete" ? "PROVISIONING COMPLETE" : (paymentMethod === "gcash" ? "GCASH VERIFICATION" : "UNIVERSAL VERIFICATION")}
            </h3>
          </div>
          {modalStep !== "order_complete" && (
            <button
              onClick={onClose}
              className="p-1 px-2.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-white font-mono text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {modalStep === "pay_instructions" && (
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-black border border-zinc-900 rounded">
              <button 
                onClick={() => setPaymentMethod("gcash")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase transition-all ${paymentMethod === "gcash" ? "bg-[#FFD700] text-black" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                GCASH
              </button>
              <button 
                onClick={() => setPaymentMethod("other")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase transition-all ${paymentMethod === "other" ? "bg-[#FFD700] text-black" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                OTHER WALLET / BANKS
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded p-4 text-[11px] leading-relaxed text-zinc-300 space-y-2">
              <p className="font-bold text-[#FFD700] text-xs font-mono uppercase">PAYMENT INSTRUCTIONS</p>
              <p>1. Open {paymentMethod === "gcash" ? "GCash app" : "your Wallet or Bank App"} and select <strong className="text-white">"Send Money"</strong> or scan the QR Code below.</p>
              <p>2. Send the exact amount representing <strong className="text-white">₱{servicePrice.toFixed(2)} PHP</strong> to the Account details below.</p>
              <p>3. <strong className="text-[#FFD700]">CRITICAL: Save/screenshot the transaction receipt screen!</strong> You will upload it next.</p>
              {paymentMethod === "other" && (
                <p className="text-emerald-500 font-bold border-t border-zinc-900 pt-2 mt-2 italic">
                  * Supports Maya, BPI, SeaBank, MariBank, etc. via Instapay/QRPH.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 items-center bg-zinc-950 p-4 rounded border border-zinc-900">
               <div className="space-y-2">
                  <span className="block text-[11px] font-mono text-zinc-500 font-bold uppercase text-left tracking-widest">{paymentMethod === "gcash" ? "GCASH RECEIVER" : "ACCOUNT NUMBER"}</span>
                  <div className="p-2 bg-black text-white font-mono text-xs rounded border border-zinc-900 flex justify-between items-center">
                    <div className="flex flex-col text-left">
                      {paymentMethod === "gcash" && (
                        <span className="text-[8px] text-zinc-600 font-bold uppercase truncate">{gcashSettings.gcash_name}</span>
                      )}
                      <span className="text-base font-bold font-mono">{gcashSettings.gcash_number}</span>
                      {paymentMethod === "other" && (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase truncate mt-0.5">KARL ABALUNAN</span>
                      )}
                    </div>
                    <button onClick={() => handleCopyText(gcashSettings.gcash_number)} className="text-[#FFD700] hover:text-white">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
               </div>
               <div className="mx-auto border border-zinc-900 p-1 bg-white rounded-sm">
                 <img src={gcashSettings.gcash_qr_url} alt="QR" className="w-24 h-24 object-contain" />
               </div>
            </div>

            {copied && <p className="text-center text-emerald-400 text-[10px] font-mono font-bold">✓ Reference copied.</p>}

            <button
              onClick={() => setModalStep("upload_receipt")}
              className="w-full py-3 bg-[#FFD700] hover:bg-white text-black font-black uppercase tracking-wider font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>I HAVE COMPLETED PAYMENT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {modalStep === "upload_receipt" && (
          <div className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 transition-all ${
                dragActive ? "border-[#FFD700] bg-[#FFD700]/5" : "border-zinc-800 bg-zinc-950"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {receiptBase64 ? (
                <div className="relative group">
                  <img src={receiptBase64} alt="Receipt" className="max-h-48 rounded shadow-lg border border-zinc-800" />
                  <button
                    onClick={() => setReceiptBase64(null)}
                    className="absolute -top-2 -right-2 bg-[#FF3333] text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-zinc-700" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white mb-1">UPLOAD RECEIPT SCREENSHOT</p>
                    <p className="text-[10px] text-zinc-500 font-mono">PNG or JPEG format supported</p>
                  </div>
                  <label className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase font-bold rounded hover:bg-zinc-800 cursor-pointer transition-colors">
                    BROWSE FILES
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </>
              )}
            </div>

            {ocrError && <p className="text-[10px] text-[#FF3333] font-mono text-center">⚠ {ocrError}</p>}

            <div className="flex gap-4">
              <button
                disabled={verifyingReceipt}
                onClick={() => setModalStep("pay_instructions")}
                className="w-1/2 py-2.5 bg-zinc-950 border border-zinc-900 text-zinc-500 uppercase font-mono text-[10px] font-bold"
              >
                GO BACK
              </button>
              <button
                disabled={!receiptBase64 || verifyingReceipt}
                onClick={submitGCashVerify}
                className={`w-1/2 py-2.5 font-black uppercase tracking-wider font-mono text-[10px] flex items-center justify-center gap-2 ${
                  !receiptBase64 || verifyingReceipt ? "bg-zinc-900 text-zinc-700" : "bg-[#FFD700] hover:bg-white text-black cursor-pointer"
                }`}
              >
                {verifyingReceipt ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                {verifyingReceipt ? "SCANNING..." : (ocrError ? "TRY AGAIN" : "VERIFY RECEIPT")}
              </button>
            </div>
          </div>
        )}

        {modalStep === "order_complete" && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-display font-black italic uppercase text-white tracking-tighter">
                {patchType === "restore" ? "RESTORATION COMPLETE" : "PATCH INJECTION COMPLETE"}
              </h4>
              <p className="text-[11px] text-zinc-500 font-sans max-w-xs mx-auto">
                {patchType === "restore" 
                  ? "Identity restoration complete. You can now login to your account profile."
                  : "Injection successful. Your account has been updated. You can now open your account to see the changes."
                }
              </p>
            </div>

            {/* NEW: Mini Status Report in Modal */}
            <div className="bg-black border border-emerald-500/20 p-4 rounded text-left space-y-2 font-mono text-[9px] relative overflow-hidden">
               <div className="flex justify-between items-center text-emerald-400/60 uppercase">
                 <span>{">"} service key:</span>
                 <span className="text-[#FFD700]">{deliveredRefNumber}</span>
               </div>
               <div className="flex justify-between items-center text-emerald-400/60 uppercase">
                 <span>{">"} internal id:</span>
                 <span className="text-white">#{completedOrderId.toUpperCase()}</span>
               </div>
               <div className="flex justify-between items-center text-emerald-400/60 uppercase">
                 <span>{">"} progression:</span>
                 <span className="text-[#00FF00] font-black italic">"completed"</span>
               </div>
               <div className="mt-2 text-[8px] text-[#00FF00]/40 italic">
                 * automated patch successful. injection registration completed.
               </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="w-1/2 py-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-500 font-black uppercase tracking-widest font-mono text-[10px] transition-all"
              >
                CLOSE
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onNavigate) onNavigate("order_status", completedOrderId);
                }}
                className="w-1/2 py-3 bg-[#FFD700] hover:bg-white text-black font-black uppercase tracking-widest font-mono text-[10px] transition-all"
              >
                TRACK ORDER
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
