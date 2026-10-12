import { IconRefresh } from "@stableflow/pay-ui/icons/outline/refresh";
import { Button } from "@stableflow/pay-ui/button";
import { Skeleton } from "@stableflow/pay-ui/skeleton";
import { BUTTON_SIZE } from "@stableflow/pay-ui/button";
import { InputNumber } from "@stableflow/pay-ui/input-number";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import { AMOUNT_MAX_DECIMALS, PAYER_CARD_STATE, type PayerCardState } from "../config";
import { formatCouponAmount } from "../utils";
import { CouponShell } from "./CouponShell";
import { ResultRow } from "./ResultRow";
import { TokenMark } from "./TokenMark";
import { YouPaySection } from "./YouPaySection";
import Big from "big.js";

export function PayCard(props: {
  state: PayerCardState;
  paymentTitle: string;
  isOpenAmount: boolean;
  amount: string;
  onAmountChange: (value: string) => void;
  destToken: IntentsToken | null;
  youPayAmount: string;
  fiatDisplay: string;
  originToken: IntentsToken | null;
  onOriginTokenChange: (token: IntentsToken) => void;
  walletAddress: string | null;
  signerAddress?: string | null;
  walletConnected: boolean;
  walletIcon?: string | null;
  connecting: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  feeDisplay: string;
  durationDisplay: string;
  quoteError: string | null;
  payLoading: boolean;
  canPay: boolean;
  walletReady: boolean;
  swapRefreshing: boolean;
  canRefreshSwap: boolean;
  onRefreshSwap: () => void;
  onPay: () => void;
}) {
  const couponAmountDecimals = 6;
  const couponAmount = formatCouponAmount(props.amount || "0", { maxDecimals: couponAmountDecimals, padDecimals: false });
  const isDust = Big(props.amount || "0").gt(0) && Big(props.amount || "0").lt(Big(1).div(10 ** couponAmountDecimals));
  const buttonLabel = props.walletReady ? "Pay Now" : props.connecting ? "Connecting…" : "Connect wallet";

  if (props.state === PAYER_CARD_STATE.Unavailable || props.state === PAYER_CARD_STATE.Loading) {
    return (
      <CouponShell
        top={
          <div className="flex min-h-[200px] flex-col items-center justify-center">
            {props.state === PAYER_CARD_STATE.Loading ? (
              <div className="flex w-full flex-col gap-3 px-6" aria-busy="true" aria-label="Loading">
                <Skeleton className="mx-auto h-8 w-40" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <p className="text-center font-montserrat text-sm text-[#909090]">
                This payment is not available
              </p>
            )}
          </div>
        }
        bottom={<div className="min-h-[160px]" />}
      />
    );
  }

  return (
    <CouponShell
      top={
        <>
          <button
            type="button"
            aria-label="Refresh swap"
            disabled={!props.canRefreshSwap}
            onClick={props.onRefreshSwap}
            className="absolute top-3 right-3 inline-flex size-8 cursor-pointer items-center justify-center text-[#909090] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconRefresh
              className={cn(
                "size-3.5",
                props.swapRefreshing && "animate-spin [animation-direction:reverse]",
              )}
            />
          </button>
          {
            !!props.paymentTitle && (
              <h1 className="mx-auto max-w-full text-center font-montserrat text-lg font-medium text-[#606060]">
                <span>Pay </span>
                <span className="font-bold text-black">{props.paymentTitle}</span>
              </h1>
            )
          }
          {props.isOpenAmount ? (
            <InputNumber
              value={props.amount}
              decimals={AMOUNT_MAX_DECIMALS}
              placeholder="0"
              onNumberChange={props.onAmountChange}
              className={cn(
                "mt-4 w-full bg-transparent text-center font-montserrat text-[46px] font-semibold leading-none text-black outline-none placeholder:text-[#aaa] border-none",
              )}
            />
          ) : (
            <p className="mt-4 text-center font-montserrat text-[46px] leading-none font-semibold text-black">
              {isDust ? "<" : ""}
              {couponAmount.whole}
              {
                isDust ? (
                  <span className="text-[#aaa]">.{Big(1).div(10 ** couponAmountDecimals).toFixed(couponAmountDecimals, 0)}</span>
                ) : (
                  couponAmount.fraction ? (
                    <span className="text-[#aaa]">.{couponAmount.fraction}</span>
                  ) : null
                )
              }
            </p>
          )}
          {props.destToken ? (
            <div className="mt-4 flex justify-center">
              <TokenMark token={props.destToken} />
            </div>
          ) : null}
        </>
      }
      bottom={
        <>
          <YouPaySection
            amountDisplay={props.youPayAmount}
            fiatDisplay={props.fiatDisplay}
            originToken={props.originToken}
            onOriginTokenChange={props.onOriginTokenChange}
            walletAddress={props.walletAddress}
            signerAddress={props.signerAddress}
            walletConnected={props.walletConnected}
            walletIcon={props.walletIcon}
            connecting={props.connecting}
            onConnectWallet={props.onConnectWallet}
            onDisconnectWallet={props.onDisconnectWallet}
          />
          <div className="mt-4 h-px w-full bg-[#e3e3e3]" />
          <div className="mt-4">
            <ResultRow
              originToken={props.originToken}
              destToken={props.destToken}
              feeDisplay={props.feeDisplay}
              durationDisplay={props.durationDisplay}
            />
          </div>
          {props.quoteError ? (
            <p className="mt-2 font-montserrat text-xs text-danger">{props.quoteError}</p>
          ) : null}
          <Button
            size={BUTTON_SIZE.Xl}
            className="mt-6 w-full"
            loading={props.payLoading}
            disabled={props.walletReady ? !props.canPay : props.connecting}
            onClick={props.onPay}
          >
            {buttonLabel}
          </Button>
        </>
      }
    />
  );
}
