/**
 * Root wallet provider tree.
 *
 * Wagmi/RainbowKit (EVM) wraps Solana, Near, Tron, and Zcash adapters so UI can
 * connect any of them without page-level provider changes.
 */

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./evm/config";
import { NearWalletProvider } from "./near/provider";
import { SolanaWalletProvider } from "./solana/provider";
import { TronWalletProvider } from "./tron/provider";
import { ZecWalletProvider } from "./zec/provider";
import { WalletSync } from "./WalletSync";

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider modalSize="compact">
        <SolanaWalletProvider>
          <NearWalletProvider>
            <TronWalletProvider>
              <ZecWalletProvider>
                <WalletSync />
                {children}
              </ZecWalletProvider>
            </TronWalletProvider>
          </NearWalletProvider>
        </SolanaWalletProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
