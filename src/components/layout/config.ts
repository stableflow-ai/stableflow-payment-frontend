import type { ComponentType } from "react";
import { IconCode } from "@stableflow/pay-ui/icons/outline/code";
import { IconKey } from "@stableflow/pay-ui/icons/outline/key";
import { IconLink } from "@stableflow/pay-ui/icons/outline/link";
import { IconOverview } from "@stableflow/pay-ui/icons/outline/overview";
import { IconRecords2 } from "@stableflow/pay-ui/icons/outline/records";
import { IconSetting } from "@stableflow/pay-ui/icons/outline/setting";
import type { IconProps } from "@stableflow/pay-ui/icons/types";
import { PRIVACY_TRANSFER_PATH, PRIVACY_TRANSFER_TITLE } from "@/views/privacy-transfer/config";

export const SIDEBAR_WIDTH_PX = 220;
export const DOCS_PATH = "/docs";
export const STABLEFLOW_ABOUT_URL = "https://app.stableflow.ai/about";

export type SidebarIcon = ComponentType<IconProps>;

export type SidebarNavItem = {
  label: string;
  to: string;
  icon: SidebarIcon;
  end?: boolean;
};

export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { label: "Overview", to: "/", icon: IconOverview, end: true },
  { label: "Payment Links", to: "/payment-links", icon: IconLink },
  { label: "API Keys", to: "/api-keys", icon: IconKey },
  { label: "Reports", to: "/reports", icon: IconRecords2 },
  { label: "Settings", to: "/settings", icon: IconSetting },
  { label: "Developer Docs", to: "/docs", icon: IconCode },
];

export function pageTitleForPath(pathname: string): string {
  if (pathname === PRIVACY_TRANSFER_PATH || pathname.startsWith(`${PRIVACY_TRANSFER_PATH}/`)) {
    return PRIVACY_TRANSFER_TITLE;
  }
  const item = SIDEBAR_NAV_ITEMS.find((entry) => {
    if (entry.end || entry.to === "/") return pathname === entry.to;
    return pathname === entry.to || pathname.startsWith(`${entry.to}/`);
  });
  return item?.label ?? "Overview";
}
