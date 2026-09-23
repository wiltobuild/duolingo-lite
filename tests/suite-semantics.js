/**
 * Accessibility-semantics tests for the question screen: what assistive
 * technology and color-blind users get, beyond what the layout shows.
 */

import { test, assert, eq, freshQuestionScreen, noHandlers, stateFor, mount } from "./harness.js";

test("[a11y, WCAG 3.1.2] the Spanish word is marked lang=es so screen readers pronounce it in Spanish", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);
  eq(c.querySelector(".question-word").getAttribute("lang"), "es");
});

test("[a11y] the answer choices form a group named by the question", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);
  const group = c.querySelector("[role='group']");
  assert(group, "a role=group element wraps the choices");
  assert(group.querySelectorAll(".choice").length === 4, "it contains all four choices");
  const ids = group.getAttribute("aria-labelledby").split(" ");
  const name = ids.map((id) => document.getElementById(id)?.textContent.trim()).join(" ");
  assert(name.includes("Which word means") && name.includes("hola"), `its name is "${name}"`);
});

// Color alone must not carry meaning (WCAG 1.4.1): green and red are hard to
// tell apart for many color-blind learners, so each state also has a symbol.

/** What a screen reader announces for a button: its text minus aria-hidden parts. */
function spokenName(button) {
  const copy = button.cloneNode(true);
  copy.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove());
  return copy.textContent.replace(/\s+/g, " ").trim();
}

const markOf = (button) => button.querySelector(".choice__mark");

test("[a11y, WCAG 1.4.1] selected, correct and wrong choices each carry a different symbol, not only a color", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();

  renderQuestionScreen(stateFor({ selectedChoice: 2 }), c, noHandlers);
  const buttons = [...c.querySelectorAll(".choice")];
  eq(markOf(buttons[2]).textContent, "●", "selected");
  eq(markOf(buttons[2]).getAttribute("aria-hidden"), "true", "the symbol is decoration for screen readers");
  eq(markOf(buttons[0]).textContent, "", "an unselected choice has no symbol");

  renderQuestionScreen(stateFor({ selectedChoice: 3, checked: true, lastAnswerCorrect: false }), c, noHandlers);
  const checked = [...c.querySelectorAll(".choice")];
  eq(markOf(checked[0]).textContent, "✓", "correct answer");
  eq(markOf(checked[3]).textContent, "✕", "wrong pick");
  eq(markOf(checked[1]).textContent, "", "other choices stay unmarked");
});

test("[a11y] screen readers hear which choice is correct and which was the learner's wrong pick", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor({ selectedChoice: 3, checked: true, lastAnswerCorrect: false }), c, noHandlers);
  const buttons = [...c.querySelectorAll(".choice")];
  eq(spokenName(buttons[0]), "hello (correct answer)");
  eq(spokenName(buttons[3]), "sorry (your answer, incorrect)");
  eq(spokenName(buttons[1]), "goodbye", "unmarked choices are read as plain text");
});

test("adding a symbol does not shift the choice text sideways", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);
  const before = c.querySelector(".choice span:not(.choice__mark)").getBoundingClientRect().left;
  renderQuestionScreen(stateFor({ selectedChoice: 0 }), c, noHandlers);
  const after = c.querySelector(".choice span:not(.choice__mark)").getBoundingClientRect().left;
  eq(Math.round(after), Math.round(before));
});
