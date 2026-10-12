import { Icon2Right } from "@stableflow/pay-ui/icons/outline/to-right";
import { cn } from "@/lib/utils";
import { useGuideFlow } from "../guide-flow";

export function GuideSkipLink({
  to,
  label,
  className,
  onClick,
}: {
  to: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const { go } = useGuideFlow();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-montserrat text-base font-medium text-[#606060] hover:text-black",
        className,
      )}
      onClick={() => {
        onClick?.();
        go(to);
      }}
    >
      {label}
      <Icon2Right className="h-2 w-[11.5px]" />
    </button>
  );
}
