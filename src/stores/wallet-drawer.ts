import { create } from "zustand";
import type { PayToken } from "@stableflow/pay-widgets/token-select";

export type WalletDrawerTarget = {
  onSelect: (token: PayToken) => void;
  disabledReason?: (token: PayToken) => string | null;
};

type WalletDrawerState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  target: WalletDrawerTarget | null;
  setTarget: (target: WalletDrawerTarget | null) => void;
};

export const useWalletDrawerStore = create<WalletDrawerState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  target: null,
  setTarget: (target) => set({ target }),
}));
