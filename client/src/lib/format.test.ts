import { describe, expect, it } from "vitest";
import { formatCurrencyRange, formatDate, toIsoOrUndefined } from "./format";

describe("format helpers", () => {
  it("handles missing and valid dates", () => {
    expect(formatDate()).toBe("Not set");
    expect(formatDate("2026-08-16T12:00:00.000Z", "yyyy-MM-dd")).toBe("2026-08-16");
  });

  it("formats salary ranges and datetime input", () => {
    expect(formatCurrencyRange(120000, 160000)).toContain("$120K");
    expect(toIsoOrUndefined("2026-08-16T09:30")).toContain("2026-08-16T");
  });
});
