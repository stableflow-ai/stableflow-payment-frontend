import { useEffect, useMemo, useRef, useState } from "react";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import { Card } from "@stableflow/pay-ui/card";
import { IconDelete } from "@stableflow/pay-ui/icons/outline/delete";
import { IconPlus } from "@stableflow/pay-ui/icons/outline/plus";
import { InputNumber } from "@stableflow/pay-ui/input-number";
import { MyWalletsDrawer } from "@stableflow/pay-widgets/my-wallets";
import { TokenSelectDialog } from "@stableflow/pay-widgets/token-select";
import { TokenSelectButton } from "@/views/payment-links/components/create/TokenSelectButton";
import { activateConfidentialAccount } from "@/lib/confidential/activate";
import { toIntentsAccountId } from "@/lib/confidential/to-intents-account-id";
import {
  canResumePrivacyExecution,
  createPrivacyExecutionSnapshot,
} from "@/lib/confidential/execution-types";
import { runPrivacyTransfer } from "@/lib/confidential/execute";
import { getPrivateBalances, privateAvailableForToken } from "@/lib/confidential/one-click-auth";
import {
  assertFailedRetryRecipients,
  createPrivacyQuotePlan,
  type PrivacyFundingSource,
  type PrivacyQuotePlan,
} from "@/lib/confidential/plan";
import { derivePrivacyTransferMode, resolveFundingRoute } from "@/lib/confidential/routing";
import { cn } from "@/lib/utils";
import { chainLabel } from "@/config/chains";
import useToast from "@/hooks/use-toast";
import { useConnectedWallets } from "@/hooks/use-wallet";
import { intentsTokenForSelection, useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import {
  usePrivacyTransferExecutionStore,
} from "@/stores/privacy-transfer-execution";
import { hasUsableNearintentsUserSession } from "@/stores/nearintents-user-session";
import { useWalletStore } from "@/stores/wallet";
import { Big, formatAddress, formatDate, getAddressPlaceholder } from "@/utils";
import type { IntentsChainKind } from "@/types/nearintents";
import { CHAIN_KINDS, type ChainKind } from "@/wallet";
import { ensureEvmChain, readEvmConnectorChainId } from "@/wallet/evm/switch-chain";
import {
  PRIVACY_TRANSFER_AMOUNT_MAX_DECIMALS,
  PRIVACY_TRANSFER_MAX_RECIPIENTS,
  PRIVACY_TRANSFER_PRODUCT_FEE_BPS,
} from "./config";
import {
  formatTokenAmount,
  formatTokenNetwork,
  isPositiveAmount,
  pickLinkingEvmChainId,
  privacyStageLabel,
  privacyTransferError,
} from "./utils";

const FIELD_CLASS =
  "h-10 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30";

type TokenPicker = "source" | "destination" | null;

function linkingOptionsFrom(owners: Partial<Record<ChainKind, string>>) {
  return CHAIN_KINDS.filter((kind): kind is IntentsChainKind => kind !== "zec" && Boolean(owners[kind]))
    .map((kind) => ({ kind, address: owners[kind]! }));
}

export function PrivacyTransferView() {
  const toast = useToast();
  const owners = useConnectedWallets();
  const tokens = useIntentsTokensStore((state) => state.tokens);
  const findByAssetId = useIntentsTokensStore((state) => state.findByAssetId);
  const snapshots = usePrivacyTransferExecutionStore((state) => state.snapshots);
  const upsert = usePrivacyTransferExecutionStore((state) => state.upsert);

  const [sourceToken, setSourceToken] = useState<IntentsToken | null>(null);
  const [destinationToken, setDestinationToken] = useState<IntentsToken | null>(null);
  const [amount, setAmount] = useState("");
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [fundingSource, setFundingSource] = useState<PrivacyFundingSource>("wallet");
  const [linkingKind, setLinkingKind] = useState<IntentsChainKind | null>(null);
  const [tokenPicker, setTokenPicker] = useState<TokenPicker>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [plan, setPlan] = useState<PrivacyQuotePlan | null>(null);
  const [retryFromId, setRetryFromId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const linkingOptions = useMemo(() => linkingOptionsFrom(owners), [owners]);
  const history = useMemo(
    () => Object.values(snapshots).sort((a, b) => b.updatedAt - a.updatedAt),
    [snapshots],
  );
  const active = activeId ? snapshots[activeId] : undefined;

  useEffect(() => {
    if (linkingKind && linkingOptions.some((option) => option.kind === linkingKind)) return;
    setLinkingKind(linkingOptions[0]?.kind ?? null);
  }, [linkingKind, linkingOptions]);

  const linking = linkingOptions.find((option) => option.kind === linkingKind) ?? linkingOptions[0];
  const sourceKind = sourceToken?.chain.chainKind;
  const sourceWalletAddress = sourceKind ? owners[sourceKind] ?? "" : "";

  const derived = useMemo(() => {
    if (!sourceToken || !destinationToken || tokens.length === 0) return null;
    const registry = tokens.map((token) => ({
      assetId: token.assetId,
      blockchain: token.blockchain,
      symbol: token.symbol,
      decimals: token.decimals,
      contractAddress: token.contractAddress,
    }));
    try {
      const preferred = resolveFundingRoute({
        assetId: sourceToken.assetId,
        blockchain: sourceToken.blockchain,
        symbol: sourceToken.symbol,
        decimals: sourceToken.decimals,
        contractAddress: sourceToken.contractAddress,
      }, registry);
      return {
        route: preferred.kind,
        mode: derivePrivacyTransferMode(preferred, {
          assetId: destinationToken.assetId,
          blockchain: destinationToken.blockchain,
          symbol: destinationToken.symbol,
          decimals: destinationToken.decimals,
          contractAddress: destinationToken.contractAddress,
        }),
        registered: preferred.kind === "DIRECT",
      };
    } catch {
      return null;
    }
  }, [destinationToken, sourceToken, tokens]);

  function openWallet() {
    setWalletOpen(true);
  }

  function setRecipientAt(index: number, value: string) {
    setRecipients((current) => current.map((item, i) => (i === index ? value : item)));
    setPlan(null);
  }

  function addRecipient() {
    if (recipients.length >= PRIVACY_TRANSFER_MAX_RECIPIENTS) return;
    setRecipients((current) => [...current, ""]);
    setPlan(null);
  }

  function removeRecipient(index: number) {
    setRecipients((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
    setPlan(null);
  }

  function applyFailedRetry(id: string) {
    const snapshot = snapshots[id];
    if (!snapshot) return;
    const funding = findByAssetId(snapshot.plan.route.fundingAsset.assetId) ?? snapshot.plan.sourceToken;
    setRetryFromId(id);
    setFundingSource("balance");
    setSourceToken(funding);
    setDestinationToken(snapshot.plan.destinationToken);
    setAmount(formatTokenAmount(snapshot.creditedAmount ?? snapshot.plan.amountRaw, funding));
    setRecipients(snapshot.plan.recipients);
    setLinkingKind(snapshot.plan.linkingKind);
    setPlan(null);
  }

  async function quote() {
    if (!sourceToken || !destinationToken || !linking) {
      toast.fail({ title: "Connect a linking wallet and choose both tokens." });
      return;
    }
    if (fundingSource === "wallet" && !sourceWalletAddress) {
      openWallet();
      toast.fail({ title: `Connect a ${chainLabel(sourceToken.chain.chainKind)} wallet to fund this transfer.` });
      return;
    }
    if (!isPositiveAmount(amount)) {
      toast.fail({ title: "Enter a positive amount." });
      return;
    }
    setQuoting(true);
    try {
      const filled = recipients.map((value) => value.trim()).filter(Boolean);
      if (retryFromId) {
        const previous = snapshots[retryFromId]?.plan.recipients ?? [];
        assertFailedRetryRecipients(filled, previous, destinationToken);
      }
      const linkingChainId = linking.kind === "evm"
        ? pickLinkingEvmChainId({
          linkingKind: linking.kind,
          source: sourceToken.chain,
          destination: destinationToken.chain,
        }) ?? await readEvmConnectorChainId()
        : undefined;
      const needsWalletSign = !hasUsableNearintentsUserSession(
        toIntentsAccountId(linking.address, linking.kind),
      );
      if (linking.kind === "evm" && needsWalletSign) {
        if (linkingChainId == null) {
          throw new Error("Connect an EVM wallet on a supported network.");
        }
        await ensureEvmChain(linkingChainId);
      }
      const activated = await activateConfidentialAccount({
        address: linking.address,
        chainKind: linking.kind,
        chainId: linkingChainId,
        signMessage: (input) => useWalletStore.getState().signMessage(linking.kind, input),
      });
      if (!activated.session.accessToken) {
        throw new Error("Confidential session is missing. Sign with the linking wallet.");
      }
      if (fundingSource === "balance") {
        const balances = await getPrivateBalances(activated.session.accessToken);
        const available = BigInt(privateAvailableForToken(balances, sourceToken.assetId) || "0");
        const needed = BigInt(
          new Big(amount).times(new Big(10).pow(sourceToken.decimals)).round(0, 0).toFixed(0),
        );
        if (available < needed) throw new Error("Insufficient confidential balance.");
      }
      const next = await createPrivacyQuotePlan({
        sourceToken,
        destinationToken,
        amount: amount.trim(),
        recipients: filled,
        fundingSource,
        linkingKind: linking.kind,
        linkingAddress: linking.address,
        sourceWalletAddress: fundingSource === "wallet" ? sourceWalletAddress : linking.address,
        sourceWalletKind: fundingSource === "wallet" ? sourceToken.chain.chainKind : linking.kind,
        registry: tokens,
      });
      setPlan(next);
    } catch (error) {
      toast.fail({ title: privacyTransferError(error, "Could not quote this privacy transfer.") });
    } finally {
      setQuoting(false);
    }
  }

  async function run(snapshotId: string) {
    const snapshot = usePrivacyTransferExecutionStore.getState().snapshots[snapshotId];
    if (!snapshot) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setActiveId(snapshotId);
    setRunning(true);
    try {
      await runPrivacyTransfer(
        snapshot,
        async (next) => {
          upsert(next);
        },
        controller.signal,
      );
    } catch (error) {
      toast.fail({ title: privacyTransferError(error, "Privacy transfer failed.") });
    } finally {
      if (abortRef.current === controller) setRunning(false);
    }
  }

  async function send() {
    if (!plan) return;
    if (plan.expiresAt <= Date.now()) {
      toast.fail({ title: "Quote expired. Request a new quote." });
      setPlan(null);
      return;
    }
    const snapshot = createPrivacyExecutionSnapshot(plan);
    upsert(snapshot);
    await run(snapshot.id);
  }

  const destinationPlaceholder = destinationToken
    ? getAddressPlaceholder(destinationToken.chain.chainKind)
    : "Recipient address";

  return (
    <div className="flex flex-col gap-5 pb-10">
      <Card className="flex flex-col gap-6 px-4 py-4 md:px-7 md:py-6">
        <div>
          <h2 className="font-montserrat text-xl font-medium text-black">Send privately</h2>
          <p className="mt-2 font-montserrat text-sm font-normal text-[#909090]">
            Split one amount across 1–10 unique addresses. TRANSFER or SWAP is derived from the tokens you pick.
            Zcash cannot be used as the linking wallet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["wallet", "balance"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFundingSource(value);
                setPlan(null);
              }}
              className={cn(
                "inline-flex h-9 items-center rounded-[16px] border px-4 font-montserrat text-[13px] font-medium",
                fundingSource === value
                  ? "border-black bg-black text-white"
                  : "border-black/15 bg-white text-black hover:bg-black/5",
              )}
            >
              {value === "wallet" ? "Wallet" : "Confidential balance"}
            </button>
          ))}
        </div>

        <div>
          <p className="font-montserrat text-sm font-medium text-[#606060]">Linking wallet</p>
          {linkingOptions.length === 0 ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <p className="font-montserrat text-sm text-[#909090]">
                Connect a NEAR, EVM, Solana, or Tron wallet. Zcash cannot link a confidential account.
              </p>
              <Button size={BUTTON_SIZE.Sm} variant={BUTTON_VARIANT.Normal} onClick={() => openWallet()}>
                Connect wallet
              </Button>
            </div>
          ) : (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {linkingOptions.map((option) => (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => {
                    setLinkingKind(option.kind);
                    setPlan(null);
                  }}
                  className={cn(
                    "inline-flex h-9 items-center rounded-[16px] border px-3 font-montserrat text-[12px] font-medium",
                    linking?.kind === option.kind
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-white text-black hover:bg-black/5",
                  )}
                >
                  {chainLabel(option.kind)} · {formatAddress(option.address)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="font-montserrat text-sm font-medium text-[#606060]">You send</p>
            <div className="mt-2.5 flex items-center gap-3">
              <InputNumber
                value={amount}
                decimals={Math.min(PRIVACY_TRANSFER_AMOUNT_MAX_DECIMALS, sourceToken?.decimals ?? PRIVACY_TRANSFER_AMOUNT_MAX_DECIMALS)}
                placeholder="0"
                onNumberChange={(value) => {
                  setAmount(value);
                  setPlan(null);
                }}
                className="min-w-0 flex-1 bg-transparent font-montserrat text-[26px] font-medium text-black outline-none placeholder:text-[#aaa]"
              />
              <TokenSelectButton token={sourceToken} onClick={() => setTokenPicker("source")} />
            </div>
            {fundingSource === "wallet" && sourceToken && !sourceWalletAddress ? (
              <button
                type="button"
                className="mt-2 font-montserrat text-sm font-medium text-[#3F8AFB]"
                onClick={() => openWallet()}
              >
                Connect {chainLabel(sourceToken.chain.chainKind)} funding wallet
              </button>
            ) : null}
          </div>
          <div>
            <p className="font-montserrat text-sm font-medium text-[#606060]">They receive</p>
            <div className="mt-2.5">
              <TokenSelectButton token={destinationToken} onClick={() => setTokenPicker("destination")} />
            </div>
            {derived ? (
              <p className="mt-2 font-montserrat text-xs text-[#909090]">
                {derived.mode} · {derived.route}
                {derived.registered ? null : " · source token is not registered for a direct deposit"}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="font-montserrat text-sm font-medium text-[#606060]">Recipients</p>
            <button
              type="button"
              onClick={addRecipient}
              disabled={recipients.length >= PRIVACY_TRANSFER_MAX_RECIPIENTS}
              className="inline-flex items-center gap-1 font-montserrat text-sm font-medium text-black disabled:opacity-30"
            >
              <IconPlus className="size-3" />
              Add
            </button>
          </div>
          <div className="mt-2.5 flex flex-col gap-2">
            {recipients.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={value}
                  placeholder={destinationPlaceholder}
                  onChange={(event) => setRecipientAt(index, event.target.value)}
                  className={FIELD_CLASS}
                />
                {recipients.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Remove recipient"
                    onClick={() => removeRecipient(index)}
                    className="inline-flex size-10 shrink-0 items-center justify-center text-[#909090] hover:text-danger"
                  >
                    <IconDelete className="size-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {retryFromId ? (
            <p className="mt-2 font-montserrat text-xs text-[#909090]">
              Retrying a failed transfer from confidential balance. Recipients must stay a subset of the original addresses.
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button size={BUTTON_SIZE.Md} loading={quoting} onClick={() => void quote()}>
            Quote
          </Button>
        </div>
      </Card>

      {plan ? (
        <Card className="flex flex-col gap-4 px-4 py-4 md:px-7 md:py-6">
          <h2 className="font-montserrat text-xl font-medium text-black">Preview</h2>
          <dl className="grid gap-3 font-montserrat text-sm md:grid-cols-2">
            <PreviewRow label="Total" value={`${formatTokenAmount(plan.amountRaw, plan.sourceToken)} ${plan.sourceToken.symbol}`} />
            <PreviewRow
              label="Expected total out"
              value={`${formatTokenAmount(plan.expectedOut, plan.destinationToken)} ${plan.destinationToken.symbol}`}
            />
            <PreviewRow
              label="Minimum total out"
              value={`${formatTokenAmount(plan.minAmountOut, plan.destinationToken)} ${plan.destinationToken.symbol}`}
            />
            <PreviewRow label="Mode" value={plan.mode} />
            <PreviewRow label="Route" value={plan.route.kind} />
            <PreviewRow label="Expires" value={formatDate(plan.expiresAt)} />
            <PreviewRow label="Fee" value={`${PRIVACY_TRANSFER_PRODUCT_FEE_BPS} bps`} />
            <PreviewRow label="Recipients" value={String(plan.recipients.length)} />
          </dl>
          <div className="flex justify-end">
            <Button size={BUTTON_SIZE.Md} loading={running} onClick={() => void send()}>
              Send
            </Button>
          </div>
        </Card>
      ) : null}

      {active ? (
        <Card className="flex flex-col gap-3 px-4 py-4 md:px-7 md:py-6">
          <h2 className="font-montserrat text-xl font-medium text-black">Progress</h2>
          <p className="font-montserrat text-sm text-[#606060]">{privacyStageLabel(active.stage)}</p>
          {active.error ? <p className="font-montserrat text-sm text-danger">{active.error}</p> : null}
          {active.stage === "funding_pending_confirmation" ? (
            <p className="font-montserrat text-sm text-[#909090]">
              A wallet transfer may already be in flight. Do not send again. Resume after the deposit is found.
            </p>
          ) : null}
          {canResumePrivacyExecution(active.stage) ? (
            <div className="flex justify-end">
              <Button size={BUTTON_SIZE.Sm} variant={BUTTON_VARIANT.Normal} onClick={() => void run(active.id)}>
                Resume
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {history.length > 0 ? (
        <Card className="flex flex-col gap-4 px-4 py-4 md:px-7 md:py-6">
          <h2 className="font-montserrat text-xl font-medium text-black">This device</h2>
          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e3e3] pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-montserrat text-sm font-medium text-black">
                    {formatTokenAmount(item.plan.amountRaw, item.plan.sourceToken)} {formatTokenNetwork(item.plan.sourceToken.symbol, item.plan.sourceToken.blockchain)}
                    {" → "}
                    {item.plan.destinationToken.symbol}
                  </p>
                  <p className="mt-1 font-montserrat text-xs text-[#909090]">
                    {privacyStageLabel(item.stage)} · {item.plan.mode} · {item.plan.recipients.length} recipients
                  </p>
                </div>
                <div className="flex gap-2">
                  {canResumePrivacyExecution(item.stage) ? (
                    <Button size={BUTTON_SIZE.Sm} variant={BUTTON_VARIANT.Normal} onClick={() => void run(item.id)}>
                      Resume
                    </Button>
                  ) : null}
                  {item.stage === "failed" ? (
                    <Button size={BUTTON_SIZE.Sm} variant={BUTTON_VARIANT.Normal} onClick={() => applyFailedRetry(item.id)}>
                      Retry from balance
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <TokenSelectDialog
        open={tokenPicker === "source"}
        onClose={() => setTokenPicker(null)}
        title="Source token"
        selectedAssetId={sourceToken?.assetId}
        onSelect={({ token }) => {
          const next = intentsTokenForSelection(token);
          if (!next) return;
          setSourceToken(next);
          setPlan(null);
          setTokenPicker(null);
        }}
      />
      <TokenSelectDialog
        open={tokenPicker === "destination"}
        onClose={() => setTokenPicker(null)}
        title="Destination token"
        role="receiver"
        selectedAssetId={destinationToken?.assetId}
        onSelect={({ token }) => {
          const next = intentsTokenForSelection(token);
          if (!next) return;
          setDestinationToken(next);
          setPlan(null);
          setTokenPicker(null);
        }}
      />
      <MyWalletsDrawer open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}

function PreviewRow(props: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[#909090]">{props.label}</dt>
      <dd className="mt-1 font-medium text-black">{props.value}</dd>
    </div>
  );
}

export default PrivacyTransferView;
