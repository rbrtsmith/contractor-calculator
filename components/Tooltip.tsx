import * as RadixTooltip from "@radix-ui/react-tooltip";
import { CircleHelp } from "lucide-react";

type TooltipProps = {
  content: React.ReactNode;
  triggerLabel: string;
  delayDuration?: number;
};

export const Tooltip = ({
  content,
  triggerLabel,
  delayDuration = 400,
}: TooltipProps) => (
  <RadixTooltip.Provider delayDuration={delayDuration}>
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <CircleHelp size={16} aria-hidden="true" />
        </button>
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side="top"
          align="center"
          avoidCollisions
          collisionPadding={8}
          className="z-50 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2.5 shadow-lg pointer-events-none data-[state=delayed-open]:animate-none"
        >
          {content}
          <RadixTooltip.Arrow className="fill-slate-800" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  </RadixTooltip.Provider>
);
