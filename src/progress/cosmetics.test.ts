import { describe, expect, test } from "bun:test";
import { ACHIEVEMENT_DEFS } from "./achievements";
import { COSMETICS, buyItem, equipItem, isOwned, itemById, lookOf } from "./cosmetics";
import { createProgress } from "./progressLogic";

const rich = { ...createProgress(), coins: 500 };

describe("cosmetics", () => {
  test("free items are always owned and paid items are not", () => {
    const data = createProgress();
    expect(isOwned(data, itemById("skin:classic")!)).toBe(true);
    expect(isOwned(data, itemById("acc:cap")!)).toBe(false);
  });

  test("buying deducts coins and cannot be repeated", () => {
    const bought = buyItem(rich, "acc:cap");
    expect(bought.ok).toBe(true);
    expect(bought.next.coins).toBe(380);
    expect(bought.next.owned).toContain("acc:cap");

    const again = buyItem(bought.next, "acc:cap");
    expect(again.ok).toBe(false);
    expect(again.next.coins).toBe(380);
  });

  test("buying needs enough coins and a purchasable item", () => {
    expect(buyItem(createProgress(), "acc:cap").reason).toBe("not-enough-coins");
    expect(buyItem(rich, "acc:crown").reason).toBe("not-for-sale");
    expect(buyItem(rich, "nope").ok).toBe(false);
  });

  test("only owned items can be equipped, and they change the robot look", () => {
    expect(equipItem(createProgress(), "acc:cap")).toBeNull();

    const bought = buyItem(rich, "skin:plum").next;
    const equipped = equipItem(bought, "skin:plum");
    expect(equipped?.equipped.skin).toBe("skin:plum");
    expect(equipped ? lookOf(equipped).accent : "").toBe("#7a5af8");
    expect(lookOf(createProgress()).accessory).toBe("none");
  });

  test("achievement items unlock with their achievement and reference real ones", () => {
    for (const item of COSMETICS) {
      if (item.unlock.kind !== "achievement") continue;
      const id = item.unlock.id;
      expect(ACHIEVEMENT_DEFS.some((d) => d.id === id)).toBe(true);
    }
    const crown = itemById("acc:crown")!;
    expect(isOwned(createProgress(), crown)).toBe(false);
    expect(isOwned({ ...createProgress(), achievements: { "stars-75": 1 } }, crown)).toBe(true);
  });
});