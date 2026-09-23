/**
 * Completion screen.
 * Owner: Priscilla — feedback and completion screens, accessibility
 * review, demo test checklist.
 *
 * app.js calls this instead of renderQuestionScreen once
 * isComplete(state) is true.
 *
 * TODO(Priscilla):
 *   [P0] Show a completion screen with the number correct out of five
 *        (state.score / state.questions.length).
 *   [P0] Restart button — already wired to `onRestart` below, just
 *        style/position it (or reuse .btn-primary).
 *   [P2] XP reward — only after every P0 check in the PRD passes. See
 *        the Success Metrics table before starting this.
 *
 * Reach for .completion / .completion__score / .xp-pill in
 * css/components.css.
 */

export function renderCompletionScreen(state, container, { onRestart }) {
  container.innerHTML = `
    <div class="completion">
      <h3>Lesson complete</h3>
      <div class="completion__score" data-role="score"></div>
      <button class="btn-primary" type="button" data-role="restart-btn">Try again</button>
    </div>
  `;

  container.querySelector("[data-role='score']").textContent =
    `${state.score} / ${state.questions.length}`;

  container.querySelector("[data-role='restart-btn']").addEventListener("click", onRestart);

  // TODO(Priscilla): the shell above is functional but plain — see the
  // TODO list in this file's header comment for what's left.
}
