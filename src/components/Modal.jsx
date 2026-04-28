"use client";

import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black sm:text-2xl">{title}</h2>

          <button
            onClick={onClose}
            className="rounded-2xl bg-[#fff2d8] p-2 text-[#2a1608]"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}