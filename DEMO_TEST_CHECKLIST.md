# Demo test checklist

Owner: Priscilla. Run this end-to-end before any demo — golden path first,
then edge cases. Status reflects a full run against `main` after
`feature/feedback-completion` and `feature/question-screen` merged.

## Golden path (all 5 questions, mixed correct/incorrect)

| Step | Expected | Status |
|---|---|---|
| Load app | First question ("hola") renders, progress shows 0/5 | ✅ Pass |
| Click a choice | Choice visually marked selected (`.choice--selected`), Check button enables | ✅ Pass |
| Click Check (correct answer) | Feedback banner shows "Correct!", choice marked `.choice--correct` | ✅ Pass |
| Click Check (incorrect answer) | Feedback banner reveals the correct answer, wrong choice marked `.choice--wrong`, correct choice marked `.choice--correct` | ✅ Pass |
| Choices disabled after checking | All four choice buttons `disabled` once checked | ✅ Pass — confirmed via DOM inspection |
| Click Check twice | Score doesn't change on the second click | ✅ Pass — button relabels to "Continue" after the first check, so there's no way to re-check from the UI |
| Click Continue | Advances to next question, resets selection/checked state | ✅ Pass |
| Progress bar | `.progress-fill` width and `.progress-count` (`n/5`) update each question | ✅ Pass |
| After question 5 | Completion screen shows score `x / 5` and a restart button | ✅ Pass |
| Click "Try again" | Returns to question 1 with score/progress reset | ✅ Pass |
| Refresh mid-lesson | Fresh lesson loads, no broken screen | ✅ Pass |
| Phone width (~375px) | No horizontal overflow, choices/progress bar readable | ✅ Pass |

Full run: 5/5 questions answered (4 correct, 1 incorrect on purpose to
exercise the wrong-answer path), completion screen showed `4 / 5`
correctly, restart worked, no console errors at any point.

## Accessibility

| Check | Status |
|---|---|
| Feedback banner announced to screen readers (`role="status"`, `aria-live="polite"`) | ✅ Pass |
| Progress bar has `role="progressbar"` + `aria-valuenow`/`aria-valuemax` | ✅ Pass |
| Choice buttons expose selection via `aria-pressed` | ✅ Pass |
| Visible focus state on interactive elements (`:focus-visible` in base.css, not overridden anywhere) | ✅ Pass — confirmed live via Tab key |
| Keyboard focus preserved across re-renders (question screen rebuilds the DOM on every state change) | ✅ Pass — `restoreFocus()` in `question-screen.js` moves focus to the right element after selecting, checking, or advancing |
| Reduced-motion respected | ✅ Pass — `@media (prefers-reduced-motion: reduce)` in base.css disables all transitions/animations globally |
| Color contrast — feedback banner text, `.btn-primary`, completion score, XP pill | ✅ Pass (4.5:1+ in both themes — see `css/tokens.css` for the contrast-fix history) |
| Completion screen announced to screen readers / focus moved on arrival | ⬜ Not yet done — no `aria-live`/focus management when the completion screen replaces the question screen |

## Remaining polish (non-blocking)

1. Completion screen: no screen-reader announcement or focus move when it appears (see Accessibility table above).
2. XP reward pill (P2) — correctly deprioritized per the PRD; only build if everything else above stays green.

## Retest triggers

Re-run the full golden path above whenever `js/state/lesson-state.js`,
`js/ui/question-screen.js`, `js/ui/feedback.js`, or
`js/ui/completion-screen.js` change.
