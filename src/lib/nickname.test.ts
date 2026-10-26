import { describe, expect, it } from "vitest";
import { isCuratedNickname, nicknameWords, shortNickname } from "./nickname";

describe("nickname", () => {
  it("accepts curated names, numbered or not", () => {
    expect(isCuratedNickname("Proyecto Olivo")).toBe(true);
    expect(isCuratedNickname("Proyecto Olivo 3")).toBe(true);
    expect(isCuratedNickname("Proyecto Acme Industrial")).toBe(false);
    expect(isCuratedNickname("Olivo")).toBe(false);
  });
  it("has no duplicate words", () => {
    expect(new Set(nicknameWords).size).toBe(nicknameWords.length);
  });
  it("strips the prefix for cards", () => {
    expect(shortNickname("Proyecto Cala")).toBe("Cala");
  });
});
