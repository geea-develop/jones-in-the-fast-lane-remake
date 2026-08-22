"use client";

import { memo, useEffect, useState, useCallback } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  type: "info" | "success" | "error" | "jones";
}

let nextId = 0;

/**
 * Hook to manage toast messages. Returns [toasts, addToast, dismissToast].
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastMessage["type"] = "info") => {
    const id = nextId++;
    setToasts((prev) => [{ id, text, type }, ...prev].slice(0, 5));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast } as const;
}

/**
 * Floating toast container — renders in bottom-left, stacked upward.
 */
export const ToastContainer = memo(function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-12 left-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
});

const ToastItem = memo(function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const animationFrame = requestAnimationFrame(() => setVisible(true));
    let dismissTimer: ReturnType<typeof setTimeout> | undefined;
    // Auto-dismiss after 4s
    const timer = setTimeout(() => {
      setVisible(false);
      dismissTimer = setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  const colors = {
    info: "bg-gray-800 border-gray-600",
    success: "bg-green-900/80 border-green-600",
    error: "bg-red-900/80 border-red-600",
    jones: "bg-purple-900/80 border-purple-600",
  };

  return (
    <div
      className={`pointer-events-auto px-4 py-2.5 rounded-lg border shadow-lg text-sm transition-all duration-300 ${colors[toast.type]} ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      }`}
    >
      {toast.text}
    </div>
  );
});
