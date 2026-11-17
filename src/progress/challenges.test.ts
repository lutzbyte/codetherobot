import { describe, expect, test } from "bun:test";
import {
  WEEKLY_TARGET,
  applyDaily,
  applyEndlessRound,
  applyMinimumWin,
  applyTimeWin,
  claimWeekly,
  dailyStreak,
  longestStreak,
  weekKeyOf,
} from "./challenges";
import { createProgress } from "./progressLogic";

describe("dates", () => {
  test("a week runs Monday to Sunday", () => {
    expect(weekKeyOf("2026-11-09")).toBe(weekKeyOf("2026-11-15"));
    expect(weekKeyOf("2026-11-16")).not.toBe(weekKeyOf("2026-11-15"));
  });

  test("the ISO week handles the new year", () => {
    expect(weekKeyOf("2025-12-29")).toBe(weekKeyOf("2026-01-01"));
  });

  test("streak counts consecutive days ending today or yesterday", () => {
    const dates = ["2026-11-12", "2026-11-13", "2026-11-14"];
    expect(dailyStreak(dates, "2026-11-14")).toBe(3);
    expect(dailyStreak(dates, "2026-11-15")).toBe(3);
    expect(dailyStreak(dates, "2026-11-16")).toBe(0);
    expect(dailyStreak(["2026-11-10", "2026-11-14"], "2026-11-14")).toBe(1);
  });

  test("longest streak ignores gaps and duplicates", () => {
    expect(
      longestStreak(["2026-11-01", "2026-11-02", "2026-11-02", "2026-11-03", "2026-11-10"]),
    ).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});

describe("daily and weekly rewards", () => {
  test("the daily reward is paid once per day", () => {
    const first = applyDaily(createProgress(), "2026-11-14", 2);
    expect(first.first).toBe(true);
    expect(first.coins).toBe(60);
    expect(first.xp).toBe(40);

    const again = applyDaily(first.next, "2026-11-14", 3);
    expect(again.first).toBe(false);
    expect(again.coins).toBe(0);
    expect(again.next.dailyDone["2026-11-14"]).toBe(3);
  });

  test("the weekly reward needs enough days and can be claimed once", () => {
    let data = createProgress();
    const week = weekKeyOf("2026-11-09");
    const days = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"];

    for (const day of days.slice(0, WEEKLY_TARGET - 1)) {
      data = applyDaily(data, day, 1).next;
    }
    expect(claimWeekly(data, week).claimed).toBe(false);

    data = applyDaily(data, days[WEEKLY_TARGET - 1] ?? "2026-11-13", 1).next;
    const claimed = claimWeekly(data, week);
    expect(claimed.claimed).toBe(true);
    expect(claimWeekly(claimed.next, week).claimed).toBe(false);
  });
});

describe("challenge modes", () => {
  test("records keep the best result", () => {
    let data = createProgress();
    data = applyEndlessRound(data, 4).next;
    data = applyEndlessRound(data, 2).next;
    expect(data.modes.endlessBest).toBe(4);

    data = applyTimeWin(data, 90).next;
    data = applyTimeWin(data, 120).next;
    expect(data.modes.timeBest).toBe(90);
    expect(data.modes.timeWins).toBe(2);

    data = applyMinimumWin(data).next;
    expect(data.modes.minimumSolved).toBe(1);
  });
});