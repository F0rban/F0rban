import { describe, expect, it } from "vitest";
import {
  formatAxisMoney,
  formatCompact,
  formatCurrency,
  formatDuration,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  pluralize,
} from "./format";

describe("formatCurrency", () => {
  it("shows cents below a thousand and drops them above", () => {
    expect(formatCurrency(12.5)).toBe("$12.50");
    expect(formatCurrency(1250)).toBe("$1,250");
  });

  it("keeps more precision for sub-dollar amounts", () => {
    expect(formatCurrency(0.014)).toBe("$0.014");
  });

  it("renders negatives as credits", () => {
    expect(formatCurrency(-8.4)).toBe("-$8.40");
  });
});

describe("formatAxisMoney", () => {
  it("keeps a half-step visible rather than rounding it away", () => {
    expect(formatAxisMoney(12.5)).toBe("$12.5");
    expect(formatAxisMoney(37.5)).toBe("$37.5");
  });

  it("drops decimals for whole values", () => {
    expect(formatAxisMoney(50)).toBe("$50");
    expect(formatAxisMoney(0)).toBe("0");
  });

  it("abbreviates thousands and millions", () => {
    expect(formatAxisMoney(1500)).toBe("$1.5k");
    expect(formatAxisMoney(24000)).toBe("$24k");
    expect(formatAxisMoney(2_400_000)).toBe("$2.4M");
  });

  it("stays narrow enough for an axis gutter", () => {
    for (const value of [0, 0.5, 7, 12.5, 250, 1500, 24000, 2_400_000]) {
      expect(formatAxisMoney(value).length).toBeLessThanOrEqual(6);
    }
  });
});

describe("formatCompact", () => {
  it("abbreviates context windows the way the specs are quoted", () => {
    expect(formatCompact(200_000)).toBe("200K");
    expect(formatCompact(1_000_000)).toBe("1M");
    expect(formatCompact(164_000)).toBe("164K");
    expect(formatCompact(940)).toBe("940");
  });
});

describe("formatMoneyCompact", () => {
  it("abbreviates only once the figure would crowd a table cell", () => {
    expect(formatMoneyCompact(420)).toBe("$420.00");
    expect(formatMoneyCompact(12_400)).toBe("$12.4k");
    expect(formatMoneyCompact(-12_400)).toBe("-$12.4k");
  });
});

describe("formatDuration", () => {
  it("switches units as the magnitude grows", () => {
    expect(formatDuration(420)).toBe("420ms");
    expect(formatDuration(2_300)).toBe("2.3s");
    expect(formatDuration(58_200)).toBe("58s");
    expect(formatDuration(148_000)).toBe("2m 28s");
    expect(formatDuration(120_000)).toBe("2m");
  });
});

describe("misc formatters", () => {
  it("formats numbers with separators", () => {
    expect(formatNumber(41882)).toBe("41,882");
  });

  it("formats percentages with a sign only when negative", () => {
    expect(formatPercent(12.4, 1)).toBe("12.4%");
    expect(formatPercent(-3)).toBe("-3%");
  });

  it("pluralises", () => {
    expect(pluralize(1, "active tool")).toBe("1 active tool");
    expect(pluralize(3, "active tool")).toBe("3 active tools");
  });
});
