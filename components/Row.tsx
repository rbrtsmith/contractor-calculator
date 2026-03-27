import { useId } from "react";

export const Row = ({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) => {
  const id = useId();
  return (
    <div className="results-row flex justify-between items-center py-2.5 text-sm">
      <dt id={id} className={muted ? "text-slate-500" : "text-slate-700"}>
        {label}
      </dt>
      <dd
        aria-labelledby={id}
        className={`tabular-nums ${
          bold
            ? "font-bold text-slate-900"
            : muted
              ? "text-slate-500"
              : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
};
