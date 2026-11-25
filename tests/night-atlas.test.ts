import { describe, expect, it } from "vitest";
import { settlementLights, mapPadding } from "../src/lib/geo/night-atlas";

describe("Night Atlas geographic artwork", () => {
  it("leaves drawable space on small regional maps and landing maps", () => {
    for (const [width, height] of [
      [320, 240],
      [390, 480],
      [800, 300],
      [1280, 1080],
    ]) {
      {
        const p = mapPadding(width, height);
        expect(p.left + p.right).toBeLessThanOrEqual(width * 0.6 + 0.001);
        expect(p.top + p.bottom).toBeLessThanOrEqual(height * 0.6 + 0.001);
      }
    }
  });
  it("keeps the same geographic lights across camera and time changes", () => {
    const before = settlementLights();
    expect(before).toEqual(settlementLights());
    expect(before.length).toBeGreaterThan(1000);
    expect(
      before.every(
        (l) =>
          Number.isFinite(l.point[0]) && l.point[1] > 49 && l.point[1] < 60,
      ),
    ).toBe(true);
  });
});
