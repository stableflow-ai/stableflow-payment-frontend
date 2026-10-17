import { WalletSelectDialog } from "@stableflow/pay-widgets/wallet-select";
import { useMemo } from "react";
import { NOIR_ICON_URL } from "./config";

export function ZecWalletSelectModal(props: {
  visible: boolean;
  onClose: () => void;
  onSelectNoir: () => void;
}) {
  const { visible, onClose, onSelectNoir } = props;
  const wallets = useMemo(() => [{
    id: "noir",
    name: "Noir Wallet",
    icon: NOIR_ICON_URL,
  }], []);

  return (
    <WalletSelectDialog
      open={visible}
      onClose={onClose}
      title="Select Zcash Wallet"
      wallets={wallets}
      elevated
      onSelect={() => {
        onClose();
        onSelectNoir();
      }}
    />
  );
}
