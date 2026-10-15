import { describe, expect, it } from "vitest";
import { nearWalletOptions, nearWalletWebsiteHost } from "./wallets";

describe("nearWalletWebsiteHost", () => {
  it("returns the hostname", () => {
    expect(nearWalletWebsiteHost("https://app.hot.tg/path")).toBe("app.hot.tg");
  });

  it("returns undefined for a blank or invalid website", () => {
    expect(nearWalletWebsiteHost("  ")).toBeUndefined();
    expect(nearWalletWebsiteHost("not a url")).toBeUndefined();
  });
});

describe("nearWalletOptions", () => {
  it("uses the website hostname as the subtitle and does not mark detected", () => {
    const options = nearWalletOptions([
      {
        manifest: {
          id: "hot-wallet",
          name: "HOT Wallet",
          icon: "hot.png",
          website: "https://hot.tg",
        },
      },
    ]);
    expect(options).toEqual([
      {
        id: "hot-wallet",
        name: "HOT Wallet",
        icon: "hot.png",
        description: "hot.tg",
      },
    ]);
    expect(options[0]?.detected).toBeUndefined();
  });
});