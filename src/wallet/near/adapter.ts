import { Buffer } from "buffer";
import { useCallback, useEffect, useMemo } from "react";
import { isAddressValid } from "@/utils";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import { useNearWalletContext } from "./provider";
import {
  INTENTS_RECIPIENT,
  buildNep413Message,
  encodeEd25519,
  isoDeadline,
  nonceToBase64,
  parseNep413Payload,
  walletDoesNotSupportSigning,
} from "../intents-sign";

export function useNearWallet(): UseWalletResult {
  const { connector, accountId, walletIcon, connecting, pickerOpen, openPicker } = useNearWalletContext();

  const account = useMemo<WalletAccount | null>(() => {
    if (!accountId) return null;
    return { address: accountId, chainKind: "near", chainId: "mainnet", icon: walletIcon ?? undefined };
  }, [accountId, walletIcon]);

  const connect = useCallback(() => {
    openPicker();
    if (!connector || !accountId) return;
    void connector.disconnect().catch(() => {
      // The picker stays open so the user can switch wallets.
    });
  }, [accountId, connector, openPicker]);

  const disconnect = useCallback(() => {
    if (!connector) return;
    void connector.disconnect().catch(() => {
      // Session is already cleared on wallet:signOut when disconnect succeeds.
    });
  }, [connector]);

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!connector || !accountId) {
        throw new Error("[wallet:near] No connected account to sign with.");
      }
      const wallet = await connector.wallet();
      if (wallet.manifest.features?.signMessage !== true) {
        throw walletDoesNotSupportSigning("NEAR");
      }
      const recipient = input.recipient || INTENTS_RECIPIENT;
      const nonce = Buffer.from(input.nonce);
      const message = buildNep413Message(input.signerId, isoDeadline(input.deadlineMs));
      const signed = await wallet.signMessage({
        message,
        recipient,
        nonce,
      });
      if (!signed?.signature || !signed.publicKey) {
        throw new Error("[wallet:near] Wallet did not return a signature.");
      }
      return {
        standard: "nep413",
        payload: {
          recipient,
          nonce: nonceToBase64(input.nonce),
          message,
        },
        public_key: encodeEd25519(signed.publicKey),
        signature: encodeEd25519(signed.signature),
      };
    },
    [accountId, connector],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!connector || !accountId) {
        throw new Error("[wallet:near] No connected account to sign with.");
      }
      const wallet = await connector.wallet();
      if (wallet.manifest.features?.signMessage !== true) {
        throw walletDoesNotSupportSigning("NEAR");
      }
      const parsed = parseNep413Payload(intent.payload);
      const signed = await wallet.signMessage({
        message: parsed.message,
        recipient: parsed.recipient,
        nonce: Buffer.from(parsed.nonce),
      });
      if (!signed?.signature || !signed.publicKey) {
        throw new Error("[wallet:near] Wallet did not return a signature.");
      }
      return {
        standard: "nep413",
        payload: {
          recipient: parsed.recipient,
          nonce: nonceToBase64(parsed.nonce),
          message: parsed.message,
        },
        public_key: encodeEd25519(signed.publicKey),
        signature: encodeEd25519(signed.signature),
      };
    },
    [accountId, connector],
  );

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "near"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "near",
    account,
    isConnected: Boolean(accountId),
    isConnecting: connecting,
    isModalOpen: pickerOpen,
    connect,
    disconnect,
    signMessage,
    signGeneratedIntent,
    isAddressValid: isAddressValidFn,
  }), [account, accountId, connect, connecting, disconnect, isAddressValidFn, pickerOpen, signGeneratedIntent, signMessage]);
}
