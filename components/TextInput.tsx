export const TextInput = ({
  label,
  additionalText,
  prepend,
  append,
  appendDouble,
  ...props
}: React.HTMLProps<HTMLInputElement> & {
  label: string;
  additionalText?: string;
  prepend?: string;
  append?: string | React.ReactNode;
  appendDouble?: boolean;
}) => {
  /* v8 ignore start */
  const appendClass = append
    ? appendDouble
      ? "text-input-has-append-double"
      : "text-input-has-append"
    : "";
  const inputType = props.type ?? "text";
  const additionalTextNode = additionalText ? (
    <div className="pb-1 text-xs text-slate-500">{additionalText}</div>
  ) : null;
  /* v8 ignore stop */

  return (
    <label className="mb-6 block">
      <div className="pb-1.5 text-sm font-medium text-slate-700">{label}</div>
      {additionalTextNode}
      <div className="text-input-wrapper">
        {prepend && <div className="text-input-prepend">{prepend}</div>}
        <input
          {...props}
          type={inputType}
          className={`border border-slate-300 rounded-lg w-full h-10 p-2 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${
            prepend ? "text-input-has-prepend" : ""
          } ${appendClass}`}
        />
        {append && <div className="text-input-append">{append}</div>}
      </div>
    </label>
  );
};
