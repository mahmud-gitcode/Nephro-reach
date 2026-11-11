import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { expect } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

/* findBy* and waitFor give up after 1 s by default. Under parallel load a
   correct render can take longer, so allow 5 s (still well inside the
   suite-wide 15 s test timeout in vitest.config.mts). */
configure({ asyncUtilTimeout: 5_000 });

/* jsdom implements neither of these, and components that use them are not
   broken — they just have nothing to talk to. Stubbing here keeps the
   stubs out of every individual test. */

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

/* `showPicker` is used by the date inputs; jsdom throws without it. */
if (!(HTMLInputElement.prototype as { showPicker?: () => void }).showPicker) {
  (HTMLInputElement.prototype as { showPicker?: () => void }).showPicker =
    () => {};
}

/* axe probes canvas support while checking colour contrast. jsdom has no
   canvas, says so on stderr, and then axe carries on without that one
   check. The noise is not a failure; silence it so a real message stands
   out in the test output. */
HTMLCanvasElement.prototype.getContext = (() =>
  null) as unknown as HTMLCanvasElement["getContext"];
