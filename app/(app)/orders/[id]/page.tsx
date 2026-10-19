import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/ConfirmButton";
import Receipt from "@/components/Receipt";
import PrintButton from "@/components/PrintButton";
import DownloadReceipt from "@/components/DownloadReceipt";
import StatusBadge from "@/components/StatusBadge";
import { deleteOrder, payOrder, setOrderStatus } from "@/lib/actions";
import { orderCode, rupiah } from "@/lib/format";
import { getOrder, getSettings, orderTotal } from "@/lib/queries";
import { PAYMENT_METHODS, STATUSES, STATUS_LABEL } from "@/lib/types";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string; diubah?: string }>;
}) {
  const { id } = await params;
  const { baru, diubah } = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const [data, settings] = await Promise.all([getOrder(Number(id)), getSettings()]);
  if (!data) notFound();
  const { order, items } = data;
  const total = orderTotal(order);
  const unpaid = order.paid_amount < total;
  const canDelete = order.status === "belum_bayar" && order.paid_amount === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="no-print space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="text-sm text-emerald-700 hover:underline">← Semua pesanan</Link>
        </div>
        {baru && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Pesanan berhasil disimpan.</div>}
        {diubah && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Pesanan berhasil diubah.</div>}
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-lg font-bold">{orderCode(order.id, order.created_at)}</h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-sm text-slate-600">Customer: <b>{order.customer_name}</b></div>
          <div className="text-sm text-slate-600">Periode: {order.period_name ?? "-"}</div>
          <div className="text-sm text-slate-600">Barang: {rupiah(order.subtotal)} · Jasa: {rupiah(order.fee_total)}{order.shipping > 0 && <> · Ongkir: {rupiah(order.shipping)}</>}</div>
          <div className="text-sm text-slate-600">Total: <b>{rupiah(total)}</b> · Dibayar: {rupiah(order.paid_amount)} ({order.payment_method})</div>
          {unpaid && <div className="text-sm font-medium text-red-600">Kurang {rupiah(total - order.paid_amount)}</div>}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Ubah status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <form key={s} action={setOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value={s} />
                <button className={s === order.status ? "btn" : "btn-ghost"} disabled={s === order.status}>{STATUS_LABEL[s]}</button>
              </form>
            ))}
          </div>
          {unpaid && (
            <form action={payOrder} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
              <input type="hidden" name="id" value={order.id} />
              <div>
                <label className="label" htmlFor="method">Lunasi dengan</label>
                <select id="method" name="method" className="input" defaultValue={order.payment_method}>
                  {PAYMENT_METHODS.map((m) => (<option key={m}>{m}</option>))}
                </select>
              </div>
              <button className="btn">Tandai lunas ({rupiah(total - order.paid_amount)})</button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <PrintButton auto={!!baru} />
          <DownloadReceipt filename={`nota-${orderCode(order.id, order.created_at)}`} widthMm={settings.paper_width === 58 ? 58 : 80} />
          {order.status === "belum_bayar" && <Link href={`/orders/${order.id}/edit`} className="btn-ghost">Edit pesanan</Link>}
          {canDelete ? (
            <form action={deleteOrder}>
              <input type="hidden" name="id" value={order.id} />
              <ConfirmButton message="Hapus pesanan ini? Tindakan tidak bisa dibatalkan.">Hapus pesanan</ConfirmButton>
            </form>
          ) : (
            <span className="self-center text-xs text-slate-500">Pesanan yang sudah dibayar tidak bisa dihapus.</span>
          )}
        </div>
      </div>

      <div className="receipt-wrap card bg-slate-100">
        <Receipt order={order} items={items} settings={settings} />
      </div>
    </div>
  );
}
