import { APP_NAME } from "@/lib/app";
import Link from "next/link";
import { logout } from "@/lib/actions";

const links = [
  { href: "/", label: "Pesanan" },
  { href: "/orders/new", label: "+ Pesanan Baru" },
  { href: "/products", label: "Produk" },
  { href: "/customers", label: "Customer" },
  { href: "/periods", label: "Periode" },
  { href: "/settings", label: "Toko" },
];

export default function Nav() {
  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-1 px-4 py-2">
        <span className="mr-3 text-base font-bold text-emerald-700">{APP_NAME}</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
            {l.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto">
          <button className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 cursor-pointer">Keluar</button>
        </form>
      </div>
    </header>
  );
}
