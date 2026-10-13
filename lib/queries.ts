import { q } from "./db";
import type { Customer, Order, OrderItem, Period, Product, Settings, Status } from "./types";

export async function getSettings(): Promise<Settings> {
  const rows = await q<Settings>`SELECT store_name, address, phone, cashier_name, footer_note, paper_width FROM settings WHERE id = 1`;
  return rows[0];
}

export const getPeriods = () =>
  q<Period>`SELECT id, name, start_date, end_date, is_active FROM periods ORDER BY is_active DESC, id DESC`;

export const getActivePeriod = async () =>
  (await q<Period>`SELECT id, name, start_date, end_date, is_active FROM periods WHERE is_active LIMIT 1`)[0] ?? null;

export const getProducts = (onlyActive = false) =>
  onlyActive
    ? q<Product>`SELECT id, name, price, is_active FROM products WHERE is_active ORDER BY name`
    : q<Product>`SELECT id, name, price, is_active FROM products ORDER BY name`;

export const getCustomers = () =>
  q<Customer>`SELECT id, name, phone, address FROM customers ORDER BY name`;


export async function getOrders(filter: { periodId?: number; status?: Status; search?: string }) {
  const periodId = filter.periodId ?? null;
  const status = filter.status ?? null;
  const search = filter.search ? `%${filter.search}%` : null;
  return q<Order>`
    SELECT o.id, o.period_id, p.name AS period_name, o.customer_id, o.customer_name, o.status,
      o.fee, o.shipping, o.paid_amount, o.payment_method, o.note, o.created_at,
      COALESCE((SELECT SUM(i.price * i.qty) FROM order_items i WHERE i.order_id = o.id), 0)::int AS subtotal
    FROM orders o LEFT JOIN periods p ON p.id = o.period_id
    WHERE (${periodId}::int IS NULL OR o.period_id = ${periodId}::int)
      AND (${status}::text IS NULL OR o.status = ${status}::text)
      AND (${search}::text IS NULL OR o.customer_name ILIKE ${search}::text)
    ORDER BY o.id DESC
    LIMIT 300`;
}

export async function getOrder(id: number) {
  const rows = await q<Order>`
    SELECT o.id, o.period_id, p.name AS period_name, o.customer_id, o.customer_name, o.status,
      o.fee, o.shipping, o.paid_amount, o.payment_method, o.note, o.created_at,
      COALESCE((SELECT SUM(i.price * i.qty) FROM order_items i WHERE i.order_id = o.id), 0)::int AS subtotal
    FROM orders o LEFT JOIN periods p ON p.id = o.period_id
    WHERE o.id = ${id}`;
  if (!rows[0]) return null;
  const items = await q<OrderItem>`SELECT id, product_id, name, price, qty FROM order_items WHERE order_id = ${id} ORDER BY id`;
  return { order: rows[0], items };
}

export const orderTotal = (o: Pick<Order, "subtotal" | "fee" | "shipping">) => o.subtotal + o.fee + o.shipping;

