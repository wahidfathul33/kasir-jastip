"use client";

import { useState } from "react";
import { toCanvas } from "html-to-image";

const MM_TO_PT = 72 / 25.4;

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dataUrlBytes(dataUrl: string) {
  const bin = atob(dataUrl.split(",")[1]);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// PDF 1 halaman berisi gambar JPEG; ukuran halaman mengikuti lebar kertas nota.
function jpegToPdf(jpeg: Uint8Array, imgW: number, imgH: number, widthMm: number) {
  const pageW = +(widthMm * MM_TO_PT).toFixed(2);
  const pageH = +((pageW * imgH) / imgW).toFixed(2);
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (d: string | Uint8Array) => {
    const b = typeof d === "string" ? enc.encode(d) : d;
    parts.push(b);
    length += b.length;
  };
  const obj = (n: number, body: string | Uint8Array[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    if (typeof body === "string") push(body);
    else body.forEach(push);
    push("\nendobj\n");
  };

  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;
  push("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, [
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    jpeg,
    "\nendstream",
  ].map((p) => (typeof p === "string" ? enc.encode(p) : p)));
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xref = length;
  push(`xref\n0 6\n0000000000 65535 f \n`);
  for (let n = 1; n <= 5; n++) push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

export default function DownloadReceipt({ filename, widthMm }: { filename: string; widthMm: number }) {
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [open, setOpen] = useState(false);

  async function download(kind: "png" | "pdf") {
    const el = document.querySelector<HTMLElement>(".receipt");
    setOpen(false);
    if (!el) return;
    setBusy(kind);
    try {
      // margin: auto pada nota ikut tersalin sebagai px besar dan menggeser isi keluar kanvas.
      const canvas = await toCanvas(el, { pixelRatio: 3, backgroundColor: "#ffffff", style: { margin: "0" } });
      if (kind === "png") {
        canvas.toBlob((b) => b && save(b, `${filename}.png`), "image/png");
      } else {
        const jpeg = dataUrlBytes(canvas.toDataURL("image/jpeg", 0.95));
        save(jpegToPdf(jpeg, canvas.width, canvas.height, widthMm), `${filename}.pdf`);
      }
    } catch {
      alert("Gagal membuat file nota. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative">
      <button type="button" className="btn-ghost" disabled={busy !== null} onClick={() => setOpen((o) => !o)}>
        {busy ? "Memproses…" : "⬇ Unduh nota ▾"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
            <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => download("png")}>
              Gambar (PNG)
            </button>
            <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => download("pdf")}>
              PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
