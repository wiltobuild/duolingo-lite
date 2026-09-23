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
 * Done — reflects `state` in the rendered DOM:
 *   [P0] Progress bar: .progress-fill width and .progress-count text
 *        come from answeredCount() below.
 *   [P0] Selected choice: `.choice--selected` on the chosen button
 *        before it is checked.
 *   [P0] Checked state: all choice buttons disabled, `.choice--correct`
 *        on the right answer, `.choice--wrong` on an incorrect pick.
 *   [P0] Check button: disabled until a choice is selected, and enabled
 *        again once checked (app.js relabels it "Continue").
 *
 * TODO(Valerie):
 *   [P1] Responsive layout: verify this reads well at ~360px width
 *        (phone) as well as desktop. The shell in css/components.css
 *        (.app-shell) already caps width — extend as needed, don't
 *        fight it with fixed widths here.
 */

export function renderQuestionScreen(state, container, { onSelectChoice, onCheck }) {
  const question = state.questions[state.index];
  const total = state.questions.length;
  const answered = answeredCount(state);
  const correctIndex = question.choices.indexOf(question.correct);

  container.innerHTML = `
    <div class="progress-row">
      <div class="progress-track" role="progressbar" aria-label="Lesson progress"
        aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${answered}">
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
            `<button class="choice${choiceModifier(state, i, correctIndex)}" type="button"
              data-choice-index="${i}"${state.checked ? " disabled" : ""}
              aria-pressed="${!state.checked && state.selectedChoice === i}">${escapeHtml(choice)}</button>`
        )
        .join("")}
    </div>

    <button class="btn-primary" type="button" data-role="check-btn"${
      state.selectedChoice === null && !state.checked ? " disabled" : ""
    }>
      Check
    </button>
  `;

  container.querySelector("[data-role='progress-fill']").style.width = `${(answered / total) * 100}%`;
  container.querySelector("[data-role='progress-count']").textContent = `${answered}/${total}`;

  container.querySelectorAll("[data-choice-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      onSelectChoice(Number(btn.dataset.choiceIndex));
    });
  });

  container.querySelector("[data-role='check-btn']").addEventListener("click", onCheck);
}

/**
 * How many questions the progress bar counts as done. Kept in one place
 * so the formula can change without touching the render code — the PRD
 * says the bar runs from 0 of 5 to 5 of 5, which this formula never
 * reaches on the last question. Pending Wil's decision in Slack:
 * `state.index + (state.checked ? 1 : 0)` would fill the bar at the
 * moment feedback appears.
 */
function answeredCount(state) {
  return state.index;
}

/** The state-dependent modifier class (with a leading space) for one choice button. */
function choiceModifier(state, i, correctIndex) {
  if (state.checked) {
    if (i === correctIndex) return " choice--correct";
    if (i === state.selectedChoice) return " choice--wrong";
    return "";
  }
  return i === state.selectedChoice ? " choice--selected" : "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
