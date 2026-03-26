import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-4 py-3 bg-slate-100 text-slate-900 font-bold text-left ${isOpen ? "rounded-t-lg" : "rounded-lg"}`}
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className="text-slate-500 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {isOpen && (
        <div className="expandable-content bg-slate-100 rounded-b-lg px-4 pt-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};
