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
