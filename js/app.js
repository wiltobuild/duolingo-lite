/**
 * App entry point — integration.
 * Owner: Wil (lead) — lesson state, answer checking, integration, final
 * release.
 *
 * This is the only file that imports both state/ and ui/. UI modules
 * should never import each other or reach into lesson-state.js
 * directly — they receive `state` as a plain object and report user
 * actions back through the callbacks passed in here. Keep it that way;
 * it's what lets Valerie and Priscilla build their screens without
 * stepping on each other's files.
 */

import { QUESTIONS } from "./data/questions.js";
import {
  createLessonState,
  selectChoice,
  checkAnswer,
  nextQuestion,
  restart,
  isComplete,
} from "./state/lesson-state.js";
import { renderQuestionScreen } from "./ui/question-screen.js";
import { renderFeedback } from "./ui/feedback.js";
import { renderCompletionScreen } from "./ui/completion-screen.js";

const root = document.getElementById("app");

let state = createLessonState(QUESTIONS);

function render() {
  root.innerHTML = `
    <div class="app-shell">
      <div class="card">
        <div class="card__body" data-role="screen"></div>
      </div>
    </div>
  `;

  const screen = root.querySelector("[data-role='screen']");

  if (isComplete(state)) {
    renderCompletionScreen(state, screen, { onRestart: handleRestart });
    return;
  }

  renderQuestionScreen(state, screen, {
    onSelectChoice: handleSelectChoice,
    onCheck: handleCheck,
  });

  const feedbackHtml = renderFeedback(state);
  if (feedbackHtml) {
    screen.insertAdjacentHTML("beforeend", feedbackHtml);
  }

  // Once checked, the Check button becomes "Continue" and advances
  // instead of re-checking. TODO(Valerie/Priscilla): wire this into
  // your rendered button once the checked-state styling is in place —
  // for now this keeps the flow usable end to end.
  if (state.checked) {
    const btn = screen.querySelector("[data-role='check-btn']");
    if (btn) {
      btn.textContent = state.index === state.questions.length - 1 ? "See results" : "Continue";
      btn.disabled = false;
      btn.onclick = handleNext;
    }
  }
}

function handleSelectChoice(choiceIndex) {
  state = selectChoice(state, choiceIndex);
  render();
}

function handleCheck() {
  state = checkAnswer(state);
  render();
}

function handleNext() {
  state = nextQuestion(state);
  render();
}

function handleRestart() {
  state = restart(state);
  render();
}

render();
