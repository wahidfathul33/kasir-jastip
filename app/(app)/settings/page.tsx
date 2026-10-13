import { saveSettings } from "@/lib/actions";
import { getSettings } from "@/lib/queries";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Pengaturan Toko</h1>
      {sp.saved && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Pengaturan disimpan.</div>}
      <form action={saveSettings} className="card space-y-3">
        <div><label className="label" htmlFor="store_name">Nama toko</label><input id="store_name" name="store_name" defaultValue={s.store_name} required className="input" /></div>
        <div><label className="label" htmlFor="address">Alamat (tampil di nota)</label><input id="address" name="address" defaultValue={s.address} className="input" /></div>
        <div><label className="label" htmlFor="phone">No. telepon</label><input id="phone" name="phone" defaultValue={s.phone} className="input" /></div>
        <div><label className="label" htmlFor="cashier_name">Nama kasir</label><input id="cashier_name" name="cashier_name" defaultValue={s.cashier_name} className="input" /></div>
        <div><label className="label" htmlFor="footer_note">Catatan kaki nota</label><input id="footer_note" name="footer_note" defaultValue={s.footer_note} className="input" /></div>
        <div>
          <label className="label" htmlFor="paper_width">Lebar kertas nota</label>
          <select id="paper_width" name="paper_width" defaultValue={String(s.paper_width)} className="input">
            <option value="80">80 mm</option>
            <option value="58">58 mm</option>
          </select>
        </div>
        <button className="btn">Simpan</button>
      </form>
    </div>
  );
}
