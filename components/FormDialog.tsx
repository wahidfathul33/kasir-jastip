"use client";

import { useRef, useState, type ReactNode } from "react";

// Tombol yang membuka dialog berisi form (server action). Dialog menutup saat form dikirim;
// isi form dibuat ulang setiap dibuka agar input kembali ke nilai awal.
export default function FormDialog({
  trigger,
  title,
  triggerClassName = "btn-ghost",
  children,
}: {
  trigger: ReactNode;
  title: string;
  triggerClassName?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [openCount, setOpenCount] = useState(0);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          setOpenCount((n) => n + 1);
          ref.current?.showModal();
        }}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-900/40"
        aria-label={title}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" className="cursor-pointer px-2 text-slate-500 hover:text-slate-800" aria-label="Tutup" onClick={() => ref.current?.close()}>✕</button>
        </div>
        <div className="p-4" onSubmit={() => ref.current?.close()}>
          <div key={openCount}>{children}</div>
        </div>
      </dialog>
    </>
  );
}
