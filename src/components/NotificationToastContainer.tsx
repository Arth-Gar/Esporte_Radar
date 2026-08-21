import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { InAppToast, subscribeToInAppToasts } from '../utils/notificationService';

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToInAppToasts((newToast) => {
      setToasts((prev) => [newToast, ...prev].slice(0, 3)); // Keep max 3 toasts visible

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all ${
              toast.type === 'success'
                ? 'bg-[#031c10]/95 border-emerald-500/60 text-white'
                : toast.type === 'alert'
                ? 'bg-[#220a0a]/95 border-red-500/60 text-white'
                : 'bg-[#05180e]/95 border-green-700/60 text-white'
            }`}
          >
            {toast.icon ? (
              <img
                src={toast.icon}
                alt="Logo"
                className="w-7 h-7 object-contain rounded-full bg-black/40 p-0.5 shrink-0 mt-0.5 border border-white/20"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-seagreen/20 border border-seagreen/40 flex items-center justify-center text-seagreen shrink-0 mt-0.5">
                {toast.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : toast.type === 'alert' ? (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                ) : (
                  <BellRing className="h-4 w-4 text-amber-400 animate-pulse" />
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold uppercase tracking-tight text-white flex items-center gap-1.5 truncate">
                {toast.title}
              </h5>
              <p className="text-[11px] text-green-200/90 mt-0.5 leading-snug line-clamp-3">
                {toast.body}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
