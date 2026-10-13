import ConfirmButton from "@/components/ConfirmButton";
import { activatePeriod, deletePeriod, savePeriod } from "@/lib/actions";
import { toDateInput } from "@/lib/format";
import { getPeriods } from "@/lib/queries";

export default async function PeriodsPage() {
  const periods = await getPeriods();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Periode</h1>
      <p className="text-sm text-slate-600">Periode = satu batch/gelombang jastip (mis. &quot;Open PO Oktober&quot;). Periode aktif otomatis dipakai di pesanan baru.</p>
      <form action={savePeriod} className="card grid items-end gap-3 sm:grid-cols-[1fr_160px_160px_auto]">
        <div><label className="label" htmlFor="name">Nama periode</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="start_date">Mulai</label><input id="start_date" name="start_date" type="date" className="input" /></div>
        <div><label className="label" htmlFor="end_date">Selesai</label><input id="end_date" name="end_date" type="date" className="input" /></div>
        <button className="btn">Tambah</button>
      </form>
      <div className="space-y-2">
        {periods.length === 0 && <div className="card text-center text-sm text-slate-500">Belum ada periode.</div>}
        {periods.map((p) => (
          <div key={p.id} className="card grid items-center gap-2 p-3 sm:grid-cols-[1fr_150px_150px_auto_auto_auto]">
            <form action={savePeriod} className="contents">
              <input type="hidden" name="id" value={p.id} />
              <input name="name" defaultValue={p.name} required className="input" aria-label="Nama" />
              <input name="start_date" type="date" defaultValue={toDateInput(p.start_date)} className="input" aria-label="Mulai" />
              <input name="end_date" type="date" defaultValue={toDateInput(p.end_date)} className="input" aria-label="Selesai" />
              <button className="btn-ghost">Simpan</button>
            </form>
            <form action={activatePeriod}><input type="hidden" name="id" value={p.id} />
              <button className={p.is_active ? "btn" : "btn-ghost"} disabled={p.is_active}>{p.is_active ? "Aktif" : "Aktifkan"}</button></form>
            <form action={deletePeriod}><input type="hidden" name="id" value={p.id} />
              <ConfirmButton message={`Hapus periode ${p.name}? Pesanan tetap ada tetapi tanpa periode.`}>Hapus</ConfirmButton></form>
          </div>
        ))}
      </div>
    </div>
  );
}
