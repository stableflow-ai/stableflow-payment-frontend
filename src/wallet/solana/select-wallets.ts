import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import type { WalletSelectOption } from "@stableflow/pay-widgets/wallet-select";

export type SolanaPickerWallet = {
  adapter: {
    name: WalletName;
    icon: string;
    url: string;
  };
  readyState: WalletReadyState;
};

export function solanaWalletOptions(wallets: readonly SolanaPickerWallet[]): WalletSelectOption[] {
  const installed: WalletSelectOption[] = [];
  const rest: WalletSelectOption[] = [];
  for (const wallet of wallets) {
    const option = solanaWalletOption(wallet);
    if (wallet.readyState === WalletReadyState.Installed) installed.push(option);
    else rest.push(option);
  }
  return installed.length > 0 ? [...installed, ...rest] : rest;
}

function solanaWalletOption(wallet: SolanaPickerWallet): WalletSelectOption {
  const notDetected = wallet.readyState === WalletReadyState.NotDetected;
  return {
    id: wallet.adapter.name,
    name: wallet.adapter.name,
    icon: wallet.adapter.icon,
    detected: wallet.readyState === WalletReadyState.Installed ? true : notDetected ? false : undefined,
    installUrl: notDetected ? wallet.adapter.url : undefined,
  };
}
