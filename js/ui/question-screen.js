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
 *   [P1] Responsive layout: verified from 320px to 1280px (no sideways
 *        scrolling, 44px touch targets) by tests/suite-layout.js.
 *
 * Also handled here, beyond the PRD list: a progress fill that animates
 * (see setProgressWidth), keyboard focus that survives app.js re-rendering
 * the screen (see restoreFocus), and accessible names and non-color state
 * symbols on the choices. Tests: see tests/README.md.
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

    <p class="question-prompt" id="question-prompt">Which word means…</p>
    <div class="question-word" id="question-word" lang="es">${escapeHtml(question.word)}</div>

    <div class="choice-list" role="group" aria-labelledby="question-prompt question-word">
      ${question.choices
        .map(
          (choice, i) =>
            choiceButton(state, i, correctIndex, choice)
        )
        .join("")}
    </div>

    <button class="btn-primary" type="button" data-role="check-btn"${
      state.selectedChoice === null && !state.checked ? " disabled" : ""
    }>
      Check
    </button>
  `;

  setProgressWidth(container.querySelector("[data-role='progress-fill']"), (answered / total) * 100);
  container.querySelector("[data-role='progress-count']").textContent = `${answered}/${total}`;

  container.querySelectorAll("[data-choice-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      onSelectChoice(Number(btn.dataset.choiceIndex));
    });
  });

  container.querySelector("[data-role='check-btn']").addEventListener("click", onCheck);

  restoreFocus(state, container);
}

// app.js rebuilds the whole screen on every state change, which throws
// away whichever button had keyboard focus. Put focus back where a
// keyboard user would expect it. Skipped on the first render so the page
// does not steal focus on load.
let lastRender = null;

function restoreFocus(state, container) {
  const previous = lastRender;
  lastRender = { index: state.index, selectedChoice: state.selectedChoice, checked: state.checked };
  if (previous === null) return;

  let target = null;
  if (state.checked && !previous.checked) {
    target = container.querySelector("[data-role='check-btn']"); // becomes Continue
  } else if (state.index !== previous.index) {
    target = container.querySelector("[data-choice-index]"); // first choice of the next question
  } else if (state.selectedChoice !== previous.selectedChoice) {
    target = container.querySelector(`[data-choice-index='${state.selectedChoice}']`);
  }
  if (target) target.focus();
}

// app.js rebuilds the whole screen on every state change, so each new
// .progress-fill starts at its final width and a CSS transition has
// nothing to animate. Remember the last width, start the new element
// there, then move it to the new width so the bar visibly fills.
let lastProgressPct = null;

function setProgressWidth(fill, pct) {
  const from = lastProgressPct !== null && pct > lastProgressPct ? lastProgressPct : pct;
  fill.style.width = `${from}%`;
  if (from !== pct) {
    void fill.offsetWidth; // commit the starting width before changing it
    fill.style.width = `${pct}%`;
  }
  lastProgressPct = pct;
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

/**
 * One answer button. Color alone must not carry the state, so each state
 * also has a symbol (hidden from screen readers) and, for the answer
 * feedback, spoken text that only screen readers get.
 */
function choiceButton(state, i, correctIndex, text) {
  let modifier = "";
  let mark = "";
  let spoken = "";
  if (state.checked) {
    if (i === correctIndex) {
      modifier = " choice--correct";
      mark = "✓";
      spoken = " (correct answer)";
    } else if (i === state.selectedChoice) {
      modifier = " choice--wrong";
      mark = "✕";
      spoken = " (your answer, incorrect)";
    }
  } else if (i === state.selectedChoice) {
    modifier = " choice--selected";
    mark = "●";
  }

  return `<button class="choice${modifier}" type="button" data-choice-index="${i}"${state.checked ? " disabled" : ""}
    aria-pressed="${!state.checked && state.selectedChoice === i}"><span class="choice__mark" aria-hidden="true">${mark}</span><span>${escapeHtml(text)}</span>${
      spoken ? `<span class="visually-hidden">${spoken}</span>` : ""
    }</button>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
