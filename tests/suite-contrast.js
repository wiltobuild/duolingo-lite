/**
 * Color-contrast tests (WCAG 2.x) in the light and the dark theme, read
 * from the computed styles the browser actually applies.
 *
 *   text: 4.5:1 for normal text, 3:1 for large text (24px, or 18.66px bold)
 *   non-text (progress bar, focus ring, control borders): 3:1
 */

import { test, assert, freshQuestionScreen, noHandlers, stateFor, mount } from "./harness.js";
import { renderFeedback } from "../js/ui/feedback.js";

// --- color math ----------------------------------------------------------------

const channels = (css) => css.match(/[\d.]+/g).slice(0, 3).map(Number);

function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The first opaque background at or above an element. */
function backgroundOf(el) {
  for (let node = el; node; node = node.parentElement) {
    const css = getComputedStyle(node).backgroundColor;
    const m = css.match(/[\d.]+/g);
    if (m && (m.length < 4 || Number(m[3]) > 0)) return channels(css);
  }
  return [255, 255, 255];
}

const textRatio = (el) => ratio(channels(getComputedStyle(el).color), backgroundOf(el));

async function withThemes(fn) {
  const root = document.documentElement;
  const original = root.dataset.theme;
  try {
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await fn(theme);
    }
  } finally {
    if (original === undefined) delete root.dataset.theme;
    else root.dataset.theme = original;
  }
}

function check(theme, label, value, minimum, failures) {
  if (value < minimum) failures.push(`${theme}: ${label} is ${value.toFixed(2)}:1, needs ${minimum}:1`);
}

// --- tests -------------------------------------------------------------------------

test("[contrast] every text style on the question screen meets WCAG AA in both themes", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const failures = [];

  await withThemes(async (theme) => {
    const c = mount();

    renderQuestionScreen(stateFor({ selectedChoice: 3 }), c, noHandlers);
    check(theme, "prompt (13px)", textRatio(c.querySelector(".question-prompt")), 4.5, failures);
    check(theme, "progress count (12px)", textRatio(c.querySelector(".progress-count")), 4.5, failures);
    check(theme, "Spanish word (32px, large)", textRatio(c.querySelector(".question-word")), 3, failures);
    check(theme, "unselected choice", textRatio(c.querySelector(".choice:not(.choice--selected)")), 4.5, failures);
    check(theme, "selected choice", textRatio(c.querySelector(".choice--selected")), 4.5, failures);
    check(theme, "Check button", textRatio(c.querySelector("[data-role='check-btn']")), 4.5, failures);

    renderQuestionScreen(stateFor({ selectedChoice: 3, checked: true, lastAnswerCorrect: false }), c, noHandlers);
    check(theme, "correct choice", textRatio(c.querySelector(".choice--correct")), 4.5, failures);
    check(theme, "wrong choice", textRatio(c.querySelector(".choice--wrong")), 4.5, failures);
    check(theme, "Continue button", textRatio(c.querySelector("[data-role='check-btn']")), 4.5, failures);

    for (const [label, state] of [
      ["correct banner", stateFor({ selectedChoice: 0, checked: true, lastAnswerCorrect: true })],
      ["incorrect banner", stateFor({ selectedChoice: 3, checked: true, lastAnswerCorrect: false })],
    ]) {
      c.insertAdjacentHTML("beforeend", renderFeedback(state));
      const banner = c.querySelector(".feedback-banner:last-of-type");
      check(theme, label, textRatio(banner), 4.5, failures);
      check(theme, `${label} detail line`, textRatio(banner.querySelector("small") ?? banner), 4.5, failures);
    }
  });

  assert(failures.length === 0, "\n        " + failures.join("\n        "));
});

test("[contrast, WCAG 1.4.11] the progress fill and the focus ring stand out at 3:1 in both themes", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const failures = [];

  await withThemes(async (theme) => {
    const c = mount();
    renderQuestionScreen(stateFor({ index: 2 }), c, noHandlers);
    const fill = channels(getComputedStyle(c.querySelector(".progress-fill")).backgroundColor);
    const track = channels(getComputedStyle(c.querySelector(".progress-track")).backgroundColor);
    check(theme, "progress fill against its track", ratio(fill, track), 3, failures);

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const ring = [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16));
    check(theme, "focus ring against the card", ratio(ring, backgroundOf(c)), 3, failures);
  });

  assert(failures.length === 0, "\n        " + failures.join("\n        "));
});

test("[contrast, WCAG 1.4.11] the resting border of an answer choice reaches 3:1 against the card in both themes", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const failures = [];

  await withThemes(async (theme) => {
    const c = mount();
    renderQuestionScreen(stateFor(), c, noHandlers);
    const border = channels(getComputedStyle(c.querySelector(".choice")).borderTopColor);
    check(theme, "choice border against the card", ratio(border, backgroundOf(c)), 3, failures);
  });

  assert(failures.length === 0, "\n        " + failures.join("\n        "));
});
