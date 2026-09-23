/**
 * End-to-end tests: load the real app in an iframe and drive it by
 * clicking, the way a learner does. Covers the PRD's golden path, the
 * refresh case, tampering with the page, and a seeded random walk.
 */

import { test, assert, eq, sleep, QUESTIONS, loadApp, answerCurrent, indexes } from "./harness.js";

const WORDS = QUESTIONS.map((q) => q.word);

function screenState(app) {
  const complete = Boolean(app.q(".completion"));
  return {
    complete,
    word: app.q(".question-word")?.textContent,
    count: app.q(".progress-count")?.textContent,
    score: app.q(".completion__score")?.textContent,
    checkDisabled: app.q("[data-role='check-btn']")?.disabled,
    checkLabel: app.q("[data-role='check-btn']")?.textContent.trim(),
    banner: app.q(".feedback-banner")?.textContent.replace(/\s+/g, " ").trim(),
  };
}

async function withApp(fn, width) {
  const app = await loadApp(width);
  try {
    await fn(app);
    eq(app.errors.length, 0, `console errors: ${app.errors.join(" | ")}`);
  } finally {
    app.close();
  }
}

// --- golden path ---------------------------------------------------------------

test("[golden path] five questions, mixed answers: every step shows the right thing", () =>
  withApp(async (app) => {
    const pattern = [true, false, true, false, true];
    let expectedScore = 0;

    for (let i = 0; i < 5; i++) {
      const question = QUESTIONS[i];
      const { correct, wrong } = indexes(question);
      let s = screenState(app);
      eq(s.word, WORDS[i], `question ${i + 1} word`);
      eq(s.count, `${i}/5`, `question ${i + 1} progress`);
      eq(s.checkDisabled, true, `question ${i + 1}: Check starts disabled`);
      eq(app.qa(".choice--selected, .choice--correct, .choice--wrong").length, 0, "nothing pre-marked");
      eq(s.banner, undefined, "no feedback before checking");

      const pick = pattern[i] ? correct : wrong;
      app.qa(".choice")[pick].click();
      s = screenState(app);
      eq(s.checkDisabled, false, `question ${i + 1}: Check enables after a pick`);
      eq(app.qa(".choice--selected").length, 1);
      eq(app.doc.activeElement.dataset.choiceIndex, String(pick), "focus stays on the pick");

      app.q("[data-role='check-btn']").click();
      s = screenState(app);
      if (pattern[i]) {
        expectedScore++;
        assert(s.banner.startsWith("Correct!"), `correct banner, got "${s.banner}"`);
      } else {
        assert(s.banner.includes("Not quite"), `incorrect banner, got "${s.banner}"`);
        assert(s.banner.includes(`"${question.correct}"`), "the banner names the correct answer");
        eq(app.qa(".choice")[wrong].classList.contains("choice--wrong"), true);
      }
      eq(app.qa(".choice")[correct].classList.contains("choice--correct"), true, "right answer marked");
      assert(app.qa(".choice").every((b) => b.disabled), "choices locked after checking");
      eq(s.count, `${i + 1}/5`, `question ${i + 1}: the bar fills when the answer is checked`);
      eq(s.checkLabel, i === 4 ? "See results" : "Continue");
      eq(app.doc.activeElement.dataset.role, "check-btn", "focus moves to Continue");

      app.q("[data-role='check-btn']").click();
    }

    const done = screenState(app);
    eq(done.complete, true);
    eq(done.score, `${expectedScore} / 5`);
    eq(expectedScore, 3);

    app.q("[data-role='restart-btn']").click();
    const again = screenState(app);
    eq(again.word, "hola", "restart returns to question one");
    eq(again.count, "0/5", "restart resets the bar");
    eq(app.qa(".choice--selected, .choice--correct, .choice--wrong").length, 0);
  }));

test("a perfect run scores 5 / 5", () =>
  withApp(async (app) => {
    for (let i = 0; i < 5; i++) answerCurrent(app, true);
    eq(screenState(app).score, "5 / 5");
  }));

test("an all-wrong run scores 0 / 5 and still completes", () =>
  withApp(async (app) => {
    for (let i = 0; i < 5; i++) answerCurrent(app, false);
    eq(screenState(app).score, "0 / 5");
  }));

test("the learner can change the pick before checking; only the last pick counts", () =>
  withApp(async (app) => {
    const { correct, wrong } = indexes(QUESTIONS[0]);
    app.qa(".choice")[wrong].click();
    app.qa(".choice")[correct].click();
    eq(app.qa(".choice--selected").length, 1);
    eq(app.qa(".choice")[correct].classList.contains("choice--selected"), true);
    app.q("[data-role='check-btn']").click();
    assert(screenState(app).banner.startsWith("Correct!"));
  }));

// --- interruption -------------------------------------------------------------

test("[P0] refreshing mid-lesson starts a fresh lesson without a broken screen", () =>
  withApp(async (app) => {
    answerCurrent(app, true);
    answerCurrent(app, true);
    eq(screenState(app).count, "2/5");
    app.win.location.reload();
    await new Promise((resolve) => (app.frame.onload = resolve));
    for (let i = 0; i < 50 && !app.frame.contentDocument.querySelector(".question-word"); i++) await sleep(20);
    const doc = app.frame.contentDocument;
    eq(doc.querySelector(".question-word").textContent, "hola");
    eq(doc.querySelector(".progress-count").textContent, "0/5");
    eq(doc.querySelectorAll(".choice").length, 4);
  }));

// --- tampering (what a curious user can do from the browser console) -----------

test("[security] re-enabling a locked choice after checking changes nothing", () =>
  withApp(async (app) => {
    const { correct } = indexes(QUESTIONS[0]);
    app.qa(".choice")[correct].click();
    app.q("[data-role='check-btn']").click(); // score 1
    app.qa(".choice").forEach((b) => b.removeAttribute("disabled"));
    app.qa(".choice")[2].click();
    eq(app.qa(".choice--selected").length, 0, "no new selection appears");
    eq(app.qa(".choice")[correct].classList.contains("choice--correct"), true);
    app.q("[data-role='check-btn']").click(); // Continue
    for (let i = 1; i < 5; i++) answerCurrent(app, false);
    eq(screenState(app).score, "1 / 5", "the tampered click did not add or remove points");
  }));

test("[security] forcing Check on with nothing selected does nothing", () =>
  withApp(async (app) => {
    const btn = app.q("[data-role='check-btn']");
    btn.removeAttribute("disabled");
    btn.click();
    const s = screenState(app);
    eq(s.banner, undefined, "no feedback appears");
    eq(s.word, "hola");
    eq(s.count, "0/5");
  }));

test("[P0] submitting twice in the same instant does not score twice", () =>
  withApp(async (app) => {
    const { correct } = indexes(QUESTIONS[0]);
    app.qa(".choice")[correct].click();
    const staleCheck = app.q("[data-role='check-btn']");
    staleCheck.click();
    staleCheck.click(); // the same, now detached, button
    staleCheck.click();
    eq(screenState(app).word, "hola", "still on the checked question");
    for (let i = 0; i < 1; i++) app.q("[data-role='check-btn']").click(); // Continue
    for (let i = 1; i < 5; i++) answerCurrent(app, false);
    eq(screenState(app).score, "1 / 5");
  }));

test("a double-click on Continue advances exactly one question", () =>
  withApp(async (app) => {
    const { correct } = indexes(QUESTIONS[0]);
    app.qa(".choice")[correct].click();
    app.q("[data-role='check-btn']").click();
    const stale = app.q("[data-role='check-btn']");
    stale.click(); // Continue
    stale.click(); // a second click on the same, now detached, button
    const s = screenState(app);
    eq(s.word, "gracias");
    eq(s.count, "1/5");
  }));

// --- speed (Doherty Threshold) -----------------------------------------------------

test("[Doherty] feedback is in the page immediately after tapping Check, well under 400ms", () =>
  withApp(async (app) => {
    const { correct } = indexes(QUESTIONS[0]);
    app.qa(".choice")[correct].click();
    const started = performance.now();
    app.q("[data-role='check-btn']").click();
    const banner = app.q(".feedback-banner");
    const elapsed = performance.now() - started;
    assert(banner, "the banner exists as soon as the click handler returns");
    assert(elapsed < 100, `took ${elapsed.toFixed(1)}ms`);
  }));

test("the feedback banner is announced to screen readers", () =>
  withApp(async (app) => {
    app.qa(".choice")[0].click();
    app.q("[data-role='check-btn']").click();
    const banner = app.q(".feedback-banner");
    eq(banner.getAttribute("role"), "status");
    eq(banner.getAttribute("aria-live"), "polite");
  }));

// --- seeded random walk --------------------------------------------------------------

/** Small, fixed-seed random number generator so a failure can be replayed. */
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("[fuzz] 600 random clicks never break an invariant", () =>
  withApp(async (app) => {
    const random = mulberry32(20260923);
    let completions = 0;

    for (let step = 0; step < 600; step++) {
      const s = screenState(app);
      if (s.complete) {
        completions++;
        assert(/^[0-5] \/ 5$/.test(s.score), `score format "${s.score}"`);
        app.q("[data-role='restart-btn']").click();
        continue;
      }
      const index = WORDS.indexOf(s.word);
      assert(index >= 0, `unknown word "${s.word}"`);
      const checked = app.qa(".choice").every((b) => b.disabled);
      eq(s.count, `${index + (checked ? 1 : 0)}/5`, "the count always matches the question and its checked state");
      const selected = app.qa(".choice--selected").length;
      assert(selected <= 1, "at most one selected choice");
      eq(s.checkDisabled, !checked && selected === 0, "Check is disabled exactly when nothing is selected");
      assert(app.qa(".choice--correct").length <= 1, "at most one correct mark");
      assert(app.qa(".choice--wrong").length <= 1, "at most one wrong mark");
      eq(Boolean(s.banner), checked, "feedback shows exactly when the answer is checked");

      const roll = random();
      if (roll < 0.45) app.qa(".choice")[Math.floor(random() * 4)].click();
      else app.q("[data-role='check-btn']").click(); // Check or Continue, whichever it is now
    }
    assert(completions >= 1, "the walk finished at least one lesson");
  }));
