/**
 * Question screen.
 * Owner: Valerie — question screen, choice controls, progress bar,
 * responsive layout.
 *
 * What's wired for you:
 *   - The DOM structure (progress bar shell, prompt, word, choice
 *     buttons) using the classes in css/components.css.
 *   - Click handling: each choice button already calls `onSelectChoice`,
 *     and the Check button already calls `onCheck`. Don't rewire these —
 *     just make them *look* right for the current state.
 *
 * TODO(Valerie) — reflect `state` in the rendered DOM:
 *   [P0] Progress bar: set .progress-fill width to (state.index /
 *        state.questions.length) * 100%, and .progress-count text to
 *        `${state.index}/${state.questions.length}`.
 *   [P0] Selected choice: add `.choice--selected` to the chosen button
 *        before it's checked.
 *   [P0] Checked state: once `state.checked` is true, disable all choice
 *        buttons, add `.choice--correct` to the right answer, and
 *        `.choice--wrong` to an incorrect pick.
 *   [P0] Check button: disabled until a choice is selected (already
 *        partly done below — verify it covers the checked state too).
 *   [P1] Responsive layout: verify this reads well at ~360px width
 *        (phone) as well as desktop. The shell in css/components.css
 *        (.app-shell) already caps width — extend as needed, don't
 *        fight it with fixed widths here.
 */

export function renderQuestionScreen(state, container, { onSelectChoice, onCheck }) {
  const question = state.questions[state.index];

  container.innerHTML = `
    <div class="progress-row">
      <div class="progress-track">
        <div class="progress-fill" data-role="progress-fill"></div>
      </div>
      <span class="progress-count" data-role="progress-count"></span>
    </div>

    <p class="question-prompt">Which word means…</p>
    <div class="question-word">${escapeHtml(question.word)}</div>

    <div class="choice-list" data-role="choice-list">
      ${question.choices
        .map(
          (choice, i) =>
            `<button class="choice" type="button" data-choice-index="${i}">${escapeHtml(choice)}</button>`
        )
        .join("")}
    </div>

    <button class="btn-primary" type="button" data-role="check-btn" disabled>
      Check
    </button>
  `;

  container.querySelectorAll("[data-choice-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      onSelectChoice(Number(btn.dataset.choiceIndex));
    });
  });

  container.querySelector("[data-role='check-btn']").addEventListener("click", onCheck);

  // TODO(Valerie): everything above renders the *shell*. Now make it
  // reflect `state` — see the TODO list in this file's header comment.
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
