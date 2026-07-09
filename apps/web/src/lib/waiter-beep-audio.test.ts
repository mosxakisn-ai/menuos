import { describe, expect, it } from "vitest";
import {
  GUEST_BEEP_TONES,
  PASS_BEEP_TONES,
  parseWaiterBeepKind,
  synthesizeWaiterBeepWav,
} from "./waiter-beep-audio";

describe("waiter-beep-audio", () => {
  it("pass has three ascending tones", () => {
    expect(PASS_BEEP_TONES).toHaveLength(3);
    expect(PASS_BEEP_TONES[0]!.freq).toBeLessThan(PASS_BEEP_TONES[1]!.freq);
    expect(PASS_BEEP_TONES[1]!.freq).toBeLessThan(PASS_BEEP_TONES[2]!.freq);
  });

  it("guest has two lower tones", () => {
    expect(GUEST_BEEP_TONES).toHaveLength(2);
    expect(GUEST_BEEP_TONES[0]!.freq).toBeLessThan(PASS_BEEP_TONES[0]!.freq);
  });

  it("synthesizes valid wav headers", () => {
    const wav = synthesizeWaiterBeepWav("pass");
    expect(wav.subarray(0, 4).toString()).toBe("RIFF");
    expect(wav.subarray(8, 12).toString()).toBe("WAVE");
    expect(wav.length).toBeGreaterThan(1000);
  });

  it("parseWaiterBeepKind defaults to pass", () => {
    expect(parseWaiterBeepKind("guest")).toBe("guest");
    expect(parseWaiterBeepKind(null)).toBe("pass");
  });
});
