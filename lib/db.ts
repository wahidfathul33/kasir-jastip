import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL belum di-set");
    client = neon(url);
  }
  return client;
}

// Tagged-template helper yang selalu mengembalikan array baris.
export async function q<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const sql = getSql();
  return (await sql(strings, ...values)) as unknown as T[];
}
