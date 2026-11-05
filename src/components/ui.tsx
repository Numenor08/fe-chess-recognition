import type { ReactNode } from "react";

export function PanelTitle({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <b className="mt-1 text-xs tracking-widest text-slate-400">{number}</b>
      <div>
        <h2 className="m-0 text-base font-semibold">{title}</h2>
        <p className="mt-1 mb-0 text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="text-xs font-semibold">
      <span className="mb-1.5 block">
        {label}{" "}
        {hint && <small className="ml-1 font-normal text-slate-400">{hint}</small>}
      </span>
      {children}
    </label>
  );
}
