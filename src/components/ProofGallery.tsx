import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, Star, ShieldCheck, Heart, User, 
  ChevronRight, ArrowLeft, Upload, MessageSquare, Plus
} from "lucide-react";

interface Proof {
  id: string;
  customer_name: string;
  image_url: string;
  review: string;
  created_at: string;
}

interface ProofGalleryProps {
  onNavigate: (view: string) => void;
  onOpenUpload: () => void;
}

export default function ProofGallery({ onNavigate, onOpenUpload }: ProofGalleryProps) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/proofs")
      .then(res => res.json())
      .then(data => {
        setProofs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load proofs:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-[#FFD700] pl-6 py-2">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
            Success <span className="text-[#FFD700]">Timeline</span>
          </h2>
          <p className="text-zinc-500 text-xs font-mono tracking-widest mt-2 uppercase">
            Proof of Deliveries & Customer Satisfaction
          </p>
        </div>
        <button 
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-black text-xs uppercase tracking-widest skew-x-[-10deg] hover:bg-white transition-all active:scale-95 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform skew-x-[10deg]" />
          <span className="skew-x-[10deg]">Submit Your Proof</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-video bg-zinc-900/50 border border-zinc-800 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : proofs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {proofs.map((proof, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={proof.id}
              className="group relative bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700]/30 transition-all overflow-hidden rounded-sm"
            >
              {/* Image Container */}
              <div 
                className="aspect-video overflow-hidden relative cursor-zoom-in"
                onClick={() => setSelectedImage(proof.image_url)}
              >
                <img 
                  src={proof.image_url} 
                  alt="Customer Proof" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-zinc-700 rounded-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#FFD700]" />
                  <span className="text-[10px] font-mono text-white font-bold uppercase tracking-wider">Verified</span>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-[#1A1A1A]">
                      <User className="w-3 h-3 text-zinc-400" />
                    </div>
                    <span className="text-[11px] font-bold text-white uppercase tracking-tight">{proof.customer_name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600">
                    {new Date(proof.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {proof.review && (
                  <p className="text-[11px] text-zinc-400 italic leading-relaxed line-clamp-2">
                    "{proof.review}"
                  </p>
                )}

                <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between">
                   <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 text-[#FFD700] fill-[#FFD700]" />)}
                   </div>
                   <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-black uppercase">
                      <Heart className="w-2.5 h-2.5 fill-current" />
                      Success
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-12 text-center rounded-sm">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1A1A1A]">
            <Camera className="w-8 h-8 text-zinc-700" />
          </div>
          <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">No Proofs Yet</h3>
          <p className="text-zinc-500 text-xs italic mb-6">Be the first to share your successful patch delivery!</p>
          <button 
            onClick={onOpenUpload}
            className="px-6 py-2 border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Submit Proof
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-5xl max-h-[90vh] relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={selectedImage} 
                alt="Full Proof" 
                className="w-full h-full object-contain border border-zinc-800 rounded-sm shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust Banner */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 flex flex-col md:flex-row items-center gap-6 rounded-sm">
        <div className="w-14 h-14 bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center rounded-full shrink-0">
          <ShieldCheck className="w-7 h-7 text-[#FFD700]" />
        </div>
        <div className="text-center md:text-left space-y-1">
          <h4 className="text-white font-black uppercase tracking-tight text-lg italic">
            Quality <span className="text-[#FFD700]">Verification</span> Pipeline
          </h4>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-2xl">
            Every submission is cross-referenced with our backend delivery logs to ensure maximum transparency.
            We value your feedback and strive to maintain the most reliable modding community.
          </p>
        </div>
        <div className="md:ml-auto flex gap-4">
           <div className="text-center border-r border-zinc-800 pr-4">
              <div className="text-white font-black text-xl leading-none">100%</div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">Delivery</div>
           </div>
           <div className="text-center">
              <div className="text-white font-black text-xl leading-none">5.0</div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">Rating</div>
           </div>
        </div>
      </div>
    </div>
  );
}

function X(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
