export const Button = ({
  children,
  type,
  ...props
}: React.HTMLProps<HTMLButtonElement>) => (
  <button
    className="h-full bg-blue-500 hover:bg-blue-700 text-white px-2 font-bold"
    {...props}
  >
    {children}
  </button>
);
