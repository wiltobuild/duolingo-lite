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

Audited what's currently reachable (static screens + globally-applied CSS).
Answer-state styling (`.choice--correct/--wrong`) can't be audited yet — see
blockers below.

| Check | Status |
|---|---|
| Feedback banner announced to screen readers (`role="status"`, `aria-live="polite"`) | ✅ Pass |
| Visible focus state on interactive elements (`:focus-visible` in base.css, not overridden anywhere) | ✅ Pass — confirmed live via Tab key, clear outline on choice buttons |
| Reduced-motion respected | ✅ Pass — `@media (prefers-reduced-motion: reduce)` in base.css disables all transitions/animations globally; components.css has no motion outside that scope |
| Color contrast — feedback banner text (`--good`/`--bad` on their `-wash` backgrounds, 14px/600 weight → counts as normal text, needs 4.5:1) | ❌ **Fail (light mode).** `--good` on `--good-wash` = 3.02:1, `--bad` on `--bad-wash` = 3.24:1. Dark mode passes (6.67:1 / 5.68:1). This is a token-level issue (`css/tokens.css`), not something to patch per-component — flagging for the team since other screens reuse these tokens. |
| Color contrast — `.btn-primary` (white text on `--accent`, 15px/700 — doesn't meet the 18.66px bold threshold for "large text", needs 4.5:1) | ❌ **Fail.** Light mode 3.28:1, dark mode 2.28:1 (worse — dark mode's `--accent` is lighter/lower-contrast against white). Shared button used everywhere; also a token-level issue. |
| Color contrast — completion score, XP pill, body text | ✅ Pass (4.5:1+ in both themes) |

## Known blockers before this is demoable

1. **P0 — Check button never enables after selecting a choice** (`js/ui/question-screen.js`). Nothing else can be demoed until this lands.
2. **P0 — Choice/progress state styling missing** (same file): selected/correct/wrong choice classes, progress bar fill and count. Also blocks auditing contrast on `.choice--correct`/`.choice--wrong`.
3. **Accessibility — `--good`/`--bad` and `.btn-primary` fail WCAG AA contrast in light mode** (`.btn-primary` fails in dark mode too). Needs a token adjustment in `css/tokens.css` — raising this with the team since it's shared, not scoped to one owner's file.

## Retest once blockers land

Re-run the full golden path above via actual clicks (not direct state
injection) once `question-screen.js`'s P0s are merged, and confirm the
feedback banner + completion screen behave the same as the isolated
tests above.
