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
| Color contrast — feedback banner text (`--good`/`--bad` on their `-wash` backgrounds, 14px/600 weight → counts as normal text, needs 4.5:1) | ✅ **Fixed.** Darkened `--good` (#2f9e50 → #247b3e, 4.65:1) and `--bad` (#e0563e → #c63820, 4.52:1) in light mode (`css/tokens.css`). Dark mode already passed and is unchanged. Discussed with Wil before touching the shared tokens file. |
| Color contrast — `.btn-primary` (white text on background, 15px/700 — doesn't meet the 18.66px bold threshold for "large text", needs 4.5:1) | ✅ **Fixed.** `--accent`/`--accent-deep` swap lightness direction between themes (lighter in dark mode, for text emphasis), so neither cleared 4.5:1 for white text in both themes. Added a theme-invariant `--accent-contrast` (#2c8256, 4.74:1 in both themes) and pointed `.btn-primary`'s background/shadow at it instead — `--accent`/`--accent-deep` are untouched elsewhere (progress fill, word color, borders, focus ring). |
| Color contrast — completion score, XP pill, body text | ✅ Pass (4.5:1+ in both themes) |

## Known blockers before this is demoable

1. **P0 — Check button never enables after selecting a choice** (`js/ui/question-screen.js`). Nothing else can be demoed until this lands.
2. **P0 — Choice/progress state styling missing** (same file): selected/correct/wrong choice classes, progress bar fill and count. Also blocks auditing contrast on `.choice--correct`/`.choice--wrong` once implemented.

## Retest once blockers land

Re-run the full golden path above via actual clicks (not direct state
injection) once `question-screen.js`'s P0s are merged, and confirm the
feedback banner + completion screen behave the same as the isolated
tests above.
