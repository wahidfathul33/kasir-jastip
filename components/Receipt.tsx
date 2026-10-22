import { fmtDateTime, num, orderCode } from "@/lib/format";
import { orderTotal } from "@/lib/queries";
import { STATUS_LABEL, type Order, type OrderItem, type Settings } from "@/lib/types";

export default function Receipt({ order, items, settings }: { order: Order; items: OrderItem[]; settings: Settings }) {
  const total = orderTotal(order);
  // Jasa dikelompokkan per tarif, mis. "Jasa 2 x 3.000" dan "Jasa 1 x 15.000".
  const feeByRate = new Map<number, number>();
  for (const i of items) if (i.fee > 0) feeByRate.set(i.fee, (feeByRate.get(i.fee) ?? 0) + i.qty);
  const feeLines = [...feeByRate].map(([fee, qty]) => ({ fee, qty }));
  const diff = order.paid_amount - total;
  const width = settings.paper_width === 58 ? "58mm" : "80mm";
  const chars = settings.paper_width === 58 ? 32 : 42;

  return (
    <>
      <style>{`@media print { @page { size: ${width} auto; margin: 2mm; } .receipt { width: 100% !important; } }`}</style>
      <div className="receipt mx-auto p-2" style={{ width, maxWidth: "100%" }} data-chars={chars}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase" }}>{settings.store_name}</div>
          {settings.address && <div>{settings.address}</div>}
          {settings.phone && <div>Telp: {settings.phone}</div>}
        </div>
        <div className="sep" />
        <div className="row"><span>{fmtDateTime(order.created_at)}</span><span>Kasir: {settings.cashier_name}</span></div>
        <div>No : {orderCode(order.id, order.created_at)}</div>
        <div>Cust: {order.customer_name}</div>
        {order.period_name && <div>Periode: {order.period_name}</div>}
        <div className="sep" />
        {items.map((i) => (
          <div key={i.id} style={{ marginBottom: 3 }}>
            <div style={{ wordBreak: "break-word" }}>{i.name}</div>
            {i.note && <div style={{ wordBreak: "break-word", fontSize: 11 }}>&nbsp;&nbsp;({i.note})</div>}
            {i.sub_items.map((s, n) => (
              <div key={n} style={{ fontSize: 11, paddingLeft: "1.2em" }}>
                <div style={{ wordBreak: "break-word" }}>- {s.name}</div>
                <div className="row" style={{ paddingLeft: "1.2em" }}>
                  <span>{s.qty} x {num(s.price)}</span>
                  <span>{num(s.price * s.qty)}</span>
                </div>
              </div>
            ))}
            <div className="row">
              <span>&nbsp;&nbsp;{i.qty} x {num(i.price)}</span>
              <span>{num(i.price * i.qty)}</span>
            </div>
          </div>
        ))}
        <div className="sep" />
        <div className="row"><span>Total Barang</span><span>{num(order.subtotal)}</span></div>
        {feeLines.map((f) => (
          <div key={f.fee} className="row"><span>Jasa {f.qty} x {num(f.fee)}</span><span>{num(f.fee * f.qty)}</span></div>
        ))}
        {order.shipping > 0 && <div className="row"><span>Ongkir</span><span>{num(order.shipping)}</span></div>}
        <div className="row" style={{ fontWeight: 700, fontSize: 14 }}><span>TOTAL</span><span>{num(total)}</span></div>
        <div className="row"><span>{order.payment_method.toUpperCase()}</span><span>{num(order.paid_amount)}</span></div>
        <div className="row"><span>{diff >= 0 ? "KEMBALI" : "KURANG"}</span><span>{num(Math.abs(diff))}</span></div>
        <div className="sep" />
        <div style={{ textAlign: "center" }}>
          <div>Status: {STATUS_LABEL[order.status].toUpperCase()}</div>
          {order.note && <div>Catatan: {order.note}</div>}
          {settings.footer_note && <div style={{ marginTop: 4 }}>{settings.footer_note}</div>}
        </div>
        <div className="sep" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>Bayar via QRIS</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qris.png" alt="QRIS" style={{ width: "85%", margin: "4px auto 0", display: "block" }} />
        </div>
      </div>
    </>
  );
}
