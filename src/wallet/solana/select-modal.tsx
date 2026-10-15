import { useWallet } from "@solana/wallet-adapter-react";
import { WalletSelectDialog } from "@stableflow/pay-widgets/wallet-select";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { solanaWalletOptions } from "./select-wallets";

type SolanaWalletModalContextValue = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

const SolanaWalletModalContext = createContext<SolanaWalletModalContextValue | null>(null);

export function useSolanaWalletModal(): SolanaWalletModalContextValue {
  const value = useContext(SolanaWalletModalContext);
  if (!value) {
    throw new Error("useSolanaWalletModal must be used within SolanaWalletModalProvider");
  }
  return value;
}

export function SolanaWalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const { wallets, select } = useWallet();
  const options = useMemo(() => solanaWalletOptions(wallets), [wallets]);

  return (
    <SolanaWalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <WalletSelectDialog
        open={visible}
        onClose={() => setVisible(false)}
        title="Select Solana Wallet"
        wallets={options}
        elevated
        onSelect={(option) => {
          const match = wallets.find((wallet) => wallet.adapter.name === option.id);
          setVisible(false);
          if (match) select(match.adapter.name);
        }}
      />
    </SolanaWalletModalContext.Provider>
  );
}
