"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder, updateOrder } from "@/lib/actions";
import MoneyInput from "@/components/MoneyInput";
import { rupiah } from "@/lib/format";
import { PAYMENT_METHODS, type Customer, type Order, type OrderItem, type Period, type Product } from "@/lib/types";

type Line = { key: number; productId: number | null; name: string; note: string; price: string; fee: string; qty: string };

let seq = 1;
const emptyLine = (): Line => ({ key: seq++, productId: null, name: "", note: "", price: "", fee: "", qty: "1" });
const toInt = (v: string) => {
  const n = Math.round(Number(v.replace(/[^\d]/g, "")));
  return Number.isFinite(n) ? n : 0;
};

export default function OrderForm({
  products,
  customers,
  periods,
  defaultPeriodId,
  editing,
}: {
  products: Product[];
  customers: Customer[];
  periods: Period[];
  defaultPeriodId: number | null;
  editing?: { order: Order; items: OrderItem[] };
}) {
  const o = editing?.order;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState<string>(o?.customer_id ? String(o.customer_id) : "");
  const [customerName, setCustomerName] = useState(o && !o.customer_id ? o.customer_name : "");
  const [periodId, setPeriodId] = useState<string>(o ? (o.period_id ? String(o.period_id) : "") : defaultPeriodId ? String(defaultPeriodId) : "");
  const [lines, setLines] = useState<Line[]>(
    editing
      ? editing.items.map((i) => ({ key: seq++, productId: i.product_id, name: i.name, note: i.note, price: String(i.price), fee: String(i.fee), qty: String(i.qty) }))
      : [emptyLine()],
  );
  const [shipping, setShipping] = useState(String(o?.shipping ?? 0));
  const [paid, setPaid] = useState(String(o?.paid_amount ?? 0));
  const [method, setMethod] = useState<string>(o?.payment_method ?? "Tunai");
  const [note, setNote] = useState(o?.note ?? "");

  const subtotal = useMemo(() => lines.reduce((s, l) => s + toInt(l.price) * (toInt(l.qty) || 0), 0), [lines]);
  const feeSum = useMemo(() => lines.reduce((s, l) => s + toInt(l.fee) * (toInt(l.qty) || 0), 0), [lines]);
  const total = subtotal + feeSum + toInt(shipping);
  const diff = toInt(paid) - total;

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function pickProduct(key: number, value: string) {
    const p = products.find((x) => String(x.id) === value);
    if (p) update(key, { productId: p.id, name: p.name, price: String(p.price), fee: String(p.fee) });
    else update(key, { productId: null });
  }

  function submit() {
    setError("");
    const items = lines
      .filter((l) => l.name.trim())
      .map((l) => ({ productId: l.productId, name: l.name.trim(), note: l.note.trim(), price: toInt(l.price), fee: toInt(l.fee), qty: toInt(l.qty) }));
    if (items.length === 0) return setError("Tambahkan minimal satu barang");
    if (items.some((i) => i.qty < 1)) return setError("Jumlah barang minimal 1");
    start(async () => {
      const input = {
        customerId: customerId ? Number(customerId) : null,
        customerName,
        periodId: periodId ? Number(periodId) : null,
        items,
        shipping: toInt(shipping),
        paid: toInt(paid),
        method,
        note,
      };
      const res = editing ? await updateOrder(editing.order.id, input) : await createOrder(input);
      if (res.error || !res.id) return setError(res.error ?? "Gagal menyimpan pesanan");
      router.push(editing ? `/orders/${res.id}?diubah=1` : `/orders/${res.id}?baru=1`);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="customer">Customer tersimpan</label>
            <select id="customer" className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— Umum / ketik manual —</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cname">Nama customer (jika tidak dipilih)</label>
            <input id="cname" className="input" disabled={!!customerId} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Umum" />
          </div>
          <div>
            <label className="label" htmlFor="period">Periode</label>
            <select id="period" className="input" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
              <option value="">— Tanpa periode —</option>
              {periods.map((p) => (<option key={p.id} value={p.id}>{p.name}{p.is_active ? " (aktif)" : ""}</option>))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="note">Catatan</label>
            <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Barang</h2>
          {lines.map((l) => (
            <div key={l.key} className="grid grid-cols-12 items-end gap-2 border-b border-slate-100 pb-3">
              <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                <label className="label">Produk</label>
                <select className="input" value={l.productId ?? ""} onChange={(e) => pickProduct(l.key, e.target.value)}>
                  <option value="">— Barang manual —</option>
                  {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div className="col-span-12 sm:col-span-8 lg:col-span-3">
                <label className="label">Nama barang</label>
                <input className="input" value={l.name} onChange={(e) => update(l.key, { name: e.target.value, productId: null })} />
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                <label className="label">Harga</label>
                <MoneyInput value={l.price} onValueChange={(v) => update(l.key, { price: v })} />
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                <label className="label">Jasa</label>
                <MoneyInput value={l.fee} onValueChange={(v) => update(l.key, { fee: v })} placeholder="0" />
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-1">
                <label className="label">Qty</label>
                <input className="input" inputMode="numeric" value={l.qty} onChange={(e) => update(l.key, { qty: e.target.value.replace(/[^\d]/g, "") })} />
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-1">
                <button type="button" className="btn-danger w-full" aria-label="Hapus baris"
                  onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [emptyLine()]))}>✕</button>
              </div>
              <div className="col-span-12">
                <label className="label">Catatan barang (detail jenis, mis. isi 1 box)</label>
                <input className="input" value={l.note} onChange={(e) => update(l.key, { note: e.target.value })} placeholder="Opsional" />
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => setLines((ls) => [...ls, emptyLine()])}>+ Tambah barang</button>
        </div>
      </div>

      <div className="card h-fit space-y-3">
        <h2 className="font-semibold">Pembayaran</h2>
        <div className="flex justify-between text-sm"><span>Total barang</span><span>{rupiah(subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Total jasa</span><span>{rupiah(feeSum)}</span></div>
        <div>
          <label className="label" htmlFor="ship">Ongkir</label>
          <MoneyInput id="ship" value={shipping} onValueChange={setShipping} />
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold"><span>Total</span><span>{rupiah(total)}</span></div>
        <div>
          <label className="label" htmlFor="method">Metode bayar</label>
          <select id="method" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (<option key={m}>{m}</option>))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="paid">Jumlah dibayar</label>
          <MoneyInput id="paid" value={paid} onValueChange={setPaid} />
          <button type="button" className="mt-1 text-xs text-emerald-700 hover:underline cursor-pointer" onClick={() => setPaid(String(total))}>Uang pas</button>
        </div>
        <div className="flex justify-between text-sm">
          <span>{diff >= 0 ? "Kembalian" : "Kurang"}</span>
          <span className={diff >= 0 ? "text-green-700" : "text-red-600"}>{rupiah(Math.abs(diff))}</span>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="button" className="btn w-full" disabled={pending} onClick={submit}>{pending ? "Menyimpan..." : editing ? "Simpan perubahan" : "Simpan pesanan"}</button>
      </div>
    </div>
  );
}
