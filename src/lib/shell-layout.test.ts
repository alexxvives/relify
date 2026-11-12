import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("signed-in shell layout CSS", () => {
  it("keeps the slide transform off the base sidebar so desktop is not translated away", () => {
    const base = css.slice(css.indexOf(".shell-sidebar {"), css.indexOf(".shell-sidebar[data-open=\"true\"]"));
    expect(base).not.toMatch(/transform:\s*translateX\(-100%\)/);
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*?transform:\s*translateX\(-100%\)/);
    expect(css).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*?\.shell-sidebar\[data-open="false"\][\s\S]*?transform:\s*none/,
    );
  });

  it("pads shell content for the mobile tab bar in CSS, not a competing utility", () => {
    expect(css).toMatch(/--shell-tabbar:\s*0px/);
    expect(css).toMatch(/padding-bottom:\s*calc\(var\(--layout-pad\) \+ var\(--shell-tabbar\)\)/);
    expect(css).toMatch(/--shell-tabbar:\s*calc\(3\.5rem \+ 0\.75rem \+ env\(safe-area-inset-bottom/);
    expect(css).toMatch(/scroll-padding-bottom:\s*var\(--shell-tabbar\)/);
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*?scroll-padding-top:\s*calc\(3\.5rem/);
    expect(css).toMatch(/@media \(min-width: 640px\) and \(max-width: 1023px\)[\s\S]*?--shell-tabbar:\s*calc\(4rem/);
    expect(css).toMatch(/\.shell\[data-keyboard="true"\] \.shell-tabbar/);
    expect(css).toMatch(/\.shell-main \{[\s\S]*?min-height:\s*100svh/);
  });
});
