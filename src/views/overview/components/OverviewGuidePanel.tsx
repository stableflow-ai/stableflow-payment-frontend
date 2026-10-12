import type { MouseEvent } from "react";
import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { IconOutLink } from "@stableflow/pay-ui/icons/outline/link";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE } from "@stableflow/pay-ui/button";
import { Card } from "@stableflow/pay-ui/card";
import useToast from "@/hooks/use-toast";
import { maskApiKey } from "@/views/api-keys/utils";
import { GuideStepIcon } from "@/views/guide/components/GuideStepIcon";
import {
  GUIDE_STEPS,
  GUIDE_URL_PREVIEW_MAX,
  activeWebhookEndpointsCopy,
  type GuideStepDef,
} from "@/views/guide/config";
import { useGuideProgress } from "@/views/guide/hooks/use-guide-progress";
import { guideStepHref, isGuideStepDone, truncateEnd } from "@/views/guide/utils";

export function OverviewGuidePanel({ onOpenStep }: { onOpenStep: (href: string) => void }) {
  const toast = useToast();
  const progress = useGuideProgress();

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  function stop(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <Card className="grid gap-8 px-4 py-6 md:grid-cols-4 md:gap-6 md:px-[30px] md:py-6">
      {GUIDE_STEPS.map((step) => {
        const done = isGuideStepDone(step, progress);
        const testLocked = step.number === 4 && !progress.hasApiKey;
        const target = guideStepHref(step, progress);

        return (
          <div key={step.id} className="min-w-0">
            <div className="flex items-center gap-2">
              <GuideStepIcon number={step.number} completed={done} />
              <p className="font-montserrat text-base font-medium capitalize text-black">{step.title}</p>
            </div>
            <p className="mt-2 font-montserrat text-sm font-normal text-[#909090] h-10 overflow-hidden line-clamp-2">
              {step.description}
            </p>
            <div className="mt-5">
              {done && step.number === 1 && progress.paymentLink ? (
                <CompletedLink
                  title={progress.paymentLink.title}
                  url={progress.paymentLink.url}
                  onOpen={() => window.open(progress.paymentLink!.url, "_blank", "noopener,noreferrer")}
                  onCopy={(event) => {
                    stop(event);
                    void copy(progress.paymentLink!.url);
                  }}
                  onClick={() => onOpenStep(target)}
                />
              ) : done && step.number === 2 && progress.apiKey ? (
                <CompletedKey
                  label={progress.apiKey.label}
                  value={maskApiKey(progress.apiKey.key)}
                  onCopy={(event) => {
                    stop(event);
                    void copy(progress.apiKey!.key);
                  }}
                  onClick={() => onOpenStep(target)}
                />
              ) : done && step.number === 3 ? (
                <button
                  type="button"
                  className="text-left font-montserrat text-sm font-medium text-black"
                  onClick={() => onOpenStep(target)}
                >
                  {activeWebhookEndpointsCopy(progress.webhookCount)}
                </button>
              ) : (
                <ActionButton
                  step={step}
                  disabled={testLocked}
                  onClick={() => onOpenStep(target)}
                />
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function ActionButton({
  step,
  disabled,
  onClick,
}: {
  step: GuideStepDef;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size={BUTTON_SIZE.Sm}
      disabled={disabled}
      className="h-[30px] w-[84px] rounded-[8px] px-0 text-sm"
      onClick={onClick}
    >
      {step.actionLabel}
    </Button>
  );
}

function CompletedLink({
  title,
  url,
  onClick,
  onCopy,
  onOpen,
}: {
  title: string;
  url: string;
  onClick: () => void;
  onCopy: (event: MouseEvent) => void;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="block w-full text-left" onClick={onClick}>
      <p className="font-montserrat text-sm font-medium text-black">{title}</p>
      <span className="mt-1.5 flex items-center gap-1.5">
        <span className="min-w-0 truncate font-montserrat text-xs font-medium text-[#aaa]">
          {truncateEnd(url, GUIDE_URL_PREVIEW_MAX)}
        </span>
        <span
          role="button"
          tabIndex={0}
          className="shrink-0 text-[#aaa] hover:text-black"
          onClick={onCopy}
        >
          <IconCopy className="size-3" />
        </span>
        <span
          role="button"
          tabIndex={0}
          className="shrink-0 text-[#aaa] hover:text-black"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpen();
          }}
        >
          <IconOutLink className="size-2.5" />
        </span>
      </span>
    </button>
  );
}

function CompletedKey({
  label,
  value,
  onClick,
  onCopy,
}: {
  label: string;
  value: string;
  onClick: () => void;
  onCopy: (event: MouseEvent) => void;
}) {
  return (
    <button type="button" className="block w-full text-left" onClick={onClick}>
      <p className="font-montserrat text-sm font-medium text-black">{label}</p>
      <span className="mt-1.5 flex items-center gap-1.5">
        <span className="font-montserrat text-xs font-medium text-[#aaa]">{value}</span>
        <span
          role="button"
          tabIndex={0}
          className="shrink-0 text-[#aaa] hover:text-black"
          onClick={onCopy}
        >
          <IconCopy className="size-3" />
        </span>
      </span>
    </button>
  );
}
