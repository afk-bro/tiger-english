import { describe, it, expect } from "vitest";
import { getLearnerLanguage, SUPPORTED_LEARNER_LANGUAGES } from "../learnerLanguage";

describe("getLearnerLanguage", () => {
  it("maps 'th' to 'th'", () => {
    expect(getLearnerLanguage("th")).toBe("th");
  });

  it("maps 'vi' to 'vi'", () => {
    expect(getLearnerLanguage("vi")).toBe("vi");
  });

  it("maps 'zh-CN' to 'zh-CN'", () => {
    expect(getLearnerLanguage("zh-CN")).toBe("zh-CN");
  });

  it("maps 'zh' to 'zh-CN'", () => {
    expect(getLearnerLanguage("zh")).toBe("zh-CN");
  });

  it("returns null for 'en'", () => {
    expect(getLearnerLanguage("en")).toBeNull();
  });

  it("returns null for unsupported languages", () => {
    expect(getLearnerLanguage("fr")).toBeNull();
    expect(getLearnerLanguage("ja")).toBeNull();
    expect(getLearnerLanguage("")).toBeNull();
  });
});

describe("SUPPORTED_LEARNER_LANGUAGES", () => {
  it("contains exactly th, vi, zh-CN", () => {
    expect(SUPPORTED_LEARNER_LANGUAGES).toEqual(["th", "vi", "zh-CN"]);
  });
});
