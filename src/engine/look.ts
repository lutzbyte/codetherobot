export const ACCESSORY_IDS = ["none", "cap", "glasses", "bow", "crown"] as const;
export type AccessoryId = (typeof ACCESSORY_IDS)[number];

export const TRAIL_IDS = ["none", "dots", "stars", "sparks"] as const;
export type TrailId = (typeof TRAIL_IDS)[number];

/** Tampilan robot: warna aksen, aksesori, dan jejak. */
export interface RobotLook {
  accent: string;
  accessory: AccessoryId;
  trail: TrailId;
}

export const DEFAULT_LOOK: RobotLook = {
  accent: "#2f6bdb",
  accessory: "none",
  trail: "none",
};

export function toAccessory(value: string | undefined): AccessoryId {
  return ACCESSORY_IDS.find((id) => id === value) ?? "none";
}

export function toTrail(value: string | undefined): TrailId {
  return TRAIL_IDS.find((id) => id === value) ?? "none";
}