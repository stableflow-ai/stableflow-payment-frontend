import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { IconOutLink } from "@stableflow/pay-ui/icons/outline/link";
import useToast from "@/hooks/use-toast";
import { formatAddress } from "@/utils";

export function ReportsAddressCell(props: {
  address: string;
  href?: string | null;
}) {
  const { address, href } = props;
  const toast = useToast();

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="truncate">{formatAddress(address)}</span>
      <button
        type="button"
        className="shrink-0 cursor-pointer text-[#909090] hover:text-black"
        aria-label="Copy address"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            toast.success({ title: "Copied" });
          } catch {
            toast.fail({ title: "Could not copy" });
          }
        }}
      >
        <IconCopy className="size-3" />
      </button>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-[#909090] hover:text-black"
          aria-label="Open in explorer"
        >
          <IconOutLink />
        </a>
      ) : null}
    </span>
  );
}
