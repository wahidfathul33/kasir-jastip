import { getActivePeriod, getCustomers, getPeriods, getProducts } from "@/lib/queries";
import OrderForm from "./OrderForm";

export default async function NewOrderPage() {
  const [products, customers, periods, active] = await Promise.all([
    getProducts(true),
    getCustomers(),
    getPeriods(),
    getActivePeriod(),
  ]);
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Pesanan Baru</h1>
      <OrderForm products={products} customers={customers} periods={periods} defaultPeriodId={active?.id ?? null} />
    </div>
  );
}
