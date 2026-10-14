import { IconLock } from "@stableflow/pay-ui/icons/solid/lock";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function DetailRow(props: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="shrink-0 font-montserrat text-sm font-medium text-[#606060]">{props.label}</p>
      {props.extra}
      <span className="min-w-0 flex-1 border-t border-dotted border-[#d9d9d9]" />
      <div className={cn("max-w-[60%] shrink-0 text-right font-montserrat text-sm font-medium text-black", props.valueClassName)}>
        {props.value}
      </div>
    </div>
  );
}

export function PrivateBadge() {
  return (
    <span className="inline-flex h-[26px] shrink-0 items-center gap-1 rounded-[13px] border border-[#d0f348] bg-[rgba(208,243,72,0.2)] px-2 font-montserrat text-xs font-medium text-[#84a20f]">
      <IconLock className="size-3" />
      Private by default
    </span>
  );
}
