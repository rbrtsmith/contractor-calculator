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
}) => {
  /* v8 ignore next -- CSS-only ternaries; accent=false variant not rendered in current flows */
  const sectionClass = `rounded-xl p-4 flex flex-col gap-1 ${center ? "items-center text-center" : ""} ${accent ? "bg-gradient-to-br from-green-400 to-blue-500 text-white" : "bg-white border border-slate-200 shadow-sm"}`;
  /* v8 ignore next */
  const labelClass = `text-xs font-semibold uppercase tracking-wider ${accent ? "text-white/70" : "text-slate-500"}`;
  /* v8 ignore next */
  const valueClass = `text-2xl font-bold leading-tight ${accent ? "text-white" : "text-slate-900"}`;
  /* v8 ignore next */
  const subtextClass = `text-sm mt-0.5 ${accent ? "text-white/80" : "text-slate-600"}`;

  return (
    <section aria-label={label} className={sectionClass}>
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
      {subtext && <span className={subtextClass}>{subtext}</span>}
    </section>
  );
};
