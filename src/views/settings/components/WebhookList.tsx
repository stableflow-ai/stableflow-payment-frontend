import { IconDelete } from "@stableflow/pay-ui/icons/outline/delete";
import { IconFlask } from "@stableflow/pay-ui/icons/outline/flask";
import { IconResetPassword } from "@stableflow/pay-ui/icons/outline/reset-password";
import { Switch } from "@stableflow/pay-ui/switch";
import { Tooltip } from "@stableflow/pay-ui/tooltip";
import type { PayWebhook } from "@/types/webhooks";
import { formatWebhookEvents, isWebhookEnabled } from "../utils";
import { Skeleton } from "@stableflow/pay-ui/skeleton";

export function WebhookList(props: {
  endpoints: PayWebhook[];
  endpointsLoading?: boolean;
  pendingId: string | null;
  onAdd: () => void;
  onToggle: (endpoint: PayWebhook, enabled: boolean) => void;
  onRotate: (endpoint: PayWebhook) => void;
  onSendTest: (endpoint: PayWebhook) => void;
  onDelete: (endpoint: PayWebhook) => void;
}) {
  const { endpoints, endpointsLoading, pendingId, onAdd, onToggle, onRotate, onSendTest, onDelete } = props;

  if (endpoints.length === 0) {
    if (endpointsLoading) {
      return (
        <div className="flex flex-col gap-3 py-2" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }
    return (
      <p className="font-montserrat text-sm font-medium text-[#aaa]">
        No webhook endpoints yet.{" "}
        <button type="button" className="cursor-pointer text-black" onClick={onAdd}>
          Add Endpoint
        </button>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {endpoints.map((endpoint) => (
        <WebhookRow
          key={endpoint.webhookId}
          endpoint={endpoint}
          pending={pendingId === endpoint.webhookId}
          onToggle={(enabled) => onToggle(endpoint, enabled)}
          onRotate={() => onRotate(endpoint)}
          onSendTest={() => onSendTest(endpoint)}
          onDelete={() => onDelete(endpoint)}
        />
      ))}
    </div>
  );
}

function WebhookRow(props: {
  endpoint: PayWebhook;
  pending: boolean;
  onToggle: (enabled: boolean) => void;
  onRotate: () => void;
  onSendTest: () => void;
  onDelete: () => void;
}) {
  const { endpoint, pending, onToggle, onRotate, onSendTest, onDelete } = props;
  const enabled = isWebhookEnabled(endpoint.status);
  const switchLabel = enabled ? "Disable webhook" : "Enable webhook";

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-white bg-[#fdfdfd] px-5 py-[18px] shadow-[0_0_20px_0_rgba(0,0,0,0.06)] md:flex-row md:items-center md:gap-6">
      <div className="min-w-0 flex-1">
        <p className="truncate font-montserrat text-base font-medium text-black">{endpoint.url}</p>
        <p className="mt-1.5 font-montserrat text-xs font-medium text-[#606060]">
          {formatWebhookEvents(endpoint.events)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4 self-end md:self-auto">
        <Tooltip content={switchLabel}>
          <Switch
            checked={enabled}
            disabled={pending}
            onCheckedChange={onToggle}
            aria-label={switchLabel}
          />
        </Tooltip>
        <Tooltip content="Rotate Secret">
          <button
            type="button"
            disabled={pending}
            aria-label="Rotate Secret"
            className="cursor-pointer text-[#aaa] hover:text-black disabled:pointer-events-none disabled:opacity-30"
            onClick={onRotate}
          >
            <IconResetPassword className="h-[18px] w-[15px]" />
          </button>
        </Tooltip>
        <Tooltip content="Send Test Webhook">
          <button
            type="button"
            disabled={pending}
            aria-label="Send Test Webhook"
            className="cursor-pointer text-[#aaa] hover:text-black disabled:pointer-events-none disabled:opacity-30"
            onClick={onSendTest}
          >
            <IconFlask className="h-3.5 w-[13px]" />
          </button>
        </Tooltip>
        <Tooltip content="Delete">
          <button
            type="button"
            disabled={pending}
            aria-label="Delete"
            className="cursor-pointer text-[#aaa] hover:text-danger disabled:pointer-events-none disabled:opacity-30"
            onClick={onDelete}
          >
            <IconDelete className="size-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
