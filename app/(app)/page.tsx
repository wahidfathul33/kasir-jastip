import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { fmtDateTime, orderCode, rupiah } from "@/lib/format";
import { getActivePeriod, getOrders, getPeriods, orderTotal } from "@/lib/queries";
import { STATUSES, STATUS_LABEL, type Status } from "@/lib/types";

type SP = Promise<{ periode?: string; status?: string; q?: string }>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const periods = await getPeriods();
  const active = await getActivePeriod();

  // "semua" = tanpa filter periode; default = periode aktif.
  let periodId: number | undefined;
  if (sp.periode === "semua") periodId = undefined;
  else if (sp.periode && Number.isInteger(Number(sp.periode))) periodId = Number(sp.periode);
  else periodId = active?.id;

  const status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const search = sp.q?.trim() || undefined;
  const orders = await getOrders({ periodId, status, search });

  const totalAll = orders.reduce((s, o) => s + orderTotal(o), 0);
  const unpaid = orders.filter((o) => o.status === "belum_bayar").length;
  const counts = Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card"><div className="text-xs text-slate-500">Jumlah pesanan</div><div className="text-2xl font-bold">{orders.length}</div></div>
        <div className="card"><div className="text-xs text-slate-500">Total nilai</div><div className="text-2xl font-bold">{rupiah(totalAll)}</div></div>
        <div className="card"><div className="text-xs text-slate-500">Belum dibayar</div><div className="text-2xl font-bold text-red-600">{unpaid}</div></div>
        <div className="card"><div className="text-xs text-slate-500">Selesai</div><div className="text-2xl font-bold text-green-700">{counts.selesai}</div></div>
      </div>

      <form className="card flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="label" htmlFor="periode">Periode</label>
          <select id="periode" name="periode" defaultValue={periodId ? String(periodId) : "semua"} className="input">
            <option value="semua">Semua periode</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.is_active ? " (aktif)" : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="input">
            <option value="">Semua status</option>
            {STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
          </select>
        </div>
        <div className="min-w-40 flex-1">
          <label className="label" htmlFor="q">Cari customer</label>
          <input id="q" name="q" defaultValue={search ?? ""} className="input" placeholder="Nama customer" />
        </div>
        <button className="btn">Terapkan</button>
        <Link href="/orders/new" className="btn">+ Pesanan Baru</Link>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr><th className="th">No</th><th className="th">Tanggal</th><th className="th">Customer</th><th className="th">Periode</th><th className="th text-right">Total</th><th className="th">Status</th><th className="th"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 && (
              <tr><td colSpan={7} className="td py-8 text-center text-slate-500">Belum ada pesanan{status || search ? " yang cocok dengan filter" : ""}.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="td font-mono text-xs">{orderCode(o.id, o.created_at)}</td>
                <td className="td whitespace-nowrap">{fmtDateTime(o.created_at)}</td>
                <td className="td">{o.customer_name}</td>
                <td className="td">{o.period_name ?? "-"}</td>
                <td className="td text-right whitespace-nowrap">{rupiah(orderTotal(o))}</td>
                <td className="td"><StatusBadge status={o.status} /></td>
                <td className="td text-right"><Link href={`/orders/${o.id}`} className="text-emerald-700 hover:underline">Buka</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
