"use client";

import { useEffect, useRef } from "react";

interface GameDialogProps {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

export function GameDialog({ title, eyebrow, children, confirmLabel, cancelLabel = "CLOSE", onConfirm, onClose }: GameDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07101dcc] p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="game-dialog-title" className="game-dialog retro-panel w-full max-w-lg p-1 outline-none">
        <div className="border border-[#8a7a4c] bg-[#263552] p-5">
          {eyebrow && <p className="pixel-text mb-2 text-[8px] text-cyan-300">{eyebrow}</p>}
          <h2 id="game-dialog-title" className="pixel-text mb-4 text-sm leading-relaxed text-[#ffe39b]">{title}</h2>
          <div className="text-sm text-[#f4edcf]">{children}</div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="retro-btn bg-slate-700 hover:bg-slate-600">{cancelLabel}</button>
            {onConfirm && <button type="button" onClick={onConfirm} className="retro-btn bg-emerald-700 hover:bg-emerald-600">{confirmLabel ?? "CONFIRM"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
