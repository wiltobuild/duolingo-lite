/**
 * Answer feedback banner.
 * Owner: Priscilla — feedback and completion screens, accessibility
 * review, demo test checklist.
 *
 * Called by app.js right after `state.checked` becomes true. Return an
 * HTML string (or `null` to render nothing) — app.js inserts it after
 * the choice list.
 *
 * Reach for the .feedback-banner / .feedback-banner--correct /
 * .feedback-banner--incorrect classes in css/components.css — don't
 * introduce new one-off colors, they're already tokenized there.
 */

export function renderFeedback(state) {
  if (!state.checked) return null;

  const question = state.questions[state.index];

  if (state.lastAnswerCorrect) {
    return `
      <div class="feedback-banner feedback-banner--correct" role="status" aria-live="polite">
        <span>Correct!</span>
      </div>
    `;
  }

  return `
    <div class="feedback-banner feedback-banner--incorrect" role="status" aria-live="polite">
      <span>
        Not quite.
        <small>The correct answer is "${escapeHtml(question.correct)}".</small>
      </span>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
