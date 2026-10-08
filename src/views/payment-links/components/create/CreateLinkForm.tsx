import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconAlert } from "@stableflow/pay-ui/icons/alert";
import { IconQuestion } from "@stableflow/pay-ui/icons/question";
import { TokenSelectDialog } from "@stableflow/pay-widgets/token-select";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import { InputNumber } from "@stableflow/pay-ui/input-number";
import { Switch } from "@stableflow/pay-ui/switch";
import { Tooltip } from "@stableflow/pay-ui/tooltip";
import { useDefaultAddressesQuery, usePaymentLinkMutations } from "@/hooks/use-payment-links-api";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { intentsTokenForSelection, type IntentsToken } from "@/stores/intents-tokens";
import { isAddressValid, isHttpUrl } from "@/utils";
import {
  CREATE_LINK_AMOUNT_MAX_DECIMALS,
  CREATE_PAYMENT_LINK_PREVIEW_PATH,
  CREATE_PAYMENT_LINK_STEP,
  PAYMENT_DESCRIPTION_MAX_LENGTH,
  PAYMENT_ICON_URL_MAX_LENGTH,
  PAYMENT_TITLE_MAX_LENGTH,
  type CreatePaymentLinkPreviewState,
} from "../../config";
import { isPositiveAmount, paymentLinksError } from "../../utils";
import { CreateLinkStepper } from "./CreateLinkStepper";
import { TokenSelectButton } from "./TokenSelectButton";

const FIELD_INPUT_CLASS =
  "h-9 w-full rounded-[6px] border bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium outline-none placeholder:text-black/30";

export function CreateLinkForm({
  showStepper = true,
  onCreated,
}: {
  showStepper?: boolean;
  onCreated?: (created: { linkId: string; title: string }) => void;
} = {}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { createMutation } = usePaymentLinkMutations();
  const defaultsQuery = useDefaultAddressesQuery();
  const defaultAddresses = defaultsQuery.data;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [amount, setAmount] = useState("");
  const [openAmount, setOpenAmount] = useState(false);
  const [token, setToken] = useState<IntentsToken | null>(null);
  const [address, setAddress] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!token || !defaultAddresses) return;
    const fallback = defaultAddresses.find((row) => row.network === token.blockchain);
    if (!fallback) return;
    setAddress((current) => (current.trim() ? current : fallback.recipient));
  }, [token, defaultAddresses]);

  const titleOk = title.trim().length > 0;
  const tokenOk = Boolean(token);
  const addressOk = token ? isAddressValid(address, token.chain.chainKind) : false;
  const amountOk = openAmount || isPositiveAmount(amount);
  const iconOk = !iconUrl.trim() || isHttpUrl(iconUrl);
  const canSubmit = titleOk && tokenOk && addressOk && amountOk && iconOk;

  const titleInvalid = showErrors && !titleOk;
  const iconInvalid = showErrors && Boolean(iconUrl.trim()) && !iconOk;
  const amountInvalid = !openAmount && (Boolean(amount.trim()) || showErrors) && !amountOk;
  const tokenInvalid = showErrors && !tokenOk;
  const addressInvalid = Boolean(token) && (Boolean(address.trim()) || showErrors) && !addressOk;

  function handleOpenAmountChange(checked: boolean) {
    setOpenAmount(checked);
    if (checked) setAmount("");
  }

  function handleSelectToken(next: IntentsToken) {
    const networkChanged = !token || token.blockchain !== next.blockchain;
    const chainChanged = !token || token.chain.chainKind !== next.chain.chainKind;
    setToken(next);
    if (!networkChanged) return;
    const fallback = defaultAddresses?.find((row) => row.network === next.blockchain);
    if (fallback) {
      setAddress(fallback.recipient);
      return;
    }
    if (chainChanged) setAddress("");
  }

  async function handleGenerate() {
    if (!canSubmit || !token) {
      setShowErrors(true);
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        icon: iconUrl.trim(),
        amount: openAmount ? "" : amount,
        symbol: token.symbol,
        network: token.blockchain,
        recipient: address.trim(),
        defaultAddress: saveAsDefault,
      });
      if (onCreated) {
        onCreated({ linkId: created.linkId, title: title.trim() });
        return;
      }
      const state: CreatePaymentLinkPreviewState = { linkId: created.linkId };
      navigate(CREATE_PAYMENT_LINK_PREVIEW_PATH, { state });
    } catch (error) {
      toast.fail({ title: paymentLinksError(error, "Could not create payment link") });
    }
  }

  return (
    <>
      <div>
        {showStepper ? (
          <>
            <CreateLinkStepper step={CREATE_PAYMENT_LINK_STEP.Form} />
            <div className="mt-6 h-px w-full bg-[#e3e3e3]" />
          </>
        ) : null}

        <label
          htmlFor="payment-title"
          className="mt-8 block font-montserrat text-sm font-medium capitalize text-[#606060]"
        >
          Payment Title
        </label>
        <input
          id="payment-title"
          type="text"
          value={title}
          maxLength={PAYMENT_TITLE_MAX_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
          className={cn(
            FIELD_INPUT_CLASS,
            "mt-2.5",
            titleInvalid ? "border-danger text-danger" : "border-[#e3e3e3] text-black",
          )}
        />

        <div className="mt-5 flex items-center gap-2">
          <label
            htmlFor="payment-description"
            className="font-montserrat text-sm font-medium capitalize text-[#606060]"
          >
            Description
          </label>
          <span className="font-montserrat text-sm font-medium capitalize text-[#aaa]">Optional</span>
        </div>
        <input
          id="payment-description"
          type="text"
          value={description}
          maxLength={PAYMENT_DESCRIPTION_MAX_LENGTH}
          placeholder="e.g. detail of invoice or attachment link"
          onChange={(event) => setDescription(event.target.value)}
          className={cn(FIELD_INPUT_CLASS, "mt-2.5 border-[#e3e3e3] text-black")}
        />

        <div className="mt-5 flex items-center gap-2">
          <label
            htmlFor="payment-iconUrl"
            className="font-montserrat text-sm font-medium capitalize text-[#606060]"
          >
            Icon URL
          </label>
          <span className="font-montserrat text-sm font-medium capitalize text-[#aaa]">Optional</span>
        </div>
        <input
          id="payment-iconUrl"
          type="text"
          value={iconUrl}
          maxLength={PAYMENT_ICON_URL_MAX_LENGTH}
          placeholder="URL of the product icon image"
          onChange={(event) => setIconUrl(event.target.value)}
          className={cn(
            FIELD_INPUT_CLASS,
            "mt-2.5",
            iconInvalid ? "border-danger text-danger" : "border-[#e3e3e3] text-black",
          )}
        />

        <p className="mt-8 font-montserrat text-sm font-medium capitalize text-[#606060]">
          Payment setting
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <InputNumber
            value={amount}
            decimals={CREATE_LINK_AMOUNT_MAX_DECIMALS}
            disabled={openAmount}
            placeholder={openAmount ? "User defined amount" : "0"}
            onNumberChange={setAmount}
            className={cn(
              "min-w-0 flex-1 bg-transparent font-montserrat text-[16px] pl-0 font-medium outline-none border-0",
              openAmount && "cursor-not-allowed",
              amountInvalid
                ? "text-danger placeholder:text-danger"
                : "text-black placeholder:text-[#aaa]",
            )}
          />
          <TokenSelectButton
            token={token}
            invalid={tokenInvalid}
            onClick={() => setTokenDialogOpen(true)}
          />
        </div>
        <div className={cn("mt-3 h-px w-full", amountInvalid ? "bg-danger" : "bg-[#e3e3e3]")} />

        <div className="mt-5 flex items-center gap-2.5">
          <Switch checked={openAmount} onCheckedChange={handleOpenAmountChange} />
          <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
            Let user choose the payment amount (e.g. tips)
          </p>
          <Tooltip
            content="Make your payment an open amount for the user to select what they would like to pay."
            className="max-w-[240px]"
          >
            <IconQuestion className="size-3.5 shrink-0 text-[#aaa]" />
          </Tooltip>
        </div>

        <label
          htmlFor="recipient-address"
          className="mt-5 font-montserrat text-sm font-medium text-[#606060] flex items-center justify-between"
        >
          <span>Recipient Address</span>
          <Button
            type="button"
            variant={saveAsDefault ? BUTTON_VARIANT.Primary : BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Sm}
            aria-pressed={saveAsDefault}
            className={cn(
              "text-[12px] !h-[30px] !rounded-[8px] !px-[10px]",
              saveAsDefault ? "text-white" : "text-[#606060]",
            )}
            onClick={() => setSaveAsDefault((current) => !current)}
          >
            Save as default
          </Button>
        </label>
        <div
          className={cn(
            "mt-2.5 flex h-9 items-center gap-2 rounded-[6px] border bg-[#f6f6f6] px-3",
            addressInvalid ? "border-danger" : "border-[#e3e3e3]",
          )}
        >
          <input
            id="recipient-address"
            type="text"
            value={address}
            placeholder="Enter recipient address"
            onChange={(event) => setAddress(event.target.value)}
            className={cn(
              "min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30",
              addressInvalid ? "text-danger" : "text-black",
            )}
          />
          {addressInvalid ? (
            <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
              <IconAlert className="h-[7px] w-0.5" />
            </span>
          ) : null}
        </div>

        <Button
          size={BUTTON_SIZE.Xl}
          className="mt-8 w-full"
          loading={createMutation.isPending}
          onClick={() => void handleGenerate()}
        >
          Generate Payment Link
        </Button>
      </div>

      <TokenSelectDialog
        open={tokenDialogOpen}
        onClose={() => setTokenDialogOpen(false)}
        selectedAssetId={token?.assetId}
        role="receiver"
        onSelect={({ token: selected }) => {
          const next = intentsTokenForSelection(selected);
          if (next) handleSelectToken(next);
        }}
      />
    </>
  );
}

export default CreateLinkForm;
