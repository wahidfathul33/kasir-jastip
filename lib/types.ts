export const STATUSES = ["belum_bayar", "dibayar", "diproses", "dikirim", "selesai"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  belum_bayar: "Belum Dibayar",
  dibayar: "Sudah Dibayar",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
};

export const STATUS_COLOR: Record<Status, string> = {
  belum_bayar: "bg-red-100 text-red-700",
  dibayar: "bg-amber-100 text-amber-800",
  diproses: "bg-blue-100 text-blue-700",
  dikirim: "bg-purple-100 text-purple-700",
  selesai: "bg-green-100 text-green-700",
};

export const PAYMENT_METHODS = ["Tunai", "Transfer", "QRIS"] as const;

export type Settings = {
  store_name: string;
  address: string;
  phone: string;
  cashier_name: string;
  footer_note: string;
  paper_width: number;
};
export type Period = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};
export type Product = { id: number; name: string; price: number; fee: number; is_active: boolean };
export type Customer = { id: number; name: string; phone: string; address: string };
// Isi box (opsional): harga barang box = jumlah (price x qty) seluruh isinya.
export type SubItem = { name: string; price: number; qty: number };
export type OrderItem = { id: number; product_id: number | null; name: string; note: string; price: number; fee: number; qty: number; sub_items: SubItem[] };
export type Order = {
  id: number;
  period_id: number | null;
  period_name: string | null;
  customer_id: number | null;
  customer_name: string;
  status: Status;
  shipping: number;
  paid_amount: number;
  payment_method: string;
  note: string;
  created_at: string | Date;
  subtotal: number; // total barang
  fee_total: number; // total jasa (jasa per barang x qty)
};
