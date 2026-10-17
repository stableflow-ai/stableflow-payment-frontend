import { MyWalletsDrawer } from "@stableflow/pay-widgets/my-wallets";
import { WalletChainsButton } from "@stableflow/pay-widgets/wallet-chains-button";
import { useWalletDrawerStore } from "@/stores/wallet-drawer";

export function HeaderWalletEntry() {
  const open = useWalletDrawerStore((state) => state.open);
  const setOpen = useWalletDrawerStore((state) => state.setOpen);
  const target = useWalletDrawerStore((state) => state.target);

  return (
    <>
      <WalletChainsButton onClick={() => setOpen(true)} />
      <MyWalletsDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSelectToken={target ? (token) => target.onSelect(token) : undefined}
        getTokenDisabledReason={target?.disabledReason}
      />
    </>
  );
}
