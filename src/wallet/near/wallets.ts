import type { WalletSelectOption } from "@stableflow/pay-widgets/wallet-select";

type NearPickerWallet = {
  manifest: {
    id: string;
    name: string;
    icon: string;
    website: string;
  };
};

export function nearWalletWebsiteHost(website: string | undefined): string | undefined {
  const value = website?.trim();
  if (!value) return undefined;
  try {
    return new URL(value).hostname || undefined;
  } catch {
    return undefined;
  }
}

export function nearWalletOptions(wallets: readonly NearPickerWallet[]): WalletSelectOption[] {
  return wallets.map((wallet) => ({
    id: wallet.manifest.id,
    name: wallet.manifest.name,
    icon: wallet.manifest.icon,
    description: nearWalletWebsiteHost(wallet.manifest.website),
  }));
}
