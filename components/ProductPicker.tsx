"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { rupiah } from "@/lib/format";
import type { Product } from "@/lib/types";

// Pilihan produk dengan kotak pencarian (mirip select2).
export default function ProductPicker({
  products,
  value,
  onPick,
}: {
  products: Product[];
  value: number | null;
  onPick: (product: Product | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = products.find((p) => p.id === value) ?? null;
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? products.filter((p) => p.name.toLowerCase().includes(term)) : products;
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    setOpen((o) => !o);
    setQuery("");
    setActive(0);
    setTimeout(() => search.current?.focus(), 0);
  }

  function choose(p: Product | null) {
    onPick(p);
    setOpen(false);
  }

  // Indeks 0 = "Barang manual", lalu hasil pencarian.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active === 0 ? null : results[active - 1] ?? null);
    }
  }

  return (
    <div ref={root} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        className="input flex cursor-pointer items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggle}
      >
        <span className={`truncate ${selected ? "" : "text-slate-500"}`}>{selected ? selected.name : "— Barang manual —"}</span>
        <span aria-hidden className="text-xs text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-56 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={search}
              className="input"
              placeholder="Cari produk..."
              aria-label="Cari produk"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(e.target.value ? 1 : 0);
              }}
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-60 overflow-y-auto py-1 text-sm">
            <li
              role="option"
              aria-selected={!selected}
              className={`cursor-pointer px-3 py-2 text-slate-500 ${active === 0 ? "bg-emerald-50" : "hover:bg-slate-50"}`}
              onMouseEnter={() => setActive(0)}
              onClick={() => choose(null)}
            >
              — Barang manual —
            </li>
            {results.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={p.id === value}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 ${active === i + 1 ? "bg-emerald-50" : "hover:bg-slate-50"} ${p.id === value ? "font-medium" : ""}`}
                onMouseEnter={() => setActive(i + 1)}
                onClick={() => choose(p)}
              >
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{rupiah(p.price)}</span>
              </li>
            ))}
            {results.length === 0 && <li className="px-3 py-2 text-slate-500">Produk tidak ditemukan</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
