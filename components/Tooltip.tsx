import { useState, useId } from "react";
import { CircleHelp } from "lucide-react";

type TooltipProps = {
  content: React.ReactNode;
  triggerLabel: string;
};

export const Tooltip = ({ content, triggerLabel }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      hide();
    }
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-describedby={isVisible ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={handleKeyDown}
        className="p-1 rounded-full text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <CircleHelp size={16} aria-hidden="true" />
      </button>

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2.5 shadow-lg pointer-events-none"
        >
          {content}
        </div>
      )}
    </span>
  );
};
