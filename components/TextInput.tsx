export const TextInput = ({
  label,
  additionalText,
  prepend,
  append,
  ...props
}: React.HTMLProps<HTMLInputElement> & {
  label: string;
  additionalText?: string;
  prepend?: string;
  append?: string | React.ReactNode;
}) => (
  <label className="mb-6 block">
    <div className="pb-1">{label}</div>
    {additionalText && <div>{additionalText}</div>}
    <div className="text-input-wrapper">
      {prepend && <div className="text-input-prepend">{prepend}</div>}
      <input
        type={props.type ? props.type : "text"}
        className={`border border-slate-400 w-full h-9 p-2 ${
          prepend ? "text-input-has-prepend" : ""
        } ${append ? "text-input-has-append" : ""}`}
        {...props}
      />
      {append && <div className="text-input-append">{append}</div>}
    </div>
  </label>
);
