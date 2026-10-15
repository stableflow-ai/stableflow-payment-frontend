import {
  BaseSignerWalletAdapter,
  WalletNotConnectedError,
  WalletReadyState,
  type WalletError,
  type WalletName,
} from "@solana/wallet-adapter-base";
import {
  getDerivationPath,
  LedgerWalletAdapter,
  WalletConnectWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { PublicKey, Transaction, TransactionVersion, VersionedTransaction } from "@solana/web3.js";
import { LEDGER_CONNECT_DIALOG_DELAY_MS, LEDGER_USB_VENDOR_ID, LEDGER_WALLET_ICON } from "./config";
import {
  cancelLedgerConnectChooser,
  LedgerConnectCancelledError,
  openLedgerConnectChooser,
  type LedgerConnectOutcome,
} from "./ledger-choice";
import { openLedgerLiveWalletConnect } from "./utils";
import {
  hasExistingSolanaWalletConnectSession,
  setSilentWalletConnectConnect,
  setWalletConnectDisplayUriHandler,
} from "./walletconnect-connect";

type WalletConnectAdapterConfig = ConstructorParameters<typeof WalletConnectWalletAdapter>[0];
type InnerAdapter = LedgerWalletAdapter | WalletConnectWalletAdapter;
type MessageSigner = {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
};

function canSignMessage(adapter: InnerAdapter): adapter is InnerAdapter & MessageSigner {
  return typeof (adapter as Partial<MessageSigner>).signMessage === "function";
}

const ledgerMeta = new LedgerWalletAdapter();

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type LedgerHidDevice = {
  vendorId: number;
  opened: boolean;
  close: () => Promise<void>;
};

type LedgerHidNavigator = {
  hid?: {
    getDevices: () => Promise<LedgerHidDevice[]>;
  };
};

async function closeOpenLedgerHidDevices(): Promise<void> {
  const hid = (globalThis.navigator as LedgerHidNavigator | undefined)?.hid;
  if (!hid?.getDevices) return;
  const devices = await hid.getDevices();
  await Promise.all(
    devices
      .filter((device) => device.vendorId === LEDGER_USB_VENDOR_ID && device.opened)
      .map((device) => device.close().catch(() => undefined)),
  );
}

export class SolanaLedgerWalletAdapter extends BaseSignerWalletAdapter {
  name = "Ledger" as WalletName<"Ledger">;
  url = ledgerMeta.url;
  icon = LEDGER_WALLET_ICON;
  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(["legacy", 0]);

  private readonly hid = new LedgerWalletAdapter({
    derivationPath: getDerivationPath(0),
  });
  private readonly live: WalletConnectWalletAdapter;
  private readonly liveOptions: WalletConnectAdapterConfig["options"];
  private inner: InnerAdapter | null = null;
  private _publicKey: PublicKey | null = null;
  private _connecting = false;
  private aborted = false;
  private _readyState: WalletReadyState =
    typeof window === "undefined" ? WalletReadyState.Unsupported : WalletReadyState.Loadable;

  constructor(config: WalletConnectAdapterConfig) {
    super();
    this.live = new WalletConnectWalletAdapter(config);
    this.liveOptions = config.options;
  }

  get publicKey() {
    return this._publicKey;
  }

  get connecting() {
    return this._connecting;
  }

  get readyState() {
    return this._readyState;
  }

  async autoConnect(): Promise<void> {
    if (this.connected) return;
    this.aborted = false;
    this._connecting = true;
    try {
      if (!(await hasExistingSolanaWalletConnectSession(this.liveOptions))) {
        throw new LedgerConnectCancelledError();
      }
      setSilentWalletConnectConnect(true);
      try {
        await this.connectWith("live");
      } finally {
        setSilentWalletConnectConnect(false);
      }
      if (this.aborted) throw new LedgerConnectCancelledError();
    } catch {
      throw new LedgerConnectCancelledError();
    } finally {
      this._connecting = false;
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;
      this.aborted = false;
      this._connecting = true;
      await sleep(LEDGER_CONNECT_DIALOG_DELAY_MS);
      if (this.aborted) throw new LedgerConnectCancelledError();
      const outcome = await openLedgerConnectChooser({
        connectUsb: () => this.connectWith("usb"),
        connectLive: () => this.connectWith("live"),
      });
      this.throwIfChooserFailed(outcome);
    } catch (error) {
      if (!this.aborted) {
        const inner = this.inner;
        this.clearInner();
        if (inner) void inner.disconnect().catch(() => undefined);
      }
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    this.aborted = true;
    cancelLedgerConnectChooser();
    const inner = this.inner;
    this.clearInner();
    try {
      if (inner) await inner.disconnect();
    } catch {
      // WalletConnect throws when the session is already gone.
    }
    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    const inner = this.inner;
    if (!inner) throw new WalletNotConnectedError();
    return inner.signTransaction(transaction);
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const inner = this.inner;
    if (!inner || !canSignMessage(inner)) throw new WalletNotConnectedError();
    return inner.signMessage(message);
  }

  override async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    const inner = this.inner;
    if (!inner) throw new WalletNotConnectedError();
    return inner.signAllTransactions(transactions);
  }

  private throwIfChooserFailed(outcome: LedgerConnectOutcome) {
    if (this.aborted || ("cancelled" in outcome && outcome.cancelled)) {
      throw new LedgerConnectCancelledError();
    }
    if (!outcome.ok) throw outcome.error;
  }

  private async connectWith(choice: "usb" | "live") {
    const inner = choice === "usb" ? this.hid : this.live;
    if (choice === "live") {
      setWalletConnectDisplayUriHandler(openLedgerLiveWalletConnect);
    }
    try {
      if (choice === "usb") await this.connectUsbHid();
      else await inner.connect();
    } finally {
      setWalletConnectDisplayUriHandler(null);
    }
    if (this.aborted) {
      void inner.disconnect().catch(() => undefined);
      throw new LedgerConnectCancelledError();
    }
    this.inner = inner;
    this._publicKey = inner.publicKey;
    if (!this._publicKey) throw new WalletNotConnectedError();
    inner.on("disconnect", this.handleInnerDisconnect);
    inner.on("error", this.handleInnerError);
    this.emit("connect", this._publicKey);
  }

  private async connectUsbHid() {
    try {
      await this.hid.connect();
    } catch {
      await closeOpenLedgerHidDevices();
      await sleep(LEDGER_CONNECT_DIALOG_DELAY_MS);
      try {
        await this.hid.connect();
      } catch (retryError) {
        await closeOpenLedgerHidDevices();
        throw retryError;
      }
    }
  }

  private clearInner() {
    if (this.inner) {
      this.inner.off("disconnect", this.handleInnerDisconnect);
      this.inner.off("error", this.handleInnerError);
    }
    this.inner = null;
    this._publicKey = null;
  }

  private handleInnerDisconnect = () => {
    this.clearInner();
    this.emit("disconnect");
  };

  private handleInnerError = (error: WalletError) => {
    this.emit("error", error);
  };
}
