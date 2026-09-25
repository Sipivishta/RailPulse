import { describe, expect, test } from "vitest";
import { calculateTrainPosition } from "./position";

describe("calculateTrainPosition", () => {
  test("calculates a position along a straight railway segment", () => {
    const line: [number, number][] = [
      [75.0, 22.0],
      [75.01, 22.0],
      [75.02, 22.0],
    ];

    const start: [number, number] = [75.0, 22.0];
    const end: [number, number] = [75.02, 22.0];

    const position = calculateTrainPosition(
      line,
      start,
      end,
      0.75
    );

    expect(position).not.toBeNull();

    if (!position) {
      throw new Error("Position should not be null");
    }

    expect(position[0]).toBeCloseTo(75.015, 3);
    expect(position[1]).toBeCloseTo(22.0, 3);
  });

  test("returns the start position at 0% progress", () => {
    const line: [number, number][] = [
      [75.0, 22.0],
      [75.01, 22.0],
      [75.02, 22.0],
    ];

    const position = calculateTrainPosition(
      line,
      [75.0, 22.0],
      [75.02, 22.0],
      0
    );

    expect(position).not.toBeNull();

    if (!position) {
      throw new Error("Position should not be null");
    }

    expect(position[0]).toBeCloseTo(75.0, 3);
    expect(position[1]).toBeCloseTo(22.0, 3);
  });

  test("returns the end position at 100% progress", () => {
    const line: [number, number][] = [
      [75.0, 22.0],
      [75.01, 22.0],
      [75.02, 22.0],
    ];

    const position = calculateTrainPosition(
      line,
      [75.0, 22.0],
      [75.02, 22.0],
      1
    );

    expect(position).not.toBeNull();

    if (!position) {
      throw new Error("Position should not be null");
    }

    expect(position[0]).toBeCloseTo(75.02, 3);
    expect(position[1]).toBeCloseTo(22.0, 3);
  });

  test("returns null for invalid progress", () => {
    const line: [number, number][] = [
      [75.0, 22.0],
      [75.01, 22.0],
      [75.02, 22.0],
    ];

    const position = calculateTrainPosition(
      line,
      [75.0, 22.0],
      [75.02, 22.0],
      1.5
    );

    expect(position).toBeNull();
  });
});