import type { IconName } from "@/components/ui/Icon";
import type { TextKey } from "@/i18n";

export interface NavItem {
  to: string;
  labelKey: TextKey;
  icon: IconName;
}

export const desktopNavItems: NavItem[] = [
  { to: "/", labelKey: "nav.play", icon: "star" },
  { to: "/worlds", labelKey: "nav.worlds", icon: "worlds" },
  { to: "/achievements", labelKey: "nav.achievements", icon: "star" },
  { to: "/settings", labelKey: "nav.settings", icon: "settings" },
];

export const mobileNavItems: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: "home" },
  { to: "/worlds", labelKey: "nav.worlds", icon: "worlds" },
  { to: "/achievements", labelKey: "nav.achievements", icon: "star" },
  { to: "/settings", labelKey: "nav.settings", icon: "settings" },
];