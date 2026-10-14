import type { IntentsToken } from "@/stores/intents-tokens";
import { IconFee } from "@stableflow/pay-ui/icons/solid/fee";
import { IconDuration2 } from "@stableflow/pay-ui/icons/solid/duration";
import { getStableflowRouteLogo } from "@/lib/logo";

export function ResultRow(props: {
  originToken: IntentsToken | null;
  destToken: IntentsToken | null;
  feeDisplay: string;
  durationDisplay: string;
}) {
  const { feeDisplay, durationDisplay } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="shrink-0 font-montserrat text-xs text-[#9fa7ba]">Result</p>
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={getStableflowRouteLogo("logo-near-intents-simple.svg")}
          alt=""
          className="size-4 shrink-0 object-center object-contain"
        />
        <span className="inline-flex items-center gap-1 font-montserrat text-xs text-[#444c59]">
          <IconFee className="size-3 text-[#9FA7BA]" />
          {feeDisplay}
        </span>
        <span className="inline-flex items-center gap-1 font-montserrat text-xs text-[#444c59]">
          <IconDuration2 className="size-3.5 text-[#9FA7BA]" />
          {durationDisplay}
        </span>
      </div>
    </div>
  );
}
