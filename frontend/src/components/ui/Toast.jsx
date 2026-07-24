import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed top-5 right-5 z-[300] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`pointer-events-auto flex items-start gap-3 bg-white rounded-2xl p-4 shadow-xl border max-w-sm w-full ${
              t.type === "success" ? "border-emerald-200" :
              t.type === "error"   ? "border-red-200" :
              "border-slate-100"
            }`}
          >
            <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
              t.type === "success" ? "bg-emerald-100 text-emerald-600" :
              t.type === "error"   ? "bg-red-100 text-red-600" :
              "bg-blue-100 text-blue-600"
            }`}>
              {t.type === "success" ? (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              ) : t.type === "error" ? (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              )}
            </div>
            <div className="flex-1">
              {t.title && <p className="font-semibold text-slate-900 text-sm">{t.title}</p>}
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss?.(t.id)}
              className="size-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer border-none shrink-0"
            >
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
