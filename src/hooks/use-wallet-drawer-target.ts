import { useEffect, useRef } from "react";
import type { PayToken } from "@stableflow/pay-widgets/token-select";
import { useWalletDrawerStore, type WalletDrawerTarget } from "@/stores/wallet-drawer";

export function useWalletDrawerTarget(target: WalletDrawerTarget | null) {
  const setTarget = useWalletDrawerStore((state) => state.setTarget);
  const latest = useRef(target);
  latest.current = target;
  const active = target != null;

  useEffect(() => {
    if (!active) return;
    const entry: WalletDrawerTarget = {
      onSelect: (token: PayToken) => {
        latest.current?.onSelect(token);
      },
      disabledReason: (token: PayToken) => latest.current?.disabledReason?.(token) ?? null,
    };
    setTarget(entry);
    return () => {
      if (useWalletDrawerStore.getState().target === entry) setTarget(null);
    };
  }, [active, setTarget]);
}
