const TZ = "Asia/Jakarta";

export const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
export const num = (n: number) => Math.round(n).toLocaleString("id-ID");

export function fmtDateTime(d: string | Date) {
  return new Date(d).toLocaleString("id-ID", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function fmtDate(d: string | Date | null) {
  if (!d) return "-";
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T00:00:00") : new Date(d);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function orderCode(id: number, createdAt: string | Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(createdAt));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `JT${get("year")}${get("month")}${get("day")}-${String(id).padStart(4, "0")}`;
}

// Ubah nilai kolom date dari Postgres (Date atau string) menjadi YYYY-MM-DD untuk <input type=date>.
export function toDateInput(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  const d = v as Date;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
