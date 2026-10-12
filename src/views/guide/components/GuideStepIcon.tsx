import { IconCheck } from "@stableflow/pay-ui/icons/outline/check";
import { cn } from "@/lib/utils";

export function GuideStepIcon({
  number,
  current,
  completed,
  size = "sm",
}: {
  number: number;
  current?: boolean;
  completed?: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "md" ? "size-9 text-base font-bold" : "size-[26px] text-sm font-medium";
  const active = current || completed;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-montserrat text-white",
        box,
        active ? "bg-[#3f8afb]" : "bg-[#c8c8c8]",
      )}
    >
      {completed && !current ? <IconCheck className="size-2.5 text-white" /> : number}
    </span>
  );
}
