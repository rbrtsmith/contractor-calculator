export const StatCard = ({
  label,
  value,
  subtext,
  accent = false,
  center = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
  center?: boolean;
}) => (
  <section
    aria-label={label}
    className={`rounded-xl p-4 flex flex-col gap-1 ${center ? "items-center text-center" : ""} ${
      accent
        ? "bg-gradient-to-br from-green-400 to-blue-500 text-white"
        : "bg-white border border-slate-200 shadow-sm"
    }`}
  >
    <span
      className={`text-xs font-semibold uppercase tracking-wider ${
        accent ? "text-white/70" : "text-slate-500"
      }`}
    >
      {label}
    </span>
    <span
      className={`text-2xl font-bold leading-tight ${
        accent ? "text-white" : "text-slate-900"
      }`}
    >
      {value}
    </span>
    {subtext && (
      <span
        className={`text-sm mt-0.5 ${accent ? "text-white/80" : "text-slate-600"}`}
      >
        {subtext}
      </span>
    )}
  </section>
);
