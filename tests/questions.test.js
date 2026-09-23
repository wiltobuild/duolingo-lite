/**
 * Data-integrity tests for the lesson content (js/data/questions.js).
 * No dependencies. Run from the repo root:
 *
 *   node --test "tests/*.test.js"
 *
 * The screens and the state machine all trust this shape, so a typo in
 * the content (a correct answer missing from the choices, a duplicate
 * choice) would show up in the demo as an unwinnable question.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { QUESTIONS } from "../js/data/questions.js";

// The PRD appendix: "hola = hello; gracias = thank you; agua = water;
// gato = cat; adiós = goodbye."
const PRD_PAIRS = [
  ["hola", "hello"],
  ["gracias", "thank you"],
  ["agua", "water"],
  ["gato", "cat"],
  ["adiós", "goodbye"],
];

test("[PRD acceptance] the lesson has exactly five questions", () => {
  assert.equal(QUESTIONS.length, 5);
});

test("[PRD appendix] the five words and answers match the PRD", () => {
  assert.deepEqual(
    QUESTIONS.map((q) => [q.word, q.correct]),
    PRD_PAIRS
  );
});

test("every question follows the shared format", () => {
  for (const q of QUESTIONS) {
    assert.equal(typeof q.word, "string");
    assert.ok(q.word.trim().length > 0, "word is not empty");
    assert.equal(typeof q.correct, "string");
    assert.ok(Array.isArray(q.choices), `${q.word}: choices is an array`);
    assert.ok(q.explanation === undefined || typeof q.explanation === "string");
    const extra = Object.keys(q).filter((k) => !["word", "correct", "choices", "explanation"].includes(k));
    assert.deepEqual(extra, [], `${q.word}: no unexpected fields`);
  }
});

test("[PRD] every question has four choices", () => {
  for (const q of QUESTIONS) assert.equal(q.choices.length, 4, q.word);
});

test("[PRD acceptance] each question has exactly one correct answer among its choices", () => {
  for (const q of QUESTIONS) {
    const matches = q.choices.filter((c) => c === q.correct);
    assert.equal(matches.length, 1, `${q.word}: "${q.correct}" appears once in choices`);
  }
});

test("no choice repeats within a question, ignoring case and spacing", () => {
  for (const q of QUESTIONS) {
    const normalised = q.choices.map((c) => c.trim().toLowerCase());
    assert.equal(new Set(normalised).size, normalised.length, q.word);
  }
});

test("no word repeats across the lesson", () => {
  const words = QUESTIONS.map((q) => q.word.toLowerCase());
  assert.equal(new Set(words).size, words.length);
});

test("choices are plain text, so they render safely and never look like markup", () => {
  for (const q of QUESTIONS) {
    for (const text of [q.word, ...q.choices]) assert.ok(!/[<>&]/.test(text), text);
  }
});

test("choices stay short enough for a 320px screen without wrapping badly", () => {
  for (const q of QUESTIONS) for (const c of q.choices) assert.ok(c.length <= 24, c);
});

test("the correct answer is not always in the same position", () => {
  const positions = new Set(QUESTIONS.map((q) => q.choices.indexOf(q.correct)));
  assert.ok(positions.size >= 2, "a fixed position would let a learner guess by pattern");
});
