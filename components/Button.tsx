export const Button = ({
  children,
  type,
  ...props
}: React.HTMLProps<HTMLButtonElement>) => (
  <button
    className="h-full px-3 text-sm font-semibold text-slate-600 bg-transparent hover:bg-slate-100 transition-colors"
    {...props}
  >
    {children}
  </button>
);
