"use client";

import { useEffect } from "react";

export default function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [auto]);
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      🖨 Cetak nota
    </button>
  );
}
