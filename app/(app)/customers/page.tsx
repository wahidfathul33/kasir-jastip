import ConfirmButton from "@/components/ConfirmButton";
import { deleteCustomer, saveCustomer } from "@/lib/actions";
import { getCustomers } from "@/lib/queries";

export default async function CustomersPage() {
  const customers = await getCustomers();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Customer</h1>
      <form action={saveCustomer} className="card grid items-end gap-3 sm:grid-cols-[1fr_180px_1fr_auto]">
        <div><label className="label" htmlFor="name">Nama</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="phone">No. HP</label><input id="phone" name="phone" className="input" /></div>
        <div><label className="label" htmlFor="address">Alamat</label><input id="address" name="address" className="input" /></div>
        <button className="btn">Tambah</button>
      </form>
      <div className="space-y-2">
        {customers.length === 0 && <div className="card text-center text-sm text-slate-500">Belum ada customer.</div>}
        {customers.map((c) => (
          <div key={c.id} className="card grid items-center gap-2 p-3 sm:grid-cols-[1fr_160px_1fr_auto_auto]">
            <form action={saveCustomer} className="contents">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} required className="input" aria-label="Nama" />
              <input name="phone" defaultValue={c.phone} className="input" aria-label="No. HP" />
              <input name="address" defaultValue={c.address} className="input" aria-label="Alamat" />
              <button className="btn-ghost">Simpan</button>
            </form>
            <form action={deleteCustomer}><input type="hidden" name="id" value={c.id} />
              <ConfirmButton message={`Hapus customer ${c.name}? Riwayat pesanan tetap tersimpan.`}>Hapus</ConfirmButton></form>
          </div>
        ))}
      </div>
    </div>
  );
}
