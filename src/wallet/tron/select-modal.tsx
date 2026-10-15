import { AdapterState } from "@tronweb3/tronwallet-abstract-adapter";
import { useWallet, type Wallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { WalletModalContext } from "@tronweb3/tronwallet-adapter-react-ui";
import { WalletSelectDialog, type WalletSelectOption } from "@stableflow/pay-widgets/wallet-select";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { visibleTronWallets } from "./utils";

function tronWalletOption(wallet: Wallet): WalletSelectOption {
  const installed = wallet.state !== AdapterState.NotFound && wallet.state !== AdapterState.Loading;
  return {
    id: wallet.adapter.name,
    name: wallet.adapter.name,
    icon: wallet.adapter.icon,
    detected: installed ? true : undefined,
  };
}

function TronWalletSelectModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { wallets, select, wallet, connected, connect } = useWallet();
  const walletsList = useMemo(() => visibleTronWallets(wallets), [wallets]);
  const options = useMemo(() => walletsList.map(tronWalletOption), [walletsList]);

  const onWalletClick = useCallback((next: Wallet) => {
    onClose();
    if (wallet?.adapter.name === next.adapter.name && !connected) {
      void connect();
      return;
    }
    select(next.adapter.name);
  }, [connect, connected, onClose, select, wallet?.adapter.name]);

  return (
    <WalletSelectDialog
      open={visible}
      onClose={onClose}
      title="Select Tron Wallet"
      wallets={options}
      elevated
      onSelect={(option) => {
        const next = walletsList.find((item) => item.adapter.name === option.id);
        if (next) onWalletClick(next);
      }}
    />
  );
}

export function TronWalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <TronWalletSelectModal visible={visible} onClose={() => setVisible(false)} />
    </WalletModalContext.Provider>
  );
}
