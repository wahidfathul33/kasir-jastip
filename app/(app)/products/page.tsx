import ConfirmButton from "@/components/ConfirmButton";
import DataTable, { type DataRow } from "@/components/DataTable";
import FormDialog from "@/components/FormDialog";
import MoneyInput from "@/components/MoneyInput";
import SwitchForm from "@/components/SwitchForm";
import { deleteProduct, saveProduct, toggleProduct } from "@/lib/actions";
import { rupiah } from "@/lib/format";
import { getProducts } from "@/lib/queries";
import type { Product } from "@/lib/types";

function ProductForm({ p }: { p?: Product }) {
  return (
    <form action={saveProduct} className="space-y-3">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div><label className="label" htmlFor={`name-${p?.id ?? "baru"}`}>Nama produk</label><input id={`name-${p?.id ?? "baru"}`} name="name" required defaultValue={p?.name} className="input" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Harga jual (Rp)</label><MoneyInput name="price" defaultValue={p?.price ?? 0} /></div>
        <div><label className="label">Jasa per qty (Rp)</label><MoneyInput name="fee" defaultValue={p?.fee ?? 0} /></div>
      </div>
      <div className="flex justify-end"><button className="btn">Simpan</button></div>
    </form>
  );
}

export default async function ProductsPage() {
  const products = await getProducts();
  const rows: DataRow[] = products.map((p) => ({
    key: p.id,
    search: p.name,
    cells: [
      <span key="n" className={p.is_active ? "" : "text-slate-400"}>{p.name}</span>,
      rupiah(p.price),
      rupiah(p.fee),
      <SwitchForm key="s" action={toggleProduct} id={p.id} checked={p.is_active} label={`${p.is_active ? "Nonaktifkan" : "Aktifkan"} ${p.name}`} />,
      <div key="a" className="flex justify-end gap-2">
        <FormDialog trigger="Edit" title={`Edit ${p.name}`}><ProductForm p={p} /></FormDialog>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message={`Hapus produk ${p.name}? Riwayat pesanan tetap tersimpan.`}>Hapus</ConfirmButton>
        </form>
      </div>,
    ],
  }));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Produk</h1>
      <DataTable
        columns={[
          { label: "Produk" },
          { label: "Harga", className: "w-36 text-right" },
          { label: "Jasa per qty", className: "w-36 text-right" },
          { label: "Aktif", className: "w-24 text-center" },
          { label: "Aksi", className: "w-44 text-right" },
        ]}
        rows={rows}
        searchPlaceholder="Cari produk..."
        emptyText="Belum ada produk."
        toolbar={<FormDialog trigger="+ Tambah produk" triggerClassName="btn" title="Tambah produk"><ProductForm /></FormDialog>}
      />
    </div>
  );
}
