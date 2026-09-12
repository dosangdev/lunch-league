"use client";

import { AlertTriangle, Key, X } from "lucide-react";
import { useEffect } from "react";

export type ToastTone = "success" | "warning" | "info";

const toastClass: Record<ToastTone, string> = {
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-600 text-white",
  info: "bg-indigo-600 text-white",
};

export function ToastStack({
  toasts,
}: {
  toasts: { id: number; message: string; tone: ToastTone }[];
}) {
  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow-xl ${toastClass[toast.tone]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function AuthModal({
  open,
  pin,
  error,
  onPinChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  pin: string;
  error: string;
  onPinChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") onSubmit();
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onSubmit]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
            <Key className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">관리자 비밀번호 입력</h3>
          <p className="text-xs text-slate-500">점심리그 운영을 위한 관리자 PIN을 입력해 주세요.</p>
        </div>
        <div>
          <input
            type="password"
            maxLength={10}
            value={pin}
            onChange={(event) => onPinChange(event.target.value)}
            placeholder="PIN 번호 입력"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-xl font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            autoFocus
          />
          {error ? <p className="mt-1.5 text-center text-xs font-bold text-rose-500">{error}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onCancel}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700"
          >
            확인
          </button>
        </div>
        <button onClick={onCancel} className="sr-only">
          <X />
        </button>
      </div>
    </div>
  );
}
