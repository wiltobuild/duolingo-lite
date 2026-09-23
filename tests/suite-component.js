/**
 * Component tests for js/ui/question-screen.js: render it directly with
 * chosen states and check the DOM it produces.
 */

import {
  test, assert, eq, sleep, QUESTIONS, freshQuestionScreen, noHandlers, stateFor, indexes, mount,
} from "./harness.js";

const Q1 = QUESTIONS[0]; // hola -> hello (correct index 0)
const { correct: Q1_CORRECT, wrong: Q1_WRONG } = indexes(Q1);

const choices = (c) => [...c.querySelectorAll(".choice")];
const checkBtn = (c) => c.querySelector("[data-role='check-btn']");

// --- structure -------------------------------------------------------------

test("renders the prompt, the Spanish word, four choices and a Check button", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);
  eq(c.querySelector(".question-word").textContent, "hola");
  eq(choices(c).length, 4);
  eq(choices(c).map((b) => b.textContent.trim()).join("|"), Q1.choices.join("|"));
  eq(checkBtn(c).textContent.trim(), "Check");
});

// --- progress bar ----------------------------------------------------------

test("[P0] before checking, the bar counts the questions already finished (0/5 to 4/5)", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  for (let i = 0; i < 5; i++) {
    const c = mount();
    renderQuestionScreen(stateFor({ index: i }), c, noHandlers);
    eq(c.querySelector(".progress-fill").style.width, `${i * 20}%`, `width at index ${i}`);
    eq(c.querySelector(".progress-count").textContent, `${i}/5`, `count at index ${i}`);
  }
});

test("[P0, PRD acceptance] checking a question fills the bar; the last check reaches 5 of 5", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  for (let i = 0; i < 5; i++) {
    const c = mount();
    renderQuestionScreen(stateFor({ index: i, selectedChoice: 0, checked: true, lastAnswerCorrect: true }), c, noHandlers);
    eq(c.querySelector(".progress-fill").style.width, `${(i + 1) * 20}%`, `width after checking question ${i + 1}`);
    eq(c.querySelector(".progress-count").textContent, `${i + 1}/5`, `count after checking question ${i + 1}`);
    eq(c.querySelector("[role='progressbar']").getAttribute("aria-valuenow"), String(i + 1));
  }
});

test("progress bar exposes its value to assistive technology", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor({ index: 3 }), c, noHandlers);
  const bar = c.querySelector("[role='progressbar']");
  assert(bar, "a role=progressbar element exists");
  eq(bar.getAttribute("aria-valuenow"), "3");
  eq(bar.getAttribute("aria-valuemin"), "0");
  eq(bar.getAttribute("aria-valuemax"), "5");
  assert(bar.getAttribute("aria-label"), "it has an accessible name");
});

test("the progress fill's transition is 400ms or shorter (Doherty Threshold)", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);
  const seconds = parseFloat(getComputedStyle(c.querySelector(".progress-fill")).transitionDuration);
  assert(seconds <= 0.4, `transition is ${seconds}s`);
});

test("the fill animates from its previous width, not from zero", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  // Force the transition on, whatever this browser's reduced-motion setting.
  const style = document.createElement("style");
  style.textContent = ".progress-fill { transition: width .3s ease-out !important; }";
  document.head.appendChild(style);
  try {
    const c = mount();
    renderQuestionScreen(stateFor({ index: 1 }), c, noHandlers);
    renderQuestionScreen(stateFor({ index: 2 }), c, noHandlers);
    const fill = c.querySelector(".progress-fill");
    const track = c.querySelector(".progress-track").getBoundingClientRect().width;
    const [animation] = fill.getAnimations();
    assert(animation, "a width transition is running");
    // The browser reports the start value in percent or in pixels, depending on the engine.
    const start = String(animation.effect.getKeyframes()[0].width);
    const startShare = start.endsWith("%") ? parseFloat(start) / 100 : parseFloat(start) / track;
    assert(Math.abs(startShare - 0.2) < 0.03, `starts near 20% of the track, got ${(startShare * 100).toFixed(1)}%`);
    eq(fill.style.width, "40%");
  } finally {
    style.remove();
  }
});

test("moving backwards (restart) jumps straight to the new width", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const style = document.createElement("style");
  style.textContent = ".progress-fill { transition: width .3s ease-out !important; }";
  document.head.appendChild(style);
  try {
    const c = mount();
    renderQuestionScreen(stateFor({ index: 4 }), c, noHandlers);
    renderQuestionScreen(stateFor({ index: 0 }), c, noHandlers);
    const fill = c.querySelector(".progress-fill");
    eq(fill.style.width, "0%");
    eq(fill.getAnimations().length, 0, "no animation when the bar resets");
  } finally {
    style.remove();
  }
});

// --- choices and the Check button -----------------------------------------

test("[P0] Check is disabled until a choice is selected", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);
  eq(checkBtn(c).disabled, true, "disabled with nothing selected");
  renderQuestionScreen(stateFor({ selectedChoice: 2 }), c, noHandlers);
  eq(checkBtn(c).disabled, false, "enabled once a choice is selected");
});

test("[P0] the selected choice is marked; the others are not", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor({ selectedChoice: 2 }), c, noHandlers);
  const selected = choices(c).map((b) => b.classList.contains("choice--selected"));
  eq(selected.join(","), "false,false,true,false");
  const pressed = choices(c).map((b) => b.getAttribute("aria-pressed"));
  eq(pressed.join(","), "false,false,true,false");
  assert(choices(c).every((b) => !b.disabled), "choices stay clickable until checked");
});

test("[P0] after a correct check: right answer marked, all choices disabled, Check enabled", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor({ selectedChoice: Q1_CORRECT, checked: true, lastAnswerCorrect: true }), c, noHandlers);
  eq(c.querySelectorAll(".choice--correct").length, 1);
  eq(c.querySelectorAll(".choice--wrong").length, 0);
  eq(choices(c)[Q1_CORRECT].classList.contains("choice--correct"), true);
  assert(choices(c).every((b) => b.disabled), "every choice is disabled");
  eq(checkBtn(c).disabled, false, "the button can continue");
});

test("[P0] after a wrong check: the pick is marked wrong and the right answer is revealed", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  renderQuestionScreen(stateFor({ selectedChoice: Q1_WRONG, checked: true, lastAnswerCorrect: false }), c, noHandlers);
  eq(choices(c)[Q1_WRONG].classList.contains("choice--wrong"), true);
  eq(choices(c)[Q1_CORRECT].classList.contains("choice--correct"), true);
  eq(c.querySelectorAll(".choice--selected").length, 0, "the selected style gives way to correct/wrong");
});

test("clicking a choice reports its index; clicking Check reports once", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  const calls = [];
  renderQuestionScreen(stateFor({ selectedChoice: 1 }), c, {
    onSelectChoice: (i) => calls.push(`select:${i}`),
    onCheck: () => calls.push("check"),
  });
  choices(c)[3].click();
  checkBtn(c).click();
  eq(calls.join(","), "select:3,check");
});

test("a disabled Check button and disabled choices ignore clicks", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const c = mount();
  const calls = [];
  const handlers = { onSelectChoice: () => calls.push("select"), onCheck: () => calls.push("check") };
  renderQuestionScreen(stateFor(), c, handlers);
  checkBtn(c).click();
  renderQuestionScreen(stateFor({ selectedChoice: 0, checked: true, lastAnswerCorrect: true }), c, handlers);
  choices(c)[2].click();
  eq(calls.length, 0);
});

// --- safety ------------------------------------------------------------------

test("[security] markup in question data renders as text and never runs", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  const evil = [{
    word: `<img src=x onerror="window.__xss=1">`,
    correct: "<b>bold</b>",
    choices: ["<b>bold</b>", `a & b`, `"quoted" 'single'`, `<script>window.__xss=2</script>`],
  }];
  window.__xss = undefined;
  const c = mount();
  renderQuestionScreen(stateFor({}, evil), c, noHandlers);
  await sleep(50); // give a broken image time to fire onerror
  eq(c.querySelectorAll("img, script, b").length, 0, "no injected elements");
  eq(c.querySelector(".question-word").textContent, evil[0].word);
  eq(choices(c).map((b) => b.textContent.trim()).join("|"), evil[0].choices.join("|"));
  eq(window.__xss, undefined, "no injected code ran");
});

// --- keyboard focus ----------------------------------------------------------

test("[keyboard] the first render does not steal focus", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  document.activeElement?.blur();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);
  eq(document.activeElement, document.body);
});

test("[keyboard] focus follows the learner: choice, then Continue, then the next question", async () => {
  const { renderQuestionScreen } = await freshQuestionScreen();
  document.activeElement?.blur();
  const c = mount();
  renderQuestionScreen(stateFor(), c, noHandlers);

  renderQuestionScreen(stateFor({ selectedChoice: 2 }), c, noHandlers);
  eq(document.activeElement.dataset.choiceIndex, "2", "after selecting");

  renderQuestionScreen(stateFor({ selectedChoice: 3 }), c, noHandlers);
  eq(document.activeElement.dataset.choiceIndex, "3", "after changing the selection");

  renderQuestionScreen(stateFor({ selectedChoice: 3, checked: true, lastAnswerCorrect: false }), c, noHandlers);
  eq(document.activeElement.dataset.role, "check-btn", "after checking");

  renderQuestionScreen(stateFor({ index: 1 }), c, noHandlers);
  eq(document.activeElement.dataset.choiceIndex, "0", "on the next question");
});
