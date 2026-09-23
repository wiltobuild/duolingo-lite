/**
 * Sample lesson content — Beginner Spanish vocabulary.
 * Owner: Priscilla (content).
 *
 * Shared question format (agreed Day 1, per the PRD's dependency & scope
 * rule) — don't change this shape without syncing with the team, since
 * lesson-state.js and the UI modules all depend on it:
 *
 *   {
 *     word: string,          // the Spanish word being tested
 *     correct: string,       // the correct English answer (must equal
 *                             // one entry in `choices`)
 *     choices: string[4],    // four original answer choices, one correct
 *     explanation?: string,  // optional — shown on an incorrect answer
 *   }
 */

export const QUESTIONS = [
  {
    word: "hola",
    correct: "hello",
    choices: ["hello", "goodbye", "please", "sorry"],
  },
  {
    word: "gracias",
    correct: "thank you",
    choices: ["excuse me", "thank you", "you're welcome", "good night"],
  },
  {
    word: "agua",
    correct: "water",
    choices: ["bread", "milk", "water", "fire"],
  },
  {
    word: "gato",
    correct: "cat",
    choices: ["dog", "cat", "bird", "horse"],
  },
  {
    word: "adiós",
    correct: "goodbye",
    choices: ["hello", "welcome", "goodbye", "thanks"],
  },
];
