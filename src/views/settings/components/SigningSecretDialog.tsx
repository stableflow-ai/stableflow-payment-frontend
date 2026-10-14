import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE } from "@stableflow/pay-ui/button";
import { Dialog } from "@stableflow/pay-ui/dialog";
import useToast from "@/hooks/use-toast";
import { WEBHOOK_SIGNING_SECRET_SUBTITLE } from "../config";

type SigningSecretDialogProps = {
  open: boolean;
  secret: string | null;
  onClose: () => void;
};

export function SigningSecretDialog(props: SigningSecretDialogProps) {
  const { open, secret, onClose } = props;
  const toast = useToast();
  const value = secret ?? "";

  const copySecret = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Webhook Signing Secret"
      titleClassName="text-[18px]"
      cardClassName="w-[min(100%,420px)] px-6 py-7 md:w-[420px]"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-8">
          <p className="font-montserrat text-sm font-medium text-[#606060]">
            {WEBHOOK_SIGNING_SECRET_SUBTITLE}
          </p>
          <div className="flex items-center gap-3 rounded-[20px] border border-white bg-[#fdfdfd] px-4 py-4 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
            <p className="min-w-0 flex-1 truncate font-montserrat text-base font-medium text-black">
              {value}
            </p>
            <Button
              size={BUTTON_SIZE.Sm}
              className="h-[30px] shrink-0 rounded-[8px] px-3 text-sm md:h-[30px] md:text-sm"
              onClick={() => {
                void copySecret();
              }}
            >
              <IconCopy className="size-3.5" />
              Copy
            </Button>
          </div>
        </div>
        <Button size={BUTTON_SIZE.Lg} className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
