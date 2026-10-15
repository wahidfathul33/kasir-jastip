// Switch aktif/nonaktif: form kecil yang memanggil server action saat diklik.
export default function SwitchForm({
  action,
  id,
  checked,
  label,
}: {
  action: (f: FormData) => void | Promise<void>;
  id: number;
  checked: boolean;
  label: string;
}) {
  return (
    <form action={action} className="flex justify-center">
      <input type="hidden" name="id" value={id} />
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-slate-300"}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </form>
  );
}
