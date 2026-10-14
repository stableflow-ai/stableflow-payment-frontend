import { IconLink, IconOutLink } from "@stableflow/pay-ui/icons/outline/link";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import useToast from "@/hooks/use-toast";
import { GUIDE_STEP, GUIDE_STEP_PATH, GUIDE_STEPS } from "../config";
import { GuideDrawer } from "../GuideDrawer";
import { GuideSkipLink } from "../components/GuideSkipLink";
import { GuideSuccessMark } from "../components/GuideSuccessMark";
import { GuideRedirect } from "../guide-flow";
import { useGuideProgress } from "../hooks/use-guide-progress";
import { nextGuideStepHref } from "../utils";

export function GuidePaymentLinkPreviewView() {
  const toast = useToast();
  const progress = useGuideProgress();
  const { paymentLink } = progress;
  const nextTo = nextGuideStepHref(GUIDE_STEP.PaymentLink, progress) ?? GUIDE_STEP_PATH.apiKey;

  if (!paymentLink) {
    return <GuideRedirect to={GUIDE_STEP_PATH.paymentLink} />;
  }

  const linkUrl = paymentLink.url;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(linkUrl);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  return (
    <GuideDrawer title={GUIDE_STEPS[0].drawerTitle}>
      <div className="flex flex-col items-center pt-8">
        <GuideSuccessMark />
        <p className="mt-6 text-center font-montserrat text-base font-semibold text-black">
          Payment link has been generated
        </p>
        <div className="mt-6 w-full rounded-[20px] border border-white bg-[#fdfdfd] px-4 py-6 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
          <p className="break-all text-center font-montserrat text-base font-medium text-black">
            {paymentLink.url}
          </p>
        </div>
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <Button
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Xl}
            className="w-full text-black"
            onClick={() => window.open(linkUrl, "_blank", "noopener,noreferrer")}
          >
            <IconOutLink className="size-3.5 shrink-0" />
            Preview
          </Button>
          <Button
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Xl}
            className="w-full text-black"
            onClick={() => void copyLink()}
          >
            <IconLink className="size-3.5 shrink-0" />
            Copy Link
          </Button>
        </div>
        <GuideSkipLink to={nextTo} label="Next Step" className="mt-8" />
      </div>
    </GuideDrawer>
  );
}

export default GuidePaymentLinkPreviewView;
