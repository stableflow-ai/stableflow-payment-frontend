import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE } from "@stableflow/pay-ui/button";
import useToast from "@/hooks/use-toast";
import { formatWebhookEvents } from "@/views/settings/utils";
import { WEBHOOK_SIGNING_SECRET_SUBTITLE } from "@/views/settings/config";
import { GUIDE_STEP_PATH, GUIDE_STEPS } from "../config";
import { GuideDrawer } from "../GuideDrawer";
import { GuideSuccessMark } from "../components/GuideSuccessMark";
import { GuideRedirect, useGuideFlow } from "../guide-flow";
import { useGuideProgress } from "../hooks/use-guide-progress";

export function GuideWebhookPreviewView() {
  const { go } = useGuideFlow();
  const toast = useToast();
  const { webhook } = useGuideProgress();

  if (!webhook) {
    return <GuideRedirect to={GUIDE_STEP_PATH.webhook} />;
  }

  const secret = webhook.secret.trim();

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  return (
    <GuideDrawer title={GUIDE_STEPS[2].drawerTitle}>
      <div className="flex flex-col items-center pt-8">
        <GuideSuccessMark />
        <p className="mt-6 text-center font-montserrat text-base font-semibold text-black">
          Webhook has been created
        </p>
        {secret ? (
          <div className="mt-6 w-full">
            <p className="font-montserrat text-sm font-medium text-[#606060]">Signing Secret</p>
            <div className="mt-3 flex w-full items-center gap-3 rounded-[20px] border border-white bg-[#fdfdfd] px-4 py-4 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
              <p className="min-w-0 flex-1 break-all font-montserrat text-base font-medium text-black">
                {secret}
              </p>
              <Button
                size={BUTTON_SIZE.Sm}
                className="h-[30px] shrink-0 rounded-[8px] px-3"
                onClick={() => void copySecret()}
              >
                <IconCopy className="size-3 shrink-0 text-white" />
                Copy
              </Button>
            </div>
            <p className="mt-4 font-montserrat text-sm font-medium text-[#606060]">
              {WEBHOOK_SIGNING_SECRET_SUBTITLE}
            </p>
          </div>
        ) : null}
        <div className="mt-8 w-full">
          <p className="font-montserrat text-sm font-medium text-[#606060]">Webhook</p>
          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-montserrat text-base font-medium text-black">{webhook.url}</p>
              <p className="mt-1.5 font-montserrat text-xs font-medium text-[#606060]">
                {formatWebhookEvents(webhook.events)}
              </p>
            </div>
          </div>
        </div>
        <Button
          size={BUTTON_SIZE.Lg}
          className="mt-8 w-full"
          onClick={() => go(GUIDE_STEP_PATH.test)}
        >
          Continue to test
        </Button>
      </div>
    </GuideDrawer>
  );
}

export default GuideWebhookPreviewView;
