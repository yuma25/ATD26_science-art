import { describe, it, expect } from "vitest";
import { calculateProgress } from "@backend/lib/logic";

describe("calculateProgress", () => {
  it("6個中3個獲得していたら、50%と表示されること", () => {
    expect(calculateProgress(6, 3)).toBe(50);
  });

  it("全6個獲得していたら、100%になること", () => {
    expect(calculateProgress(6, 6)).toBe(100);
  });

  it("1つも獲得していない場合は、0%になること", () => {
    expect(calculateProgress(6, 0)).toBe(0);
  });

  it("合計が0の場合でも、エラーにならずに0を返すこと", () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it("獲得数が合計を超えても、100%に丸められること", () => {
    expect(calculateProgress(5, 10)).toBe(100);
  });

  it("負の数が渡された場合でも、0%に丸められること", () => {
    expect(calculateProgress(5, -1)).toBe(0);
  });
});
