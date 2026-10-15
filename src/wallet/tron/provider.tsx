import { WalletProvider as TronAdapterProvider, useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import {
  BitKeepAdapter,
  OkxWalletAdapter,
  TokenPocketAdapter,
  TronLinkAdapter,
  WalletConnectAdapter,
} from "@tronweb3/tronwallet-adapters";
import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import useToast from "@/hooks/use-toast";
import { metadata } from "../metadata";
import { LedgerBlindSignDialog } from "./LedgerBlindSignDialog";
import { LedgerConnectDialog } from "./LedgerConnectDialog";
import { TronLedgerWalletAdapter } from "./ledger-adapter";
import { TRON_APP_NAME } from "./config";
import { TronWalletModalProvider } from "./select-modal";
import { isTronSignOrSendError, reportTronWalletError } from "./utils";

function TronRejectDeselect({ deselectRef }: { deselectRef: MutableRefObject<() => void> }) {
  const { disconnect } = useWallet();
  useEffect(() => {
    deselectRef.current = () => {
      void disconnect();
    };
  }, [deselectRef, disconnect]);
  return null;
}

export function TronWalletProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const deselectRef = useRef<() => void>(() => {});
  const adapters = useMemo(() => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";
    return [
      new TronLinkAdapter(),
      new OkxWalletAdapter(),
      new BitKeepAdapter(),
      new TokenPocketAdapter(),
      new TronLedgerWalletAdapter(),
      new WalletConnectAdapter({
        network: "Mainnet",
        options: {
          relayUrl: "wss://relay.walletconnect.com",
          projectId,
          metadata,
        },
      }),
    ];
  }, []);

  return (
    <TronAdapterProvider adapters={adapters} autoConnect disableAutoConnectOnLoad onError={(error) => {
      if (!isTronSignOrSendError(error)) {
        console.error(`[wallet:tron] ${TRON_APP_NAME}`, error);
      }
      reportTronWalletError(toast, error, () => deselectRef.current());
    }}>
      <TronRejectDeselect deselectRef={deselectRef} />
      <TronWalletModalProvider>
        {children}
        <LedgerConnectDialog />
        <LedgerBlindSignDialog />
      </TronWalletModalProvider>
    </TronAdapterProvider>
  );
}
