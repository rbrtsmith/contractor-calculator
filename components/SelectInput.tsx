import { useId } from "react";

export const SelectInput = ({
  label,
  tooltip,
  name,
  options,
  ...props
}: React.HTMLProps<HTMLSelectElement> & {
  label: string;
  tooltip?: React.ReactNode;
  options: { value: string; label: string }[];
}) => {
  const selectId = useId();

  return (
    <div className="mb-6">
      <div className="pb-1.5 flex items-center gap-1.5">
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
        {tooltip}
      </div>
      <div>
        <select
          id={selectId}
          className="border border-slate-300 rounded-lg w-full h-10 p-2 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
    </div>
  );
};
