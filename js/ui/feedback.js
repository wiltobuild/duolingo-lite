/**
 * Answer feedback banner.
 * Owner: Priscilla — feedback and completion screens, accessibility
 * review, demo test checklist.
 *
 * Called by app.js right after `state.checked` becomes true. Return an
 * HTML string (or `null` to render nothing) — app.js inserts it after
 * the choice list.
 *
 * TODO(Priscilla):
 *   [P0] Show immediate correct/incorrect feedback after checking
 *        (state.lastAnswerCorrect).
 *   [P0] On an incorrect selection, show the correct answer — it's
 *        `state.questions[state.index].correct`.
 *   [P1] Make sure this is announced to screen readers (e.g. an
 *        aria-live region) — see the accessibility review requirement
 *        in the PRD's acceptance criteria.
 *
 * Reach for the .feedback-banner / .feedback-banner--correct /
 * .feedback-banner--incorrect classes in css/components.css — don't
 * introduce new one-off colors, they're already tokenized there.
 */

export function renderFeedback(state) {
  if (!state.checked) return null;

  // TODO(Priscilla): replace this placeholder with the real banner
  // markup (correct/incorrect state, correct-answer callout).
  return null;
}
