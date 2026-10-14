import { IconArrowDown } from "@stableflow/pay-ui/icons/outline/arrow-down";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";

export function TokenSelectButton(props: {
  token: IntentsToken | null;
  onClick: () => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const { token, onClick, disabled = false, invalid = false } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-[18px] border px-3 font-montserrat text-sm font-medium transition-colors hover:bg-black/5 disabled:pointer-events-none disabled:opacity-60",
        invalid ? "border-danger text-danger" : "border-black/10 text-black",
      )}
    >
      {token ? (
        <>
          <span className="relative size-5">
            <img src={token.logo} alt="" className="size-5 rounded-full object-cover" />
            <img
              src={chainLogoUrl(token.blockchain)}
              alt=""
              className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-[2px] border border-white object-cover"
            />
          </span>
          {token.symbol}
        </>
      ) : (
        "Token"
      )}
      <IconArrowDown className="h-1.5 w-2.5 text-black/60" />
    </button>
  );
}

export default TokenSelectButton;
