# Demo test checklist

Owner: Priscilla. Run this end-to-end before any demo — golden path first,
then edge cases. Status reflects the last run against `main` +
`feature/feedback-completion`.

## Golden path (all 5 questions, mixed correct/incorrect)

| Step | Expected | Status |
|---|---|---|
| Load app | First question ("hola") renders, progress shows 0/5 | ✅ Pass |
| Click a choice | Choice visually marked selected, Check button enables | ❌ **Fail — blocks the whole demo.** Check button stays `disabled` after selecting a choice. `question-screen.js` never clears the hardcoded `disabled` attribute (Valerie's open P0). |
| Click Check (correct answer) | Feedback banner shows "Correct!", choice marked `.choice--correct` | ⚠️ Feedback banner logic verified correct in isolation (`renderFeedback`), but unreachable via UI until the above is fixed. Choice styling (`.choice--correct`/`--wrong`) is also Valerie's open P0. |
| Click Check (incorrect answer) | Feedback banner reveals the correct answer, wrong choice marked `.choice--wrong` | ⚠️ Same as above — banner content verified correct, not reachable via UI yet |
| Click Continue | Advances to next question, resets selection/checked state | Not tested — blocked by the above |
| Progress bar | `.progress-fill` width and `.progress-count` (`n/5`) update each question | ❌ Fail — never updates from 0 (Valerie's open P0) |
| After question 5 | Completion screen shows score `x / 5` and a restart button | ✅ Pass (verified via direct state manipulation — `completion-screen.js` is functional) |
| Click "Try again" | Returns to question 1 with score/progress reset | ✅ Pass |

## Accessibility

| Check | Status |
|---|---|
| Feedback banner announced to screen readers (`role="status"`, `aria-live="polite"`) | ✅ Pass |
| Every interactive element has a visible focus state | Not yet audited — pending full accessibility review |
| Reduced-motion respected | Not yet audited |
| Color contrast (`--good`/`--bad` tokens) | Not yet audited |

## Known blockers before this is demoable

1. **P0 — Check button never enables after selecting a choice** (`js/ui/question-screen.js`). Nothing else can be demoed until this lands.
2. **P0 — Choice/progress state styling missing** (same file): selected/correct/wrong choice classes, progress bar fill and count.

## Retest once blockers land

Re-run the full golden path above via actual clicks (not direct state
injection) once `question-screen.js`'s P0s are merged, and confirm the
feedback banner + completion screen behave the same as the isolated
tests above.
