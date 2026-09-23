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
