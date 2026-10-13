import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-emerald-700">Kasir Jastip</h1>
        <p className="mb-4 text-sm text-slate-500">Masukkan password untuk melanjutkan.</p>
        <LoginForm />
      </div>
    </div>
  );
}
