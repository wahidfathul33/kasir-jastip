"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" autoFocus required className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Memeriksa..." : "Masuk"}</button>
    </form>
  );
}
