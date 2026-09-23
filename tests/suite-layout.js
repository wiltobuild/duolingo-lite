/**
 * Responsive layout tests (PRD [P1]: works on a phone-sized or desktop
 * screen). Each iframe's width is its viewport width, so these run the
 * app at real phone widths.
 */

import { test, assert, eq, QUESTIONS, loadApp, answerCurrent, indexes } from "./harness.js";

const WIDTHS = [320, 360, 414, 768, 1280];
const MIN_TARGET = 44; // px; the common touch-target guideline (WCAG's own minimum is 24)

function measure(app, label) {
  const { doc, win } = app;
  const problems = [];
  const root = doc.documentElement;
  if (root.scrollWidth > root.clientWidth) problems.push(`${label}: page scrolls sideways`);

  const card = app.q(".card").getBoundingClientRect();
  if (win.innerWidth <= 480) {
    const left = card.left;
    const right = win.innerWidth - card.right;
    if (left < 8 || right < 8) problems.push(`${label}: card is ${Math.round(left)}px / ${Math.round(right)}px from the screen edges`);
  }

  for (const el of app.qa(".choice")) {
    const box = el.getBoundingClientRect();
    if (box.height < MIN_TARGET) problems.push(`${label}: choice is ${Math.round(box.height)}px tall`);
    if (el.scrollWidth > el.clientWidth) problems.push(`${label}: choice text is clipped`);
  }
  for (const el of app.qa(".btn-primary")) {
    const box = el.getBoundingClientRect();
    if (box.height < MIN_TARGET || box.width < MIN_TARGET) problems.push(`${label}: button is ${Math.round(box.width)}x${Math.round(box.height)}px`);
  }
  return problems;
}

for (const width of WIDTHS) {
  test(`[layout ${width}px] question, feedback and completion screens fit and are easy to tap`, async () => {
    const app = await loadApp(width, 700);
    try {
      const problems = [];
      problems.push(...measure(app, "question"));

      const { wrong } = indexes(QUESTIONS[0]);
      app.qa(".choice")[wrong].click();
      app.q("[data-role='check-btn']").click();
      problems.push(...measure(app, "after a wrong answer"));

      app.q("[data-role='check-btn']").click(); // Continue
      for (let i = 1; i < 5; i++) answerCurrent(app, true);
      assert(app.q(".completion"), "reached the completion screen");
      problems.push(...measure(app, "completion"));

      eq(problems.join("; "), "");
    } finally {
      app.close();
    }
  });
}

test("[layout 360x640] the Continue button is visible without scrolling after a wrong answer", async () => {
  const app = await loadApp(360, 640);
  try {
    const { wrong } = indexes(QUESTIONS[2]); // a question with a longer feedback line is not needed; any wrong answer adds the banner
    app.qa(".choice")[wrong].click();
    app.q("[data-role='check-btn']").click();
    const bottom = app.q("[data-role='check-btn']").getBoundingClientRect().bottom;
    assert(bottom <= 640, `the button ends at ${Math.round(bottom)}px in a 640px-tall screen`);
  } finally {
    app.close();
  }
});

test("[layout, WCAG 1.4.4] text grows with the browser's default font size, and the screen still fits at 320px", async () => {
  const app = await loadApp(320, 700);
  try {
    const sizeOf = (selector) => parseFloat(app.win.getComputedStyle(app.q(selector)).fontSize);
    const selectors = [".question-prompt", ".choice", ".progress-count"];
    const before = selectors.map(sizeOf);
    app.doc.documentElement.style.fontSize = "200%";
    const after = selectors.map(sizeOf);
    selectors.forEach((selector, i) => assert(after[i] > before[i], `${selector} stays ${after[i]}px; a size in px ignores the setting`));

    const problems = measure(app, "question at 200% text");
    const { wrong } = indexes(QUESTIONS[0]);
    app.qa(".choice")[wrong].click();
    app.q("[data-role='check-btn']").click();
    problems.push(...measure(app, "feedback at 200% text"));
    eq(problems.join("; "), "");
  } finally {
    app.close();
  }
});
