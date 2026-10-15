import { fmtDateTime, num, orderCode } from "@/lib/format";
import { orderTotal } from "@/lib/queries";
import { STATUS_LABEL, type Order, type OrderItem, type Settings } from "@/lib/types";

export default function Receipt({ order, items, settings }: { order: Order; items: OrderItem[]; settings: Settings }) {
  const total = orderTotal(order);
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
            <div className="row">
              <span>&nbsp;&nbsp;{i.qty} x {num(i.price)}</span>
              <span>{num(i.price * i.qty)}</span>
            </div>
          </div>
        ))}
        <div className="sep" />
        <div className="row"><span>Total Barang</span><span>{num(order.subtotal)}</span></div>
        {order.fee * order.fee_qty > 0 && (
          <div className="row">
            <span>Jasa {order.fee_qty} x {num(order.fee)}</span>
            <span>{num(order.fee * order.fee_qty)}</span>
          </div>
        )}
        {order.box_fee * order.box_qty > 0 && (
          <div className="row">
            <span>Jasa Box {order.box_qty} x {num(order.box_fee)}</span>
            <span>{num(order.box_fee * order.box_qty)}</span>
          </div>
        )}
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
      </div>
    </>
  );
}
