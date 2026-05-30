import { describe, expect, it } from "vitest";
import {
  isEditableTarget,
  isExemptFromCopyBlock,
  isLocalDevHost,
  shouldApplyHardening,
  shouldBlockKeyDown,
} from "./productionHardening";

describe("isLocalDevHost", () => {
  it("recognizes local hosts", () => {
    expect(isLocalDevHost("localhost")).toBe(true);
    expect(isLocalDevHost("127.0.0.1")).toBe(true);
    expect(isLocalDevHost("[::1]")).toBe(true);
  });

  it("rejects public hosts", () => {
    expect(isLocalDevHost("dns.kaustuvbasak.com")).toBe(false);
    expect(isLocalDevHost("dns-simulator.onrender.com")).toBe(false);
  });
});

describe("shouldApplyHardening", () => {
  it("applies on prod public host", () => {
    expect(shouldApplyHardening(true, "dns.kaustuvbasak.com")).toBe(true);
  });

  it("skips dev and local prod preview", () => {
    expect(shouldApplyHardening(false, "dns.kaustuvbasak.com")).toBe(false);
    expect(shouldApplyHardening(true, "localhost")).toBe(false);
  });
});

describe("isEditableTarget", () => {
  it("allows form controls", () => {
    const input = document.createElement("input");
    expect(isEditableTarget(input)).toBe(true);
  });

  it("blocks plain divs", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
  });
});

describe("isExemptFromCopyBlock", () => {
  it("allows .allow-select regions", () => {
    const wrap = document.createElement("div");
    wrap.className = "allow-select";
    const child = document.createElement("span");
    wrap.appendChild(child);
    document.body.appendChild(wrap);
    expect(isExemptFromCopyBlock(child)).toBe(true);
    wrap.remove();
  });
});

describe("shouldBlockKeyDown", () => {
  const mod = { ctrl: true, meta: false, shift: false, alt: false };

  it("blocks view-source and copy when not editable", () => {
    expect(shouldBlockKeyDown("u", mod, false)).toBe(true);
    expect(shouldBlockKeyDown("c", mod, false)).toBe(true);
    expect(shouldBlockKeyDown("F12", { ...mod, ctrl: false }, false)).toBe(true);
  });

  it("allows typing in inputs", () => {
    expect(shouldBlockKeyDown("c", mod, true)).toBe(false);
    expect(shouldBlockKeyDown("a", mod, true)).toBe(false);
  });

  it("blocks macOS Option+Cmd inspect shortcuts", () => {
    expect(
      shouldBlockKeyDown("i", { ctrl: false, meta: true, shift: false, alt: true }, false),
    ).toBe(true);
  });

  it("blocks devtools shift combos", () => {
    expect(
      shouldBlockKeyDown("i", { ctrl: true, meta: false, shift: true, alt: false }, false),
    ).toBe(true);
  });
});
