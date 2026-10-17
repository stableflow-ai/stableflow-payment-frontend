import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useMemo, type ReactNode } from "react";
import { solanaConnectionConfig, solanaPrimaryRpcUrl } from "@/lib/rpc/solana";
import useToast from "@/hooks/use-toast";
import { metadata } from "../metadata";
import { LedgerConnectDialog } from "./LedgerConnectDialog";
import { SolanaWalletModalProvider } from "./select-modal";
import { SolanaLedgerWalletAdapter } from "./ledger-adapter";
import { reportSolanaWalletError } from "./utils";
import {
  installSolanaWalletConnectConnectPatch,
  SolanaWalletConnectWalletAdapter,
} from "./walletconnect-connect";

installSolanaWalletConnectConnectPatch();

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolanaLedgerWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          metadata,
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
        },
      }),
      new SolanaWalletConnectWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          metadata,
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
        },
      }),
    ],
    [],
  );
  const endpoint = useMemo(() => solanaPrimaryRpcUrl(), []);
  const config = useMemo(() => solanaConnectionConfig(), []);

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect onError={(error) => {
        reportSolanaWalletError(toast, error);
      }}>
        <SolanaWalletModalProvider>
          {children}
          <LedgerConnectDialog />
        </SolanaWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
