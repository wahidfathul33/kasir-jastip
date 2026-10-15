import ConfirmButton from "@/components/ConfirmButton";
import MoneyInput from "@/components/MoneyInput";
import { deleteProduct, saveProduct, toggleProduct } from "@/lib/actions";
import { rupiah } from "@/lib/format";
import { getProducts } from "@/lib/queries";

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Produk</h1>
      <form action={saveProduct} className="card grid items-end gap-3 sm:grid-cols-[1fr_180px_auto]">
        <div><label className="label" htmlFor="name">Nama produk</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="price">Harga jual (Rp)</label><MoneyInput id="price" name="price" defaultValue="0" /></div>
        <button className="btn">Tambah</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Produk</th><th className="th">Harga</th><th className="th">Aktif</th><th className="th"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 && <tr><td colSpan={4} className="td py-8 text-center text-slate-500">Belum ada produk.</td></tr>}
            {products.map((p) => (
              <tr key={p.id}>
                <td className="td" colSpan={2}>
                  <form action={saveProduct} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="name" defaultValue={p.name} required className="input" aria-label="Nama" />
                    <MoneyInput name="price" defaultValue={p.price} aria-label={`Harga ${rupiah(p.price)}`} />
                    <button className="btn-ghost">Simpan</button>
                  </form>
                </td>
                <td className="td">
                  <form action={toggleProduct}><input type="hidden" name="id" value={p.id} />
                    <button className={p.is_active ? "btn-ghost" : "btn-danger"}>{p.is_active ? "Aktif" : "Nonaktif"}</button></form>
                </td>
                <td className="td text-right">
                  <form action={deleteProduct}><input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message={`Hapus produk ${p.name}? Riwayat pesanan tetap tersimpan.`}>Hapus</ConfirmButton></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
