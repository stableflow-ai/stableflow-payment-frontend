import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE } from "@stableflow/pay-ui/button";
import useToast from "@/hooks/use-toast";
import { GUIDE_STEP, GUIDE_STEP_PATH, GUIDE_STEPS } from "../config";
import { GuideDrawer } from "../GuideDrawer";
import { GuideSkipLink } from "../components/GuideSkipLink";
import { GuideSuccessMark } from "../components/GuideSuccessMark";
import { GuideRedirect } from "../guide-flow";
import { useGuideProgress } from "../hooks/use-guide-progress";
import { nextGuideStepHref } from "../utils";

export function GuideApiKeyPreviewView() {
  const toast = useToast();
  const progress = useGuideProgress();
  const { apiKey } = progress;
  const nextTo = nextGuideStepHref(GUIDE_STEP.ApiKey, progress) ?? GUIDE_STEP_PATH.webhook;

  if (!apiKey) {
    return <GuideRedirect to={GUIDE_STEP_PATH.apiKey} />;
  }

  const keyValue = apiKey.key;

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(keyValue);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  return (
    <GuideDrawer title={GUIDE_STEPS[1].drawerTitle}>
      <div className="flex flex-col items-center pt-8">
        <GuideSuccessMark />
        <p className="mt-6 text-center font-montserrat text-base font-semibold text-black">
          API Key has been created
        </p>
        <div className="mt-6 flex w-full items-center gap-3 rounded-[20px] border border-white bg-[#fdfdfd] px-4 py-4 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
          <p className="min-w-0 flex-1 break-all font-montserrat text-base font-medium text-black">
            {apiKey.key}
          </p>
          <Button
            size={BUTTON_SIZE.Sm}
            className="h-[30px] shrink-0 rounded-[8px] px-3"
            onClick={() => void copyKey()}
          >
            <IconCopy className="size-3 shrink-0 text-white" />
            Copy
          </Button>
        </div>
        <p className="mt-4 w-full font-montserrat text-sm font-medium text-[#606060]">
          Notice: Do not share your API key with others, or expose it in the browser or other
          client-side code.
        </p>
        <GuideSkipLink to={nextTo} label="Next Step" className="mt-8" />
      </div>
    </GuideDrawer>
  );
}

export default GuideApiKeyPreviewView;
