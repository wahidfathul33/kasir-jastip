import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set");
const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS settings (
    id integer PRIMARY KEY CHECK (id = 1),
    store_name text NOT NULL DEFAULT 'Toko Jastip',
    address text NOT NULL DEFAULT '',
    phone text NOT NULL DEFAULT '',
    cashier_name text NOT NULL DEFAULT 'Admin',
    footer_note text NOT NULL DEFAULT 'Terima kasih atas kepercayaan Anda',
    paper_width integer NOT NULL DEFAULT 80
  )`,
  `INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
  `CREATE TABLE IF NOT EXISTS periods (
    id serial PRIMARY KEY,
    name text NOT NULL,
    start_date date,
    end_date date,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id serial PRIMARY KEY,
    name text NOT NULL,
    price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id serial PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL DEFAULT '',
    address text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    period_id integer REFERENCES periods(id) ON DELETE SET NULL,
    customer_id integer REFERENCES customers(id) ON DELETE SET NULL,
    customer_name text NOT NULL DEFAULT 'Umum',
    status text NOT NULL DEFAULT 'belum_bayar'
      CHECK (status IN ('belum_bayar','dibayar','diproses','dikirim','selesai')),
    fee integer NOT NULL DEFAULT 0 CHECK (fee >= 0),
    shipping integer NOT NULL DEFAULT 0 CHECK (shipping >= 0),
    paid_amount integer NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    payment_method text NOT NULL DEFAULT 'Tunai',
    note text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id serial PRIMARY KEY,
    order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id integer REFERENCES products(id) ON DELETE SET NULL,
    name text NOT NULL,
    price integer NOT NULL CHECK (price >= 0),
    qty integer NOT NULL CHECK (qty > 0)
  )`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS fee_qty integer NOT NULL DEFAULT 1 CHECK (fee_qty >= 0)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS box_fee integer NOT NULL DEFAULT 15000 CHECK (box_fee >= 0)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS box_qty integer NOT NULL DEFAULT 0 CHECK (box_qty >= 0)`,
  `CREATE INDEX IF NOT EXISTS orders_period_idx ON orders(period_id)`,
  `CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id)`,
];

for (const s of statements) await sql.query(s);
const [{ n }] = await sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`;
console.log(`Migrasi selesai. Jumlah tabel di schema public: ${n}`);
