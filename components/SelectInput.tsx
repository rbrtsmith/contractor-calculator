export const SelectInput = ({
  label,
  name,
  options,
  id,
  ...props
}: React.HTMLProps<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
}) => {
  const selectId = name || id;
  return (
    <>
      <label className="mb-6 block" htmlFor={selectId}>
        <div className="pb-1.5 text-sm font-medium text-slate-700">{label}</div>
        <div>
          <select
            className="border border-slate-300 rounded-lg w-full h-10 p-2 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            id={selectId}
            name={name}
            {...props}
          >
            {options.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </label>
    </>
  );
};
