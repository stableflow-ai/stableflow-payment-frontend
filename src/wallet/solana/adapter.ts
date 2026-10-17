import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useSolanaWalletModal } from "./select-modal";
import { useCallback, useEffect, useMemo } from "react";
import { isAddressValid } from "@/utils";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import { payloadAsText, walletDoesNotSupportSigning } from "../intents-sign";
import { isSquadsXAdapter } from "./multisig/detect";
import { useSquadsMode } from "./multisig/use-squads-mode";
import { setSolanaSigner, setSolanaWalletMeta } from "./session";
import {
  createSolanaEmptyIntentBytes,
  formatSolanaSignedData,
  signSolanaIntentsMessage,
} from "./sign-intents-message";

export function useSolanaWallet(): UseWalletResult {
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    signMessage: adapterSignMessage,
    signTransaction,
    wallet,
  } = useSolanaAdapter();
  const { setVisible, visible } = useSolanaWalletModal();
  const { mode } = useSquadsMode();
  const isSquadsX = mode === "squadsx";
  const address = publicKey?.toBase58() || null;

  useEffect(() => {
    if (!publicKey || !signTransaction) {
      setSolanaSigner(null);
      setSolanaWalletMeta(null);
      return;
    }
    setSolanaSigner({ publicKey, signTransaction });
    setSolanaWalletMeta({
      name: wallet?.adapter.name ?? "",
      isSquadsX: isSquadsXAdapter(wallet?.adapter),
    });
    return () => {
      setSolanaSigner(null);
      setSolanaWalletMeta(null);
    };
  }, [publicKey, signTransaction, wallet]);

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    return { address, chainKind: "solana", chainId: "mainnet-beta", icon: wallet?.adapter.icon || null };
  }, [address, wallet?.adapter.icon]);

  const connect = useCallback(() => {
    const openModal = () => setVisible(true);
    if (connected) {
      void Promise.resolve(disconnect()).finally(() => {
        select(null);
        openModal();
      });
      return;
    }
    openModal();
  }, [connected, disconnect, select, setVisible]);

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:solana] No connected account to sign with.");
      }
      if (isSquadsX) {
        throw walletDoesNotSupportSigning("Solana");
      }
      const message = createSolanaEmptyIntentBytes({
        signerId: input.signerId,
        deadlineMs: input.deadlineMs,
        nonce: input.nonce,
      });
      const signature = await signSolanaIntentsMessage(message, adapterSignMessage);
      return formatSolanaSignedData(signature, message, address);
    },
    [adapterSignMessage, address, isSquadsX],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:solana] No connected account to sign with.");
      }
      if (isSquadsX) {
        throw walletDoesNotSupportSigning("Solana");
      }
      const payload = payloadAsText(intent.payload);
      const message = new TextEncoder().encode(payload);
      const signature = await signSolanaIntentsMessage(message, adapterSignMessage);
      return formatSolanaSignedData(signature, message, address);
    },
    [adapterSignMessage, address, isSquadsX],
  );

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "solana"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "solana",
    account,
    isConnected: Boolean(connected && address),
    isConnecting: connecting,
    isModalOpen: visible,
    connect,
    disconnect,
    signMessage,
    signGeneratedIntent,
    isAddressValid: isAddressValidFn,
  }), [
    account,
    address,
    connect,
    connected,
    connecting,
    disconnect,
    isAddressValidFn,
    signGeneratedIntent,
    signMessage,
    visible,
  ]);
}
