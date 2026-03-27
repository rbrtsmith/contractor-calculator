export const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section
    aria-label={title}
    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-3"
  >
    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
    </div>
    <dl className="px-4 py-1">{children}</dl>
  </section>
);
