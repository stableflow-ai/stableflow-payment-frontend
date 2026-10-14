import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { IconLink, IconOutLink } from "@stableflow/pay-ui/icons/outline/link";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import useToast from "@/hooks/use-toast";
import {
  CREATE_PAYMENT_LINK_PATH,
  CREATE_PAYMENT_LINK_STEP,
  type CreatePaymentLinkPreviewState,
} from "../../config";
import { buildPaymentLinkUrl, downloadPaymentLinkQr, paymentLinkQrDataUrl } from "../../utils";
import { CreateLinkStepper } from "./CreateLinkStepper";
import { GuideSuccessMark } from "@/views/guide/components/GuideSuccessMark";

export function CreateLinkPreview() {
  const toast = useToast();
  const location = useLocation();
  const linkId = (location.state as CreatePaymentLinkPreviewState | null)?.linkId;
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  const url = linkId ? buildPaymentLinkUrl(window.location.origin, linkId) : "";

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    void paymentLinkQrDataUrl(url).then((dataUrl) => {
      if (!cancelled) setQrSrc(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!linkId) {
    return <Navigate to={CREATE_PAYMENT_LINK_PATH} replace />;
  }

  const previewLinkId = linkId;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  function saveQr() {
    if (!qrSrc) return;
    downloadPaymentLinkQr(qrSrc, previewLinkId);
  }

  return (
    <div>
      <CreateLinkStepper step={CREATE_PAYMENT_LINK_STEP.Preview} />
      <div className="mt-6 h-px w-full bg-[#e3e3e3]" />

      <div className="flex flex-col items-center pt-8">
        <GuideSuccessMark />
        <p className="mt-6 text-center font-montserrat text-base font-semibold text-black">
          Payment link has been generated
        </p>
        <div className="mt-6 w-full rounded-[20px] border border-white bg-[#fdfdfd] px-4 py-6 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
          <p className="break-all text-center font-montserrat text-base font-medium text-black">
            {url}
          </p>
        </div>
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <Button
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Xl}
            className="w-full text-black"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
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
      </div>
    </div>
  );
}

export default CreateLinkPreview;
