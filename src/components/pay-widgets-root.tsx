import { useCallback, useMemo, type ReactNode } from "react";
import {
  defaultWalletKindMeta,
  normalizePayConfig,
  PayWidgetsProvider,
  type ReadBalances,
  type WalletKindMeta,
} from "@stableflow/pay-widgets/token-select";
import useToast from "@/hooks/use-toast";
import { usePayConfigQuery } from "@/hooks/use-pay-config";
import { intentsTokenForSelection } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useWalletStore } from "@/stores/wallet";
import { CHAIN_KINDS, type ChainKind } from "@/wallet";
import { useSafeMode } from "@/wallet/evm/safe";

function appChainKind(kind: string): ChainKind | null {
  return (CHAIN_KINDS as readonly string[]).includes(kind) ? kind as ChainKind : null;
}

export function PayWidgetsRoot({ children }: { children: ReactNode }) {
  const chains = useWalletStore((state) => state.chains);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const safeApp = useSafeMode().mode === "app";
  const toast = useToast();
  const { data, isPending } = usePayConfigQuery();
  const tokens = useMemo(() => (data ? normalizePayConfig(data) : []), [data]);
  const walletKinds = useMemo(() => {
    const next: WalletKindMeta[] = [];
    for (const kind of CHAIN_KINDS) {
      const meta = defaultWalletKindMeta(kind);
      if (meta) next.push(meta);
    }
    return next;
  }, []);

  const accounts = useMemo(() => {
    const next = {} as Record<ChainKind, {
      address: string | null;
      icon: string | null;
      connecting: boolean;
      canDisconnect: boolean;
    }>;
    for (const kind of CHAIN_KINDS) {
      const slice = chains[kind];
      next[kind] = {
        address: slice.account?.address ?? null,
        icon: slice.account?.icon ?? null,
        connecting: slice.connecting,
        canDisconnect: kind === "evm" ? !safeApp : true,
      };
    }
    return next;
  }, [chains, safeApp]);

  const readBalances = useCallback<ReadBalances>(async (batch) => {
    const kind = appChainKind(batch.chainKind);
    if (!kind) {
      return batch.tokens.map((token) => ({ assetId: token.assetId, error: "Unknown chain" }));
    }
    const resolved = batch.tokens.map((token) => ({
      assetId: token.assetId,
      intents: intentsTokenForSelection(token),
    }));
    const readable = resolved.flatMap((item) => (item.intents ? [item.intents] : []));
    if (readable.length > 0) {
      await useTokenBalancesStore.getState().fetchAll(
        { [kind]: batch.owner },
        readable,
        { force: true },
      );
    }
    return resolved.map((item) => {
      if (!item.intents) return { assetId: item.assetId, error: "Unknown token" };
      const entry = useTokenBalancesStore.getState().getBalance(batch.owner, item.assetId);
      if (!entry || entry.status === "error" || entry.formatted == null) {
        return { assetId: item.assetId, error: entry?.error || "Failed to read balance" };
      }
      return {
        assetId: item.assetId,
        formatted: entry.formatted,
        raw: entry.raw == null ? undefined : entry.raw.toString(),
      };
    });
  }, []);

  const connectKind = useCallback((kind: string) => {
    const appKind = appChainKind(kind);
    if (appKind) connect(appKind);
  }, [connect]);

  const disconnectKind = useCallback((kind: string) => {
    const appKind = appChainKind(kind);
    if (appKind) disconnect(appKind);
  }, [disconnect]);

  const onCopyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }, [toast]);

  return (
    <PayWidgetsProvider
      tokens={tokens}
      loading={isPending}
      walletKinds={walletKinds}
      wallet={{ accounts, connect: connectKind, disconnect: disconnectKind }}
      readBalances={readBalances}
      onCopyAddress={onCopyAddress}
    >
      {children}
    </PayWidgetsProvider>
  );
}
