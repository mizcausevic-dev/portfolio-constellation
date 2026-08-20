import { describe, expect, it } from "vitest";
import {
  CX,
  CY,
  fanAngles,
  hubRadius,
  polar,
  splitLeaves,
  textAnchor,
  truncate,
} from "../constellationLayout";

describe("polar", () => {
  it("places 0deg straight up from center", () => {
    const p = polar(CX, CY, 100, 0);
    expect(p.x).toBeCloseTo(CX);
    expect(p.y).toBeCloseTo(CY - 100);
  });

  it("places 90deg directly right of center", () => {
    const p = polar(CX, CY, 100, 90);
    expect(p.x).toBeCloseTo(CX + 100);
    expect(p.y).toBeCloseTo(CY);
  });
});

describe("textAnchor", () => {
  it("anchors start when the point is right of center", () => {
    expect(textAnchor(CX + 50)).toBe("start");
  });
  it("anchors end when the point is left of center", () => {
    expect(textAnchor(CX - 50)).toBe("end");
  });
  it("anchors middle within the dead zone", () => {
    expect(textAnchor(CX + 2)).toBe("middle");
  });
});

describe("hubRadius", () => {
  it("grows with a real count but stays clamped", () => {
    expect(hubRadius(0)).toBe(13);
    expect(hubRadius(2)).toBeCloseTo(16.6);
    expect(hubRadius(1000)).toBe(13 + 13); // clamped at cap
  });
});

describe("fanAngles", () => {
  it("returns nothing for zero items", () => {
    expect(fanAngles(0, 0, 60)).toEqual([]);
  });
  it("points a single leaf straight at the hub angle", () => {
    expect(fanAngles(45, 1, 60)).toEqual([45]);
  });
  it("spreads multiple leaves symmetrically around the hub angle", () => {
    const angles = fanAngles(0, 3, 60);
    expect(angles.length).toBe(3);
    expect(angles[1]).toBeCloseTo(0);
    expect(angles[0]).toBeLessThan(angles[1]);
    expect(angles[2]).toBeGreaterThan(angles[1]);
  });
});

describe("truncate", () => {
  it("leaves short strings alone", () => {
    expect(truncate("abc", 10)).toBe("abc");
  });
  it("truncates with an ellipsis at the limit", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcd…");
  });
});

describe("splitLeaves", () => {
  it("shows everything when under the cap", () => {
    expect(splitLeaves([1, 2, 3], 5)).toEqual({ shown: [1, 2, 3], more: 0 });
  });
  it("caps and reports a real remainder count", () => {
    expect(splitLeaves([1, 2, 3, 4, 5], 3)).toEqual({ shown: [1, 2, 3], more: 2 });
  });
});
