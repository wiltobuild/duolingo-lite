/**
 * Tiny in-browser test harness. No dependencies.
 *
 * A suite file imports { test, todo, ... } from here and registers tests.
 * browser-tests.js imports every suite, then calls run().
 */

const registered = [];

/** Register a test. `fn` may be async; throw (or call assert) to fail. */
export function test(name, fn) {
  registered.push({ name, fn, todo: false });
}

/** Register a known gap. It runs and reports, but a failure does not fail the run. */
export function todo(name, fn) {
  registered.push({ name, fn, todo: true });
}

export function assert(condition, message = "assertion failed") {
  if (!condition) throw new Error(message);
}

export function eq(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`${message ? message + ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function run() {
  const out = document.getElementById("results");
  const summary = document.getElementById("summary");
  const results = [];

  for (const t of registered) {
    let status = "pass";
    let detail = "";
    try {
      await t.fn();
    } catch (err) {
      status = t.todo ? "todo" : "fail";
      detail = err.message;
    }
    if (t.todo && status === "pass") detail = "(known gap now passes: promote it to a normal test)";
    results.push({ name: t.name, status, detail });
    const line = document.createElement("div");
    line.className = status;
    line.textContent = `${status.toUpperCase().padEnd(4)}  ${t.name}${detail ? "\n        " + detail : ""}`;
    out.appendChild(line);
  }

  const count = (s) => results.filter((r) => r.status === s).length;
  const failed = count("fail");
  summary.textContent = `${count("pass")} passed, ${failed} failed, ${count("todo")} known gaps`;
  summary.className = failed ? "fail" : "pass";
  window.__testResults = { passed: count("pass"), failed, todo: count("todo"), results };
  return window.__testResults;
}

// ---------------------------------------------------------------------------
// Shared fixtures

import { QUESTIONS } from "../js/data/questions.js";
import { createLessonState } from "../js/state/lesson-state.js";

export { QUESTIONS };

let moduleCounter = 0;

/**
 * A fresh copy of question-screen.js. The module keeps a little state
 * between renders (last progress width, last focus target), so each test
 * loads its own copy to stay independent.
 */
export function freshQuestionScreen() {
  return import(`../js/ui/question-screen.js?fresh=${++moduleCounter}`);
}

export const noHandlers = { onSelectChoice() {}, onCheck() {} };

/** A lesson state with overrides, e.g. stateFor({ selectedChoice: 2 }). */
export function stateFor(overrides = {}, questions = QUESTIONS) {
  return { ...createLessonState(questions), ...overrides };
}

/** Correct and wrong choice indexes for a question. */
export function indexes(question) {
  const correct = question.choices.indexOf(question.correct);
  return { correct, wrong: correct === 0 ? 1 : 0 };
}

/** Mount a container styled like the app's card body, inside the fixtures area. */
export function mount() {
  const shell = document.createElement("div");
  shell.className = "app-shell";
  shell.innerHTML = `<div class="card"><div class="card__body"></div></div>`;
  document.getElementById("fixtures").appendChild(shell);
  return shell.querySelector(".card__body");
}

export function clearFixtures() {
  document.getElementById("fixtures").innerHTML = "";
}

/**
 * Load the real app in an iframe of a given size (the iframe's width is
 * its viewport width, so media queries and layout behave as on a phone).
 * Resolves once the first question has rendered.
 */
export async function loadApp(width = 390, height = 800) {
  const frame = document.createElement("iframe");
  frame.style.cssText = `width:${width}px;height:${height}px`;
  frame.src = "../index.html";
  document.getElementById("frames").appendChild(frame);
  await new Promise((resolve) => (frame.onload = resolve));

  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  for (let i = 0; i < 50 && !doc.querySelector(".question-word, .completion"); i++) await sleep(20);

  const errors = [];
  win.addEventListener("error", (e) => errors.push(e.message));
  win.addEventListener("unhandledrejection", (e) => errors.push(String(e.reason)));
  const originalError = win.console.error;
  win.console.error = (...args) => {
    errors.push(args.join(" "));
    originalError.apply(win.console, args);
  };

  const q = (selector) => doc.querySelector(selector);
  const qa = (selector) => [...doc.querySelectorAll(selector)];
  return { frame, win, doc, q, qa, errors, close: () => frame.remove() };
}

/** Answer the question on screen through the real UI: choose, check, continue. */
export function answerCurrent(app, pickCorrect) {
  const word = app.q(".question-word").textContent;
  const question = QUESTIONS.find((item) => item.word === word);
  const { correct, wrong } = indexes(question);
  app.qa(".choice")[pickCorrect ? correct : wrong].click();
  app.q("[data-role='check-btn']").click(); // Check
  app.q("[data-role='check-btn']").click(); // Continue / See results
}
