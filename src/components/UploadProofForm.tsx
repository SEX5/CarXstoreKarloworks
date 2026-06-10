import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import imageCompression from "browser-image-compression";
import { 
  X, Upload, CheckCircle, AlertCircle, 
  Camera, MessageSquare, User, Loader2 
} from "lucide-react";

interface UploadProofFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId?: string;
}

export default function UploadProofForm({ isOpen, onClose, onSuccess, orderId }: UploadProofFormProps) {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    review: "",
    image_url: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("File size too large (max 50MB)");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const options = {
        maxSizeMB: 1.5, // Aim for ~1.5MB to stay safely under 2MB limit
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      setSelectedFile(compressedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Image compression failed:", err);
      setError("Failed to process image");
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // We need the original file or blob for the upload
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", selectedFile);
      formDataToSend.append("customer_name", formData.customer_name);
      formDataToSend.append("customer_email", formData.customer_email);
      formDataToSend.append("review", formData.review);
      if (orderId) formDataToSend.append("order_id", orderId);

      const response = await fetch("/api/proofs", {
        method: "POST",
        body: formDataToSend // Sending as FormData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit proof");

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setFormData({ customer_name: "", customer_email: "", review: "", image_url: "" });
        setSelectedFile(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm shadow-2xl overflow-hidden"
          >
            {/* Success Overlay */}
            {success && (
              <div className="absolute inset-0 z-10 bg-black/90 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black italic uppercase text-white tracking-widest">
                  Submission <span className="text-[#FFD700]">Confirmed</span>
                </h3>
                <p className="text-zinc-500 text-xs font-mono">Your proof has been added to the catalog.</p>
              </div>
            )}

            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FFD700] rounded-sm skew-x-[-10deg] flex items-center justify-center">
                  <Upload className="w-4 h-4 text-black font-bold skew-x-[10deg]" />
                </div>
                <h3 className="text-lg font-black italic uppercase text-white tracking-tight">
                  Share Your <span className="text-[#FFD700]">Success</span>
                </h3>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Character Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block pl-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text"
                      placeholder="e.g. SpeedDemonX"
                      value={formData.customer_name}
                      onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#FFD700]/50 focus:ring-0 rounded-sm py-2.5 pl-10 text-xs text-white placeholder:text-zinc-700 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block pl-1">Verify Email (Hidden)</label>
                  <div className="relative">
                    <Loader2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 ${isUploading ? 'animate-spin' : 'hidden'}`} />
                    <input 
                      type="email"
                      placeholder="Your order email"
                      value={formData.customer_email}
                      onChange={e => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#FFD700]/50 focus:ring-0 rounded-sm py-2.5 px-3 text-xs text-white placeholder:text-zinc-700 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Review Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block pl-1">Your Testimonial</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                  <textarea 
                    rows={3}
                    placeholder="Tell other racers about your experience..."
                    value={formData.review}
                    onChange={e => setFormData(prev => ({ ...prev, review: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#FFD700]/50 focus:ring-0 rounded-sm py-3 pl-10 text-xs text-white placeholder:text-zinc-700 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block pl-1">Proof Screenshot</label>
                {!formData.image_url ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-zinc-800 hover:border-[#FFD700]/30 bg-zinc-900/20 py-8 text-center cursor-pointer transition-all rounded-sm"
                  >
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#FFD700]/10 transition-colors">
                      <Camera className="w-6 h-6 text-zinc-600 group-hover:text-[#FFD700]" />
                    </div>
                    <p className="text-[11px] font-bold text-zinc-400 group-hover:text-white uppercase tracking-wider mb-1">Click to Upload</p>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase">Auto-Compressed (Max 50MB source)</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className="relative group aspect-video rounded-sm overflow-hidden border border-zinc-800">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image_url: "" }));
                          setSelectedFile(null);
                        }}
                        className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm sm:skew-x-[-10deg]"
                      >
                         <span className="sm:skew-x-[10deg]">Remove Screenshot</span>
                      </button>
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-900 flex items-center justify-end gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || !formData.image_url}
                  className={`flex items-center gap-2 px-8 py-2.5 bg-[#FFD700] text-black font-black text-[10px] uppercase tracking-widest skew-x-[-10deg] transition-all relative ${
                    isUploading || !formData.image_url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white active:scale-95'
                  }`}
                >
                  <span className="skew-x-[10deg]">{isUploading ? 'Processing...' : 'Submit Proof'}</span>
                  {!isUploading && <CheckCircle className="w-3 h-3 skew-x-[10deg]" />}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
