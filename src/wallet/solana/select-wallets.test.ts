import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { describe, expect, it } from "vitest";
import { solanaWalletOptions, type SolanaPickerWallet } from "./select-wallets";

function wallet(name: string, readyState: WalletReadyState): SolanaPickerWallet {
  return {
    adapter: {
      name: name as WalletName,
      icon: `${name}.png`,
      url: `https://${name.toLowerCase()}.example`,
    },
    readyState,
  };
}

describe("solanaWalletOptions", () => {
  it("lists installed wallets first and marks only Installed as detected", () => {
    const options = solanaWalletOptions([
      wallet("Phantom", WalletReadyState.NotDetected),
      wallet("Solflare", WalletReadyState.Installed),
      wallet("Ledger", WalletReadyState.Loadable),
    ]);
    expect(options.map((option) => option.name)).toEqual(["Solflare", "Phantom", "Ledger"]);
    expect(options.map((option) => option.detected)).toEqual([true, false, undefined]);
    expect(options[1]?.installUrl).toBe("https://phantom.example");
    expect(options[0]?.installUrl).toBeUndefined();
    expect(options[2]?.installUrl).toBeUndefined();
  });

  it("keeps the original order when nothing is installed", () => {
    const options = solanaWalletOptions([
      wallet("Phantom", WalletReadyState.NotDetected),
      wallet("Ledger", WalletReadyState.Loadable),
    ]);
    expect(options.map((option) => option.name)).toEqual(["Phantom", "Ledger"]);
  });
});
