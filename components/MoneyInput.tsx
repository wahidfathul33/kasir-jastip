"use client";

import { useState, type InputHTMLAttributes } from "react";

const digits = (v: string) => v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
const withDots = (v: string) => (v ? Number(v).toLocaleString("id-ID") : "");

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type"> & {
  value?: string;
  defaultValue?: string | number;
  onValueChange?: (digitsOnly: string) => void;
};

// Input nominal dengan pemisah ribuan (titik). Nilai yang dikirim ke form tetap berformat titik;
// server membersihkannya lagi menjadi angka. onValueChange menerima angka murni.
export default function MoneyInput({ value, defaultValue, onValueChange, className = "input", ...rest }: Props) {
  const [inner, setInner] = useState(digits(String(defaultValue ?? "")));
  const current = value !== undefined ? digits(value) : inner;
  return (
    <input
      {...rest}
      className={className}
      inputMode="numeric"
      autoComplete="off"
      value={withDots(current)}
      onChange={(e) => {
        const d = digits(e.target.value);
        setInner(d);
        onValueChange?.(d);
      }}
    />
  );
}
