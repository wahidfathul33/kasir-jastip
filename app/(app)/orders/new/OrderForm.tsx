"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder, updateOrder } from "@/lib/actions";
import MoneyInput from "@/components/MoneyInput";
import SearchSelect from "@/components/SearchSelect";
import { rupiah } from "@/lib/format";
import { PAYMENT_METHODS, type Customer, type Order, type OrderItem, type Period, type Product } from "@/lib/types";

type SubLine = { key: number; productId: number | null; name: string; price: string; qty: string };
type Line = { key: number; productId: number | null; name: string; note: string; showNote: boolean; subs: SubLine[]; showSubs: boolean; price: string; fee: string; qty: string };

let seq = 1;
const emptyLine = (): Line => ({ key: seq++, productId: null, name: "", note: "", showNote: false, subs: [], showSubs: false, price: "", fee: "", qty: "1" });
const emptySub = (): SubLine => ({ key: seq++, productId: null, name: "", price: "", qty: "1" });
const namedSubs = (l: Line) => l.subs.filter((s) => s.name.trim());
// Harga barang: kalau ada isi box, dihitung dari jumlah harga isinya.
const linePrice = (l: Line) => {
  const subs = namedSubs(l);
  return subs.length ? subs.reduce((t, s) => t + toInt(s.price) * (toInt(s.qty) || 0), 0) : toInt(l.price);
};
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
      ? editing.items.map((i) => ({ key: seq++, productId: i.product_id, name: i.name, note: i.note, showNote: !!i.note, subs: i.sub_items.map((x) => ({ key: seq++, productId: null, name: x.name, price: String(x.price), qty: String(x.qty) })), showSubs: i.sub_items.length > 0, price: String(i.price), fee: String(i.fee), qty: String(i.qty) }))
      : [emptyLine()],
  );
  const [shipping, setShipping] = useState(String(o?.shipping ?? 0));
  const [paid, setPaid] = useState(String(o?.paid_amount ?? 0));
  const [method, setMethod] = useState<string>(o?.payment_method ?? "Tunai");
  const [note, setNote] = useState(o?.note ?? "");

  const productOptions = useMemo(() => products.map((p) => ({ ...p, meta: rupiah(p.price) })), [products]);
  const customerOptions = useMemo(() => customers.map((c) => ({ ...c, meta: c.phone })), [customers]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + linePrice(l) * (toInt(l.qty) || 0), 0), [lines]);
  const feeSum = useMemo(() => lines.reduce((s, l) => s + toInt(l.fee) * (toInt(l.qty) || 0), 0), [lines]);
  const total = subtotal + feeSum + toInt(shipping);
  const diff = toInt(paid) - total;

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const updateSub = (key: number, subKey: number, patch: Partial<SubLine>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, subs: l.subs.map((x) => (x.key === subKey ? { ...x, ...patch } : x)) } : l)));

  function pickProduct(key: number, p: Product | null) {
    if (p) update(key, { productId: p.id, name: p.name, price: String(p.price), fee: String(p.fee) });
    else update(key, { productId: null });
  }

  function submit() {
    setError("");
    const items = lines
      .filter((l) => l.name.trim())
      .map((l) => ({
        productId: l.productId,
        name: l.name.trim(),
        note: l.note.trim(),
        price: linePrice(l),
        fee: toInt(l.fee),
        qty: toInt(l.qty),
        subItems: namedSubs(l).map((x) => ({ name: x.name.trim(), price: toInt(x.price), qty: toInt(x.qty) })),
      }));
    if (items.length === 0) return setError("Tambahkan minimal satu barang");
    if (items.some((i) => i.qty < 1)) return setError("Jumlah barang minimal 1");
    if (items.some((i) => i.subItems.some((x) => x.qty < 1))) return setError("Jumlah isi box minimal 1");
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
            <SearchSelect id="customer" items={customerOptions} value={customerId ? Number(customerId) : null} onPick={(c) => setCustomerId(c ? String(c.id) : "")} emptyLabel="— Umum / ketik manual —" searchPlaceholder="Cari customer..." />
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
                <SearchSelect items={productOptions} value={l.productId} onPick={(p) => pickProduct(l.key, p)} emptyLabel="— Barang manual —" searchPlaceholder="Cari produk..." />
              </div>
              <div className="col-span-12 sm:col-span-8 lg:col-span-3">
                <label className="label">Nama barang</label>
                <input className="input" value={l.name} onChange={(e) => update(l.key, { name: e.target.value, productId: null })} />
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                <label className="label">Harga</label>
                <MoneyInput
                  value={namedSubs(l).length ? String(linePrice(l)) : l.price}
                  onValueChange={(v) => update(l.key, { price: v })}
                  disabled={namedSubs(l).length > 0}
                  title={namedSubs(l).length ? "Dihitung dari isi box" : undefined}
                />
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
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  aria-expanded={l.showNote}
                  onClick={() => update(l.key, { showNote: !l.showNote })}
                >
                  <span aria-hidden>{l.showNote ? "▾" : "▸"}</span>
                  Catatan barang{!l.showNote && l.note.trim() ? ` · ${l.note.trim()}` : ""}
                </button>
                {l.showNote && (
                  <input
                    className="input mt-1"
                    value={l.note}
                    onChange={(e) => update(l.key, { note: e.target.value })}
                    placeholder="Detail jenis, mis. isi 1 box"
                    aria-label="Catatan barang"
                  />
                )}
              </div>
              <div className="col-span-12">
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  aria-expanded={l.showSubs}
                  onClick={() =>
                    setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, showSubs: !x.showSubs, subs: !x.showSubs && x.subs.length === 0 ? [emptySub()] : x.subs } : x)))
                  }
                >
                  <span aria-hidden>{l.showSubs ? "▾" : "▸"}</span>
                  Isi box (opsional){!l.showSubs && namedSubs(l).length > 0 ? ` · ${namedSubs(l).length} produk` : ""}
                </button>
                {l.showSubs && (
                  <div className="mt-2 space-y-2 border-l-2 border-emerald-200 pl-3">
                    {l.subs.map((x) => (
                      <div key={x.key} className="grid grid-cols-12 items-end gap-2">
                        <div className="col-span-12 sm:col-span-4">
                          <label className="label">Produk isi</label>
                          <SearchSelect
                            items={productOptions}
                            value={x.productId}
                            onPick={(p) => updateSub(l.key, x.key, p ? { productId: p.id, name: p.name, price: String(p.price) } : { productId: null })}
                            emptyLabel="— Barang manual —"
                            searchPlaceholder="Cari produk..."
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                          <label className="label">Nama</label>
                          <input className="input" value={x.name} onChange={(e) => updateSub(l.key, x.key, { name: e.target.value, productId: null })} />
                        </div>
                        <div className="col-span-5 sm:col-span-2">
                          <label className="label">Harga</label>
                          <MoneyInput value={x.price} onValueChange={(v) => updateSub(l.key, x.key, { price: v })} />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <label className="label">Qty</label>
                          <input className="input" inputMode="numeric" value={x.qty} onChange={(e) => updateSub(l.key, x.key, { qty: e.target.value.replace(/[^\d]/g, "") })} />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <button type="button" className="btn-danger w-full" aria-label="Hapus isi"
                            onClick={() => update(l.key, { subs: l.subs.filter((y) => y.key !== x.key) })}>✕</button>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" className="btn-ghost" onClick={() => update(l.key, { subs: [...l.subs, emptySub()] })}>+ Tambah isi</button>
                      {namedSubs(l).length > 0 && <span className="text-xs text-slate-600">Harga box = {rupiah(linePrice(l))}</span>}
                    </div>
                  </div>
                )}
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
