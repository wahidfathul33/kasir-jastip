"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE, safeEqual, sessionToken } from "./auth";
import { q } from "./db";
import { PAYMENT_METHODS, STATUSES, type Status } from "./types";

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const int = (f: FormData, k: string) => {
  const n = Math.round(Number(String(f.get(k) ?? "0").replace(/[^\d-]/g, "")));
  return Number.isFinite(n) && n >= 0 && n <= 2_000_000_000 ? n : 0;
};
const dateOrNull = (f: FormData, k: string) => {
  const v = str(f, k, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

// ---------- Auth ----------
export async function login(_: { error?: string } | undefined, f: FormData) {
  const pw = String(f.get("password") ?? "");
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected || !safeEqual(pw, expected)) return { error: "Password salah" };
  (await cookies()).set(COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

// ---------- Pengaturan toko ----------
export async function saveSettings(f: FormData) {
  const width = int(f, "paper_width") === 58 ? 58 : 80;
  await q`UPDATE settings SET
    store_name = ${str(f, "store_name", 80) || "Toko Jastip"},
    address = ${str(f, "address", 200)},
    phone = ${str(f, "phone", 40)},
    cashier_name = ${str(f, "cashier_name", 40) || "Admin"},
    footer_note = ${str(f, "footer_note", 200)},
    paper_width = ${width}
    WHERE id = 1`;
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

// ---------- Produk ----------
export async function saveProduct(f: FormData) {
  const id = int(f, "id");
  const name = str(f, "name", 120);
  if (!name) return;
  const price = int(f, "price");
  const fee = int(f, "fee");
  if (id) await q`UPDATE products SET name = ${name}, price = ${price}, fee = ${fee} WHERE id = ${id}`;
  else await q`INSERT INTO products (name, price, fee) VALUES (${name}, ${price}, ${fee})`;
  revalidatePath("/products");
  revalidatePath("/orders/new");
}

export async function toggleProduct(f: FormData) {
  const id = int(f, "id");
  await q`UPDATE products SET is_active = NOT is_active WHERE id = ${id}`;
  revalidatePath("/products");
  revalidatePath("/orders/new");
}

export async function deleteProduct(f: FormData) {
  await q`DELETE FROM products WHERE id = ${int(f, "id")}`;
  revalidatePath("/products");
  revalidatePath("/orders/new");
}

// ---------- Customer ----------
export async function saveCustomer(f: FormData) {
  const id = int(f, "id");
  const name = str(f, "name", 100);
  if (!name) return;
  const phone = str(f, "phone", 40);
  const address = str(f, "address", 300);
  if (id) {
    await q`UPDATE customers SET name = ${name}, phone = ${phone}, address = ${address} WHERE id = ${id}`;
    await q`UPDATE orders SET customer_name = ${name} WHERE customer_id = ${id}`;
  } else {
    await q`INSERT INTO customers (name, phone, address) VALUES (${name}, ${phone}, ${address})`;
  }
  revalidatePath("/customers");
  revalidatePath("/orders/new");
}

export async function deleteCustomer(f: FormData) {
  await q`DELETE FROM customers WHERE id = ${int(f, "id")}`;
  revalidatePath("/customers");
  revalidatePath("/orders/new");
}

// ---------- Periode ----------
export async function savePeriod(f: FormData) {
  const id = int(f, "id");
  const name = str(f, "name", 80);
  if (!name) return;
  const start = dateOrNull(f, "start_date");
  const end = dateOrNull(f, "end_date");
  if (id) {
    await q`UPDATE periods SET name = ${name}, start_date = ${start}, end_date = ${end} WHERE id = ${id}`;
  } else {
    const hasActive = (await q`SELECT 1 FROM periods WHERE is_active LIMIT 1`).length > 0;
    await q`INSERT INTO periods (name, start_date, end_date, is_active) VALUES (${name}, ${start}, ${end}, ${!hasActive})`;
  }
  revalidatePath("/", "layout");
}

export async function activatePeriod(f: FormData) {
  const id = int(f, "id");
  await q`UPDATE periods SET is_active = (id = ${id})`;
  revalidatePath("/", "layout");
}

export async function deletePeriod(f: FormData) {
  await q`DELETE FROM periods WHERE id = ${int(f, "id")}`;
  revalidatePath("/", "layout");
}

// ---------- Pesanan ----------
export type NewOrderInput = {
  customerId: number | null;
  customerName: string;
  periodId: number | null;
  items: { productId: number | null; name: string; note?: string; price: number; fee?: number; qty: number }[];
  shipping: number;
  paid: number;
  method: string;
  note: string;
};

const clampInt = (n: unknown, max = 2_000_000_000) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) && v >= 0 && v <= max ? v : NaN;
};

async function parseOrder(input: NewOrderInput) {
  const items = (input.items ?? [])
    .map((i) => ({
      product_id: i.productId && Number.isInteger(i.productId) ? i.productId : null,
      name: String(i.name ?? "").trim().slice(0, 120),
      note: String(i.note ?? "").trim().slice(0, 200),
      price: clampInt(i.price),
      fee: clampInt(i.fee ?? 0),
      qty: clampInt(i.qty, 100000),
    }))
    .filter((i) => i.name);
  if (items.length === 0) return { error: "Tambahkan minimal satu barang" };
  if (items.some((i) => Number.isNaN(i.price) || Number.isNaN(i.fee) || Number.isNaN(i.qty) || i.qty < 1))
    return { error: "Harga, jasa, atau jumlah barang tidak valid" };

  const shipping = clampInt(input.shipping);
  const paid = clampInt(input.paid);
  if ([shipping, paid].some(Number.isNaN)) return { error: "Nominal biaya/pembayaran tidak valid" };

  const total = items.reduce((s, i) => s + (i.price + i.fee) * i.qty, 0) + shipping;
  const status: Status = paid >= total ? "dibayar" : "belum_bayar";
  const method = (PAYMENT_METHODS as readonly string[]).includes(input.method) ? input.method : "Tunai";

  let customerId = input.customerId && Number.isInteger(input.customerId) ? input.customerId : null;
  let customerName = String(input.customerName ?? "").trim().slice(0, 100) || "Umum";
  if (customerId) {
    const c = await q<{ name: string }>`SELECT name FROM customers WHERE id = ${customerId}`;
    if (c[0]) customerName = c[0].name;
    else customerId = null;
  }
  const periodId = input.periodId && Number.isInteger(input.periodId) ? input.periodId : null;
  const note = String(input.note ?? "").trim().slice(0, 300);

  return { items, shipping, paid, status, method, customerId, customerName, periodId, note };
}

export async function createOrder(input: NewOrderInput): Promise<{ id?: number; error?: string }> {
  const d = await parseOrder(input);
  if ("error" in d) return { error: d.error };

  const rows = await q<{ order_id: number }>`
    WITH o AS (
      INSERT INTO orders (period_id, customer_id, customer_name, status, shipping, paid_amount, payment_method, note)
      VALUES (${d.periodId}, ${d.customerId}, ${d.customerName}, ${d.status}, ${d.shipping}, ${d.paid}, ${d.method}, ${d.note})
      RETURNING id
    )
    INSERT INTO order_items (order_id, product_id, name, note, price, fee, qty)
    SELECT o.id, (i->>'product_id')::int, i->>'name', i->>'note', (i->>'price')::int, (i->>'fee')::int, (i->>'qty')::int
    FROM o, jsonb_array_elements(${JSON.stringify(d.items)}::jsonb) AS i
    RETURNING order_id`;
  revalidatePath("/");
  return { id: rows[0].order_id };
}

// Edit hanya diperbolehkan selama status masih "belum_bayar"; dijaga di WHERE agar atomik.
export async function updateOrder(id: number, input: NewOrderInput): Promise<{ id?: number; error?: string }> {
  if (!Number.isInteger(id) || id < 1) return { error: "Pesanan tidak ditemukan" };
  const d = await parseOrder(input);
  if ("error" in d) return { error: d.error };

  const rows = await q<{ order_id: number }>`
    WITH o AS (
      UPDATE orders SET period_id = ${d.periodId}, customer_id = ${d.customerId}, customer_name = ${d.customerName},
        status = ${d.status},
        shipping = ${d.shipping}, paid_amount = ${d.paid}, payment_method = ${d.method}, note = ${d.note}, updated_at = now()
      WHERE id = ${id} AND status = 'belum_bayar'
      RETURNING id
    ), del AS (
      DELETE FROM order_items WHERE order_id IN (SELECT id FROM o)
    )
    INSERT INTO order_items (order_id, product_id, name, note, price, fee, qty)
    SELECT o.id, (i->>'product_id')::int, i->>'name', i->>'note', (i->>'price')::int, (i->>'fee')::int, (i->>'qty')::int
    FROM o, jsonb_array_elements(${JSON.stringify(d.items)}::jsonb) AS i
    RETURNING order_id`;
  if (!rows[0]) return { error: "Pesanan tidak bisa diedit karena sudah dibayar atau tidak ditemukan" };
  revalidatePath("/");
  revalidatePath(`/orders/${id}`);
  return { id };
}

export async function setOrderStatus(f: FormData) {
  const id = int(f, "id");
  const status = str(f, "status", 20) as Status;
  if (!id || !STATUSES.includes(status)) return;
  await q`UPDATE orders SET status = ${status}, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/");
  revalidatePath(`/orders/${id}`);
}

export async function payOrder(f: FormData) {
  const id = int(f, "id");
  const method = str(f, "method", 20);
  if (!id) return;
  const m = (PAYMENT_METHODS as readonly string[]).includes(method) ? method : "Tunai";
  // Lunasi: paid_amount = total, dan naikkan status dari belum_bayar -> dibayar.
  await q`UPDATE orders o SET
      paid_amount = GREATEST(o.paid_amount, COALESCE((SELECT SUM((i.price + i.fee) * i.qty) FROM order_items i WHERE i.order_id = o.id), 0) + o.shipping),
      payment_method = ${m},
      status = CASE WHEN o.status = 'belum_bayar' THEN 'dibayar' ELSE o.status END,
      updated_at = now()
    WHERE o.id = ${id}`;
  revalidatePath("/");
  revalidatePath(`/orders/${id}`);
}

export async function deleteOrder(f: FormData) {
  await q`DELETE FROM orders WHERE id = ${int(f, "id")}`;
  revalidatePath("/");
  redirect("/");
}
