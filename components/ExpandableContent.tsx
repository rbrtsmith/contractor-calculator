import { useState } from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const ExpandableContent = ({ title, children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-4 py-3 bg-slate-100 text-slate-900 font-bold text-left ${isOpen ? "rounded-t-lg" : "rounded-lg"}`}
      >
        <span>{title}</span>
        <span className="text-slate-500">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="bg-slate-100 rounded-b-lg px-4 pt-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};
