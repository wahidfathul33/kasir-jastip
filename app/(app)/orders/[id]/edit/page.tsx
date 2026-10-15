import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCustomers, getOrder, getPeriods, getProducts } from "@/lib/queries";
import { orderCode } from "@/lib/format";
import OrderForm from "../../new/OrderForm";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [data, products, customers, periods] = await Promise.all([
    getOrder(Number(id)),
    getProducts(true),
    getCustomers(),
    getPeriods(),
  ]);
  if (!data) notFound();
  if (data.order.status !== "belum_bayar") redirect(`/orders/${id}`);
  return (
    <div className="space-y-3">
      <Link href={`/orders/${id}`} className="text-sm text-emerald-700 hover:underline">← Kembali ke pesanan</Link>
      <h1 className="text-xl font-bold">Edit Pesanan <span className="font-mono">{orderCode(data.order.id, data.order.created_at)}</span></h1>
      <OrderForm products={products} customers={customers} periods={periods} defaultPeriodId={null} editing={data} />
    </div>
  );
}
