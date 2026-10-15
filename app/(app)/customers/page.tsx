import ConfirmButton from "@/components/ConfirmButton";
import DataTable, { type DataRow } from "@/components/DataTable";
import FormDialog from "@/components/FormDialog";
import { deleteCustomer, saveCustomer } from "@/lib/actions";
import { getCustomers } from "@/lib/queries";
import type { Customer } from "@/lib/types";

function CustomerForm({ c }: { c?: Customer }) {
  return (
    <form action={saveCustomer} className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div><label className="label">Nama</label><input name="name" required defaultValue={c?.name} className="input" /></div>
      <div><label className="label">No. HP</label><input name="phone" defaultValue={c?.phone} className="input" /></div>
      <div><label className="label">Alamat</label><input name="address" defaultValue={c?.address} className="input" /></div>
      <div className="flex justify-end"><button className="btn">Simpan</button></div>
    </form>
  );
}

export default async function CustomersPage() {
  const customers = await getCustomers();
  const rows: DataRow[] = customers.map((c) => ({
    key: c.id,
    search: `${c.name} ${c.phone} ${c.address}`,
    cells: [
      c.name,
      c.phone || "-",
      c.address || "-",
      <div key="a" className="flex justify-end gap-2">
        <FormDialog trigger="Edit" title={`Edit ${c.name}`}><CustomerForm c={c} /></FormDialog>
        <form action={deleteCustomer}>
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton message={`Hapus customer ${c.name}? Riwayat pesanan tetap tersimpan.`}>Hapus</ConfirmButton>
        </form>
      </div>,
    ],
  }));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Customer</h1>
      <DataTable
        columns={[
          { label: "Nama" },
          { label: "No. HP", className: "w-40" },
          { label: "Alamat" },
          { label: "Aksi", className: "w-44 text-right" },
        ]}
        rows={rows}
        searchPlaceholder="Cari nama, HP, atau alamat..."
        emptyText="Belum ada customer."
        toolbar={<FormDialog trigger="+ Tambah customer" triggerClassName="btn" title="Tambah customer"><CustomerForm /></FormDialog>}
      />
    </div>
  );
}
