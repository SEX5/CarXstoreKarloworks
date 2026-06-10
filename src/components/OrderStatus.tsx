import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Loader2, Copy, Send, Mail, UserCheck, HelpCircle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface OrderStatusProps {
  orderId: string;
  onNavigate: (view: string) => void;
}

export default function OrderStatus({ orderId, onNavigate }: OrderStatusProps) {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load status
  const fetchStatus = async () => {
    try {
      const resp = await fetch(`/api/order/status/${orderId}`);
      if (!resp.ok) {
        throw new Error("Unable to retrieve order details for this ID.");
      }
      const data = await resp.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred loading order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Set up auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded p-8 max-w-xl mx-auto" id="order-status-loading">
        <Loader2 className="w-10 h-10 animate-spin text-[#FFD700]" />
        <p className="font-mono text-xs text-zinc-500 tracking-widest text-center uppercase">
          POLLING AUTOMATIC INJECTOR STATUS...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded bg-[#0A0A0A] border border-[#1A1A1A] p-8 max-w-xl mx-auto text-center space-y-6" id="order-status-error">
        <div className="h-12 w-12 bg-red-500/5 text-red-500 border border-red-500/15 rounded-full flex items-center justify-center mx-auto text-xl">
          ⚠
        </div>
        <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">Order ID Not Found</h1>
        <p className="text-zinc-400 text-xs font-mono leading-relaxed bg-black p-4 border border-[#222]">
          {error || `The order sequence #${orderId} was not found on our server files.`}
        </p>
        <button
          onClick={() => onNavigate("home")}
          className="px-6 py-2.5 bg-[#FF3333] hover:bg-[#e02525] text-white font-bold text-xs uppercase tracking-wider rounded-sm"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  // Get status details
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return {
          title: "DELIVERED & FULLY ACTIVE ✓",
          desc: "Fulfillment successfully complete. Your custom credentials are live on CarX Technologies servers below.",
          color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        };
      case "rejected":
        return {
          title: "DUPLICATE OR INVALID RECEIPT RECEIPT ❌",
          desc: "Your receipt could not be verified by our systems. This can occur if GCash Reference Number is fake, modified, or has already been used.",
          color: "text-[#FF3333] border-[#FF3333]/15 bg-[#FF3333]/5",
          icon: <XCircle className="w-5 h-5 text-[#FF3333]" />
        };
      case "paid":
      case "pending_fulfillment":
      default:
        return {
          title: "AUTOPILOT INJECTION INITIALIZED... 🚗",
          desc: "Your GCash transaction was successfully verified by our AI receipt parser! The automated injector is now applying your requested resources directly to the game server. This process is usually instant.",
          color: "text-[#FFD700] border-[#FFD700]/15 bg-[#FFD700]/5",
          icon: <Clock className="w-5 h-5 text-[#FFD700] animate-spin" />
        };
    }
  };

  const statusMeta = getStatusDisplay(order.status);

  return (
    <div className="max-w-xl mx-auto px-4 py-6" id="order-status-view">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded bg-[#0A0A0A] border border-[#1A1A1A] p-6 md:p-8 space-y-6 relative overflow-hidden"
      >
        {/* Ribbon notification bar */}
        <div className={`p-4 rounded border text-xs leading-relaxed ${statusMeta.color} flex items-start gap-3`}>
          <div className="shrink-0 pt-0.5">{statusMeta.icon}</div>
          <div>
            <h4 className="font-mono font-bold uppercase tracking-wider mb-1">{statusMeta.title}</h4>
            <p className="text-zinc-300">{statusMeta.desc}</p>
          </div>
        </div>

        {/* Invoice specifications */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs border-b border-[#1A1A1A] pb-3 font-mono">
            <span className="text-zinc-600 font-bold uppercase">TRACKING NO</span>
            <strong className="text-[#FFD700]">{order.order_id}</strong>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-[#1A1A1A] pb-3">
            <span className="text-zinc-600 font-bold uppercase text-[9px] font-mono">CUSTOMER EMAIL:</span>
            <span className="text-white font-semibold">{order.customer_email}</span>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-[#1A1A1A] pb-3">
            <span className="text-zinc-600 font-bold uppercase text-[9px] font-mono">PRODUCT METHOD:</span>
            <span className="text-zinc-300 font-bold uppercase tracking-wide">
              {order.order_type === "account" ? "Resource Package" : `Resource Patch: ${order.patch_type}`}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-[#1A1A1A] pb-3">
            <span className="text-zinc-600 font-bold uppercase text-[9px] font-mono">GCASH PAID AMOUNT:</span>
            <span className="text-[#FFD700] font-mono font-bold text-sm">₱{Number(order.amount_paid).toFixed(2)}</span>
          </div>

          {order.gcash_ref_number && (
            <div className="flex justify-between items-center text-xs border-b border-[#1A1A1A] pb-3">
              <span className="text-zinc-600 font-bold uppercase text-[9px] font-mono">GCASH REFERENCE ID:</span>
              <span className="text-zinc-305 text-zinc-300 font-mono">{order.gcash_ref_number}</span>
            </div>
          )}
        </div>

        {/* Claims Status & Protection Section */}
        {order.order_type === "account" && (
          <div className="space-y-4">
             {/* Guarantee Info Card */}
             <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded flex items-start gap-3">
              <div className="p-1.5 bg-emerald-500/10 rounded">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Buyer Protection & Guarantee
                </h4>
                <p className="text-zinc-400 text-[10px] leading-relaxed mt-1">
                  You are eligible for **Free Replacement** if your account is banned or lost, and **Free Refills** for resources. Use this Tracking ID in the Recovery Center.
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">🎫 Claims Status</p>
              
              <div className="grid grid-cols-2 gap-4">
                {order.max_replacements > 0 && (
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded space-y-1">
                    <p className="text-[8.5px] text-zinc-500 font-mono uppercase font-bold">Replacements</p>
                    <p className="text-cyan-400 font-bold font-mono text-sm leading-none">
                      {order.replacements_count || 0}/{order.max_replacements}
                    </p>
                    <p className="text-[7.5px] text-zinc-600 font-mono uppercase tracking-tighter">Claims Used</p>
                  </div>
                )}

                {order.max_refills > 0 && (
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded space-y-1">
                    <p className="text-[8.5px] text-zinc-500 font-mono uppercase font-bold">Refills</p>
                    <p className="text-amber-400 font-bold font-mono text-sm leading-none">
                      {order.refills_count || 0}/{order.max_refills}
                    </p>
                    <p className="text-[7.5px] text-zinc-600 font-mono uppercase tracking-tighter">Claims Used</p>
                  </div>
                )}
              </div>
              
              {(order.max_replacements > 0 || order.max_refills > 0) && (
                <p className="text-[8px] text-zinc-600 italic leading-tight">
                  * You can request replacements or refills in the Replacement Center using your Tracking ID.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Credentials Delivery Panel for Order Type Account */}
        {order.status === "completed" && order.order_type === "account" && (
          <div className="bg-black border border-emerald-500/10 bg-emerald-500/[0.02] p-5 rounded space-y-2">
            <span className="block text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              ✓ PACKAGE INJECTION FULFILLED SUCCESSFULLY
            </span>
            
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Our autopilot bot has completed your package resource adjustments. Injected modifications are now synchronizing on your CarX account: <strong>{order.carx_email || order.delivered_email}</strong>. Log out and log back into your CarX app to prompt files validation and enjoy your resources!
            </p>
          </div>
        )}

        {/* Patch Order Manual processing text */}
        {order.status === "completed" && order.order_type === "patch" && (
          <div className="bg-black border border-emerald-500/10 bg-emerald-500/[0.02] p-5 rounded space-y-2">
            <span className="block text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest">
              ✓ PATCH INJECTION FULFILLED SUCCESSFULLY
            </span>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Our bot has completed resource adjustments. Injected modifications are now synchronizing on: <strong>{order.carx_email}</strong>. Logging out and logging back in on your app will prompt files validation.
            </p>
          </div>
        )}

        {/* In progress notice details */}
        {(order.status === "pending_fulfillment" || order.status === "paid") && (
          <div className="bg-zinc-950 p-4 border border-[#1A1A1A] rounded text-center">
            <span className="inline-block p-2 bg-[#FFD700]/5 text-[#FFD700] rounded mb-2.5">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#FFD700]" />
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">AUTOPILOT INJECTOR ACTIVE</h4>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Do not close or leave this screen! This page auto-checks state every 10 seconds. Credentials will slide into view momentarily.
            </p>
          </div>
        )}

        {order.status !== "completed" && (
          <div className="bg-[#FFD700]/5 border border-[#FFD700]/10 p-4 rounded text-center space-y-2 font-mono text-[10px]">
            <p className="text-[#FFD700] font-bold uppercase tracking-wider">NEED MANUAL APPROVAL OR HELP?</p>
            <p className="text-zinc-500 max-w-md mx-auto leading-normal">
              If you need manual assistance, or want to instantly approve your injection via messenger support, send your Receipt directly to our admin.
            </p>
            <a 
              href="https://m.me/lark.abalunan.1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD700] text-black font-extrabold uppercase rounded-sm hover:bg-white transition-colors text-[9px] tracking-wider"
            >
              💬 MESSAGE ADMIN (m.me/lark.abalunan.1)
            </a>
          </div>
        )}

        {/* Action Bottom Navigator */}
        <div className="flex gap-4 pt-4 border-t border-[#1A1A1A]">
          <button
            onClick={() => onNavigate("home")}
            className="w-1/2 cursor-pointer py-2.5 bg-black hover:bg-[#111] border border-[#222] text-zinc-400 hover:text-white font-mono text-xs uppercase text-center"
          >
            LOBBY
          </button>
          
          <button
            onClick={() => onNavigate("accounts")}
            className="w-1/2 cursor-pointer py-2.5 bg-[#FFD700] hover:bg-white text-black font-black uppercase tracking-wider font-mono text-xs text-center"
          >
            CATALOGUE
          </button>
        </div>
      </motion.div>
    </div>
  );
}
