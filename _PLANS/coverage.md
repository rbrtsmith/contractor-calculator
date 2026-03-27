# Coverage Plan — Path to 100%

## Context

Current coverage: 96% statements, 91% branches, 89% functions, 95% lines.
Target: 100% across all metrics (enforced via vitest thresholds).

The vast majority of new tests go into the two existing integration test files
(`app/outside-ir35.test.tsx`, `app/inside-ir35.test.tsx`) which exercise the app
like a real user. A small number of targeted unit tests are added for pure utility
functions. A handful of branches are marked `/* v8 ignore */` where testing would
be artificial.

---

## Ignore candidates (do NOT write tests for these)

These are defensive guard branches with no meaningful user behaviour to test:

| Location | Code | Reason to ignore |
|----------|------|-----------------|
| `constants.ts:17` | `asTaxYear` fallback returning latest year | The `else` branch is only reachable by programmatically passing an invalid string — never happens via the UI; the type system prevents it in typed call sites |
| `app/page.tsx:34` | `activeTab` initial state on the "outside" button's `onClick` | Covered implicitly by all outside IR35 tests; the uncovered line is the `setActiveTab("outside")` call which only fires if already on inside tab — adding a tab-switch test purely for this line provides no regression value beyond what already exists |

Apply `/* v8 ignore next */` inline comments to suppress these specific lines.

---

## Integration tests to add to `app/outside-ir35.test.tsx`

### O-1: Days mode toggle — switch to weekly then back to annual
**Behaviour:** User switches to "Weeks × days per week", fills in values, sees the
computed annual total. Then switches back to "Annual days" and the input returns.
**Lines covered:** `OutsideIR35Form.tsx` line 230 (annual radio onChange)

### O-2: "Max out" salary button sets salary to tax-efficient value
**Behaviour:** User clears the salary field then clicks "Max out" — the field
auto-populates with £12,564.00 and results recalculate.
**Lines covered:** `OutsideIR35Form.tsx:392-437` (setValue onClick)

### O-3: "Efficient" dividend button sets dividend to basic-rate ceiling
**Behaviour:** With max salary already set, user clicks "Efficient" — the dividend
field auto-populates with the maximum amount that stays in the basic rate band.
**Lines covered:** `OutsideIR35Form.tsx:392-437`

### O-4: "All" dividend button draws all available profit as dividends
**Behaviour:** User clicks "All" — the dividend field auto-populates with total
available profit minus corporation tax minus salary, matching the displayed maximum.
**Lines covered:** `OutsideIR35Form.tsx:392-437`

### O-5: BiK causes additional dividend tax adjustment row to appear
**Behaviour:** User enters a P11D value large enough that total income + BiK
crosses the higher rate threshold, causing an "Additional dividend tax" row to
appear in the results.
**Lines covered:** `ResultsSection.tsx:271` (conditional BiK dividend tax row)

### O-6: Outside IR35 results using an older 19% corporation tax year (2022/23)
**Behaviour:** User selects a pre-2023 tax year where corporation tax is flat 19%,
not the 25% marginal relief rate. Corporation tax is calculated correctly.
**Lines covered:** `useCalculate.ts:53` (flat corporation tax path)

---

## Integration tests to add to `app/inside-ir35.test.tsx`

### I-1: Days mode toggle — switch to weekly, verify calculation uses weeks × days
**Behaviour:** User switches to "Weeks × days per week", enters 46 weeks and 5
days per week. The results match what 230 days produces in annual mode.
**Lines covered:** `InsideIR35Form.tsx:96-107` (weekly mode radio + inputs)

### I-2: Switch from Inside IR35 tab to Outside IR35 tab
**Behaviour:** From the Inside IR35 form, user clicks the "Outside IR35" tab.
The Inside IR35 form hides and the Outside IR35 form appears.
**Lines covered:** `page.tsx:34` (setActiveTab("outside") onClick) — if we decide
not to ignore this line

---

## Unit tests to add

### U-1: `constants.ts` — `asTaxYear` (if NOT ignored)
If we decide against the ignore, add a unit test file `constants.test.ts`:
- `asTaxYear("2026/27")` → `"2026/27"` (valid passthrough)
- `asTaxYear("invalid")` → `"2026/27"` (fallback)

---

## Component branch coverage via integration tests

These branches in UI components are covered indirectly when the above integration
tests render the full app. No dedicated component tests are needed.

| Component | Branch | Covered by |
|-----------|--------|-----------|
| `StatCard.tsx:16-31,38` | Non-accent variant | O-5 or O-6 — multi-director results render non-accent cards; alternatively any outside IR35 test with 2+ directors |
| `TextInput.tsx:17` | `additionalText` prop | Already rendered in the form — covered when the salary input renders with helper text |
| `TextInput.tsx:21` | `appendDouble` class | O-3 / O-4 — the dividend field with two buttons uses `appendDouble` |
| `ResultsSection.tsx:271` | BiK adjustment row | O-5 |

**StatCard non-accent variant note:** The non-accent `StatCard` is rendered in
`ResultsSection` when `numDirs > 1` (multiple directors). Adding a multi-director
scenario to any existing or new outside IR35 test will cover this. Test O-6 or a
variant of O-2 can use `numberOfDirectors: "2"` to trigger it.

---

## Threshold update

Once all tests are added and passing, raise thresholds in `vitest.config.mts`:

```ts
thresholds: {
  lines: 100,
  functions: 100,
  branches: 100,
  statements: 100,
},
```

---

## File targets

| File | Action |
|------|--------|
| `app/outside-ir35.test.tsx` | Add tests O-1 through O-6 |
| `app/inside-ir35.test.tsx` | Add tests I-1, I-2 |
| `constants.ts:17` | Add `/* v8 ignore next */` |
| `app/page.tsx:34` | Add `/* v8 ignore next */` (or cover with I-2) |
| `vitest.config.mts` | Raise thresholds to 100 after all tests pass |

---

## Order of implementation

1. Add `/* v8 ignore next */` to `constants.ts` and `page.tsx` (zero risk)
2. O-6 (19% tax year) — simplest integration test, validates corp tax path
3. O-1, I-1 (days mode toggle) — radio interaction, no calculation complexity
4. O-2, O-3, O-4 (button clicks) — setValue integration
5. O-5 (BiK dividend adjustment) — most complex scenario
6. I-2 (tab switch) — only needed if page.tsx:34 is not ignored
7. Raise thresholds to 100 in vitest config
