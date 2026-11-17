import { DEFAULT_LOOK, toAccessory, toTrail } from "@/engine/look";
import type { RobotLook } from "@/engine/look";
import type { ProgressData } from "./progressLogic";

export type CosmeticSlot = "skin" | "accessory" | "trail";

export type Unlock =
  | { kind: "free" }
  | { kind: "coins"; cost: number }
  | { kind: "achievement"; id: string };

export interface CosmeticItem {
  id: string;
  slot: CosmeticSlot;
  name: string;
  /** skin: warna hex. accessory dan trail: id efek. */
  value: string;
  unlock: Unlock;
}

export const COSMETICS: readonly CosmeticItem[] = [
  { id: "skin:classic", slot: "skin", name: "Classic", value: "#2f6bdb", unlock: { kind: "free" } },
  { id: "skin:sunny", slot: "skin", name: "Sunny", value: "#ffc21a", unlock: { kind: "free" } },
  { id: "skin:mint", slot: "skin", name: "Mint", value: "#3fb950", unlock: { kind: "free" } },
  { id: "skin:plum", slot: "skin", name: "Plum", value: "#7a5af8", unlock: { kind: "coins", cost: 150 } },
  { id: "skin:ember", slot: "skin", name: "Ember", value: "#f5882a", unlock: { kind: "coins", cost: 250 } },
  { id: "skin:rose", slot: "skin", name: "Rose", value: "#e8527a", unlock: { kind: "coins", cost: 400 } },

  { id: "acc:none", slot: "accessory", name: "None", value: "none", unlock: { kind: "free" } },
  { id: "acc:cap", slot: "accessory", name: "Cap", value: "cap", unlock: { kind: "coins", cost: 120 } },
  { id: "acc:glasses", slot: "accessory", name: "Glasses", value: "glasses", unlock: { kind: "coins", cost: 160 } },
  { id: "acc:bow", slot: "accessory", name: "Bow", value: "bow", unlock: { kind: "coins", cost: 120 } },
  { id: "acc:crown", slot: "accessory", name: "Crown", value: "crown", unlock: { kind: "achievement", id: "stars-75" } },

  { id: "trail:none", slot: "trail", name: "None", value: "none", unlock: { kind: "free" } },
  { id: "trail:dots", slot: "trail", name: "Dots", value: "dots", unlock: { kind: "coins", cost: 80 } },
  { id: "trail:stars", slot: "trail", name: "Stars", value: "stars", unlock: { kind: "coins", cost: 200 } },
  { id: "trail:sparks", slot: "trail", name: "Sparks", value: "sparks", unlock: { kind: "achievement", id: "perfect" } },
];

export function itemById(id: string): CosmeticItem | undefined {
  return COSMETICS.find((item) => item.id === id);
}

export function isOwned(data: ProgressData, item: CosmeticItem): boolean {
  switch (item.unlock.kind) {
    case "free":
      return true;
    case "coins":
      return data.owned.includes(item.id);
    case "achievement":
      return data.achievements[item.unlock.id] !== undefined;
  }
}

export function buyItem(
  data: ProgressData,
  id: string,
): { next: ProgressData; ok: boolean; reason?: string } {
  const item = itemById(id);
  if (!item || item.unlock.kind !== "coins") {
    return { next: data, ok: false, reason: "not-for-sale" };
  }
  if (isOwned(data, item)) return { next: data, ok: false, reason: "owned" };
  if (data.coins < item.unlock.cost) {
    return { next: data, ok: false, reason: "not-enough-coins" };
  }
  return {
    next: {
      ...data,
      coins: data.coins - item.unlock.cost,
      owned: [...data.owned, item.id],
    },
    ok: true,
  };
}

/** Memakai item yang sudah dimiliki. Mengembalikan null jika tidak boleh. */
export function equipItem(data: ProgressData, id: string): ProgressData | null {
  const item = itemById(id);
  if (!item || !isOwned(data, item)) return null;
  return { ...data, equipped: { ...data.equipped, [item.slot]: item.id } };
}

/** Tampilan robot dari kosmetik yang sedang dipakai. Item yang tidak lagi dimiliki diabaikan. */
export function lookOf(data: ProgressData): RobotLook {
  const usable = (id: string): CosmeticItem | undefined => {
    const item = itemById(id);
    return item && isOwned(data, item) ? item : undefined;
  };
  return {
    accent: usable(data.equipped.skin)?.value ?? DEFAULT_LOOK.accent,
    accessory: toAccessory(usable(data.equipped.accessory)?.value),
    trail: toTrail(usable(data.equipped.trail)?.value),
  };
}