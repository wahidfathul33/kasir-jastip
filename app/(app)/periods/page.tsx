import ConfirmButton from "@/components/ConfirmButton";
import DataTable, { type DataRow } from "@/components/DataTable";
import FormDialog from "@/components/FormDialog";
import SwitchForm from "@/components/SwitchForm";
import { deletePeriod, savePeriod, togglePeriod } from "@/lib/actions";
import { fmtDate, toDateInput } from "@/lib/format";
import { getPeriods } from "@/lib/queries";
import type { Period } from "@/lib/types";

function PeriodForm({ p }: { p?: Period }) {
  return (
    <form action={savePeriod} className="space-y-3">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div><label className="label">Nama periode</label><input name="name" required defaultValue={p?.name} className="input" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Mulai</label><input name="start_date" type="date" defaultValue={toDateInput(p?.start_date)} className="input" /></div>
        <div><label className="label">Selesai</label><input name="end_date" type="date" defaultValue={toDateInput(p?.end_date)} className="input" /></div>
      </div>
      <div className="flex justify-end"><button className="btn">Simpan</button></div>
    </form>
  );
}

export default async function PeriodsPage() {
  const periods = await getPeriods();
  const rows: DataRow[] = periods.map((p) => ({
    key: p.id,
    search: `${p.name} ${fmtDate(p.start_date)} ${fmtDate(p.end_date)} ${p.is_active ? "aktif" : ""}`,
    cells: [
      p.name,
      fmtDate(p.start_date),
      fmtDate(p.end_date),
      <SwitchForm key="s" action={togglePeriod} id={p.id} checked={p.is_active} label={`${p.is_active ? "Nonaktifkan" : "Aktifkan"} ${p.name}`} />,
      <div key="a" className="flex justify-end gap-2">
        <FormDialog trigger="Edit" title={`Edit ${p.name}`}><PeriodForm p={p} /></FormDialog>
        <form action={deletePeriod}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message={`Hapus periode ${p.name}? Pesanan tetap ada tetapi tanpa periode.`}>Hapus</ConfirmButton>
        </form>
      </div>,
    ],
  }));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Periode</h1>
      <p className="text-sm text-slate-600">Periode = satu batch/gelombang jastip (mis. &quot;Open PO Oktober&quot;). Periode aktif otomatis dipakai di pesanan baru.</p>
      <DataTable
        columns={[
          { label: "Nama periode" },
          { label: "Mulai", className: "w-36" },
          { label: "Selesai", className: "w-36" },
          { label: "Aktif", className: "w-24 text-center" },
          { label: "Aksi", className: "w-44 text-right" },
        ]}
        rows={rows}
        searchPlaceholder="Cari periode..."
        emptyText="Belum ada periode."
        toolbar={<FormDialog trigger="+ Tambah periode" triggerClassName="btn" title="Tambah periode"><PeriodForm /></FormDialog>}
      />
    </div>
  );
}
