import { IconDelete } from "@stableflow/pay-ui/icons/outline/delete";
import { IconLink, IconOutLink } from "@stableflow/pay-ui/icons/outline/link";
import { Pagination } from "@stableflow/pay-ui/pagination";
import { SearchInput } from "@stableflow/pay-ui/search-input";
import { Switch } from "@stableflow/pay-ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@stableflow/pay-ui/table";
import { Tooltip } from "@stableflow/pay-ui/tooltip";
import type { PayPaymentLink } from "@/types/payment-links";
import { PAYMENT_LINKS_TABLE_COLUMNS, PAYMENT_LINK_TYPE_LABEL } from "../config";
import {
  formatLinkAmount,
  isPaymentLinkActive,
  paymentLinkStatusLabel,
  paymentLinkType,
} from "../utils";
import { ListEmptyState } from "./ListEmptyState";
import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { TableSkeletonRows } from "@stableflow/pay-ui/table";
import { formatAddress, formatAmount } from "@/utils";
import useToast from "@/hooks/use-toast";

export function PaymentLinksTable({
  links,
  query,
  onQueryChange,
  page,
  totalPage,
  onPageChange,
  onView,
  onCopyLink,
  onOpenLink,
  onToggleStatus,
  onDelete,
  loading,
}: {
  links: PayPaymentLink[];
  query: string;
  onQueryChange: (value: string) => void;
  page: number;
  totalPage: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView: (link: PayPaymentLink) => void;
  onCopyLink: (link: PayPaymentLink) => void;
  onOpenLink: (link: PayPaymentLink) => void;
  onToggleStatus: (link: PayPaymentLink, active: boolean) => void;
  onDelete: (link: PayPaymentLink) => void;
}) {
  const emptyCopy = query.trim() ? "No payment links found" : "No payment links yet";

  return (
    <Table
      className="w-full p-4 md:p-5"
      columns={PAYMENT_LINKS_TABLE_COLUMNS}
      toolbar={
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="font-montserrat text-base font-medium text-black">Payment Links</p>
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Search by name"
            className="w-full md:w-[230px]"
          />
        </div>
      }
      footer={
        links.length === 0 ? undefined : (
          <div className="mt-3 flex justify-end">
            <Pagination page={page} totalPage={totalPage} onPageChange={onPageChange} />
          </div>
        )
      }
    >
      <TableHeader>
        <TableHead className="text-[#606060] first:pl-3">Name</TableHead>
        <TableHead>Receive address</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Revenue</TableHead>
        <TableHead>Payments</TableHead>
        <TableHead>Status</TableHead>
        <TableHead />
        <TableHead />
        <TableHead />
        <TableHead className="last:pr-3" />
      </TableHeader>
      {loading && links.length === 0 ? (
        <TableSkeletonRows cells={11} />
      ) : (
      <TableBody className="flex flex-col gap-3.5 pt-1">
        {links.length === 0 ? (
          <ListEmptyState>{emptyCopy}</ListEmptyState>
        ) : (
          links.map((link) => (
            <PaymentLinkRow
              key={link.linkId}
              link={link}
              onView={() => onView(link)}
              onCopyLink={() => onCopyLink(link)}
              onOpenLink={() => onOpenLink(link)}
              onToggleStatus={(active) => onToggleStatus(link, active)}
              onDelete={() => onDelete(link)}
            />
          ))
        )}
      </TableBody>
      )}
    </Table>
  );
}

function PaymentLinkRow({
  link,
  onView,
  onCopyLink,
  onOpenLink,
  onToggleStatus,
  onDelete,
}: {
  link: PayPaymentLink;
  onView: () => void;
  onCopyLink: () => void;
  onOpenLink: () => void;
  onToggleStatus: (active: boolean) => void;
  onDelete: () => void;
}) {
  const isActive = isPaymentLinkActive(link.status);
  const switchLabel = isActive ? "Disable payment link" : "Enable payment link";
  const toast = useToast();

  return (
    <TableRow className="h-14 rounded-[12px] border-b-0 bg-[#f6f6f6]">
      <TableCell className="min-w-0 flex-col items-start justify-center gap-0.5 py-0 first:pl-3">
        <span className="w-full truncate font-montserrat text-sm font-medium text-black">{link.title}</span>
        <span className="w-full truncate font-montserrat text-xs font-medium text-[#aaa]">
          {link.description || "No description"}
        </span>
      </TableCell>
      <TableCell className="py-0 flex items-center gap-1">
        <span>{formatAddress(link.recipient)}</span>
        <button
          type="button"
          className="shrink-0 cursor-pointer text-[#909090] hover:text-black"
          aria-label="Copy address"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link.recipient);
              toast.success({ title: "Copied" });
            } catch {
              toast.fail({ title: "Could not copy" });
            }
          }}
        >
          <IconCopy className="size-3" />
        </button>
      </TableCell>
      <TableCell className="py-0">{PAYMENT_LINK_TYPE_LABEL[paymentLinkType(link)]}</TableCell>
      <TableCell className="py-0">{formatLinkAmount(link)}</TableCell>
      <TableCell className="py-0">{formatAmount(link.revenue || "0", { maxDecimals: 6, showDust: true })}</TableCell>
      <TableCell className="gap-2 py-0">
        <span>{link.payments}</span>
        <button
          type="button"
          className="cursor-pointer font-montserrat text-sm font-medium text-[#3f8afb] hover:underline"
          onClick={onView}
        >
          View
        </button>
      </TableCell>
      <TableCell className="py-0">
        <span className={isActive ? "text-black" : "text-[#9fa7ba]"}>
          {paymentLinkStatusLabel(link.status)}
        </span>
      </TableCell>
      <TableCell className="py-0">
        <Tooltip content={switchLabel}>
          <Switch
            checked={isActive}
            onCheckedChange={onToggleStatus}
            aria-label={switchLabel}
          />
        </Tooltip>
      </TableCell>
      <TableCell className="py-0 last:pr-3">
        <Tooltip content="Open link">
          <button
            type="button"
            aria-label="Open link"
            className="cursor-pointer text-[#aaa] hover:text-black"
            onClick={onOpenLink}
          >
            <IconOutLink className="size-3.5" />
          </button>
        </Tooltip>
      </TableCell>
      <TableCell className="py-0 last:pr-3">
        <Tooltip content="Copy link">
          <button
            type="button"
            aria-label="Copy link"
            className="cursor-pointer text-[#aaa] hover:text-black"
            onClick={onCopyLink}
          >
            <IconLink className="size-3.5" />
          </button>
        </Tooltip>
      </TableCell>
      <TableCell className="py-0">
        <Tooltip content="Delete">
          <button
            type="button"
            aria-label="Delete"
            className="cursor-pointer text-[#aaa] hover:text-danger"
            onClick={onDelete}
          >
            <IconDelete className="size-3.5" />
          </button>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
