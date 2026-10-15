"use client";

import { useMemo, useState, type ReactNode } from "react";

export type DataRow = { key: string | number; search: string; cells: ReactNode[] };
export type DataColumn = { label: string; className?: string };

// Tabel baca-saja dengan pencarian dan paginasi di sisi klien.
export default function DataTable({
  columns,
  rows,
  toolbar,
  searchPlaceholder = "Cari...",
  emptyText = "Belum ada data.",
  pageSize = 10,
}: {
  columns: DataColumn[];
  rows: DataRow[];
  toolbar?: ReactNode;
  searchPlaceholder?: string;
  emptyText?: string;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? rows.filter((r) => r.search.toLowerCase().includes(term)) : rows;
  }, [rows, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div className="card space-y-3 p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <input
          type="search"
          className="input max-w-xs"
          placeholder={searchPlaceholder}
          aria-label="Cari"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        {toolbar}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-y border-slate-200 bg-slate-50">
            <tr>{columns.map((c) => (<th key={c.label} className={`th ${c.className ?? ""}`}>{c.label}</th>))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr><td colSpan={columns.length} className="td py-8 text-center text-slate-500">{query ? "Tidak ada hasil yang cocok." : emptyText}</td></tr>
            )}
            {visible.map((r) => (
              <tr key={r.key} className="hover:bg-slate-50">
                {r.cells.map((cell, i) => (<td key={i} className={`td ${columns[i]?.className ?? ""}`}>{cell}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 pb-4 text-sm text-slate-600">
        <span>
          {filtered.length === 0 ? "0 data" : `${current * pageSize + 1}–${current * pageSize + visible.length} dari ${filtered.length}`}
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost" disabled={current === 0} onClick={() => setPage(current - 1)}>‹</button>
            <span>{current + 1} / {pages}</span>
            <button type="button" className="btn-ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
