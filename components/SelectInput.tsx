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
        <div className="pb-1">{label}</div>
        <div>
          <select
            className="border border-slate-400 w-full h-9 p-2  "
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
