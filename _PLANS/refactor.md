# Contractor Calculator — Codebase Refactoring Plan

## Context

The codebase is functionally solid with good test coverage (integration tests via Vitest + Testing Library), TypeScript strict mode, and a clean CI pipeline. However, it has accumulated code quality issues that violate the project's own principles: magic numbers, `as any` type casts, duplicated business logic, oversized files mixing UI with calculations, and dead code.

Goal: Improve code quality **with zero visual changes** to the frontend. All existing tests must continue passing throughout. Every change follows TDD (write/update tests first).

---

## Phase 1 — Quick Wins (Low risk, purely additive or deletive)

### 1.1 Remove dead code from `constants.ts`
- **What:** Delete lines 170–185 (commented-out corporation tax scratch calculations)
- **Test first:** None needed — this is dead code; existing tests will confirm nothing breaks
- **Files:** `constants.ts`

### 1.2 Extract shared `TAX_YEARS` constant
- **What:** Both `app/page.tsx:10-17` and `components/InsideIR35Form.tsx:9-16` define an identical `taxYears` array. Move it to `constants.ts` and import it in both places.
- **Test first:** Existing integration tests cover both forms — they will catch any regression
- **Files:** `constants.ts`, `app/page.tsx`, `components/InsideIR35Form.tsx`

### 1.3 Fix typo in `useCalculate.ts`
- **What:** `getCorportationTaxDue` → `getCorporationTaxDue` (line 37)
- **Test first:** Existing outside IR35 tests cover this path
- **Files:** `hooks/useCalculate.ts`

---

## Phase 2 — Type Safety (Medium risk)

### 2.1 Fix the three `as any as React.FormEvent` casts in `page.tsx`
- **What:** Lines 431, 469, 488 synthesize fake event objects to call `handleChange`. Fix by updating `useForm` to expose a `setValue(name, value)` function alongside the change handler, so button clicks can set values without constructing a fake event.
- **Approach:** Add `setValue: (name: keyof Values, value: string) => void` to `useForm`'s return tuple. Replace all three synthetic event constructions with direct calls.
- **Test first:** Add a unit test for `useForm` covering `setValue` behavior before implementing
- **Files:** `hooks/useForm.ts`, `app/page.tsx`

### 2.2 Tighten `useForm` types
- **What:** `type Values = { [key: string]: string }` loses all field-name safety. Make `useForm` generic: `useForm<T extends Record<string, string>>(initialValues: T)` so TypeScript catches unknown field names.
- **Test first:** Existing integration tests will catch regressions
- **Files:** `hooks/useForm.ts`, `app/page.tsx`, `components/InsideIR35Form.tsx`

### 2.3 Fix `computeInsideIR35` taxes parameter type
- **What:** `taxes: (typeof TAXES)[string]` (InsideIR35Form.tsx:40) is an unsafe inference. Replace with the already-exported `Taxes` type.
- **Test first:** Existing inside IR35 tests cover this
- **Files:** `components/InsideIR35Form.tsx`

---

## Phase 3 — Extract Shared Business Logic (Medium-High risk)

### 3.1 Extract `getStudentLoanRepayment` to a shared util
- **What:** Identical student loan calculation logic exists in `app/page.tsx:108-116` and `components/InsideIR35Form.tsx:257-264`. Extract to `utils/getStudentLoanRepayment.ts`.

```ts
// utils/getStudentLoanRepayment.ts
export const getStudentLoanRepayment = ({
  plan,
  incomePence,
  taxes,
}: {
  plan: string;
  incomePence: number;
  taxes: Taxes;
}): number => { ... }
```

- **Test first:** Write unit tests covering: plan "none" returns 0, plan1 below threshold returns 0, plan1 above threshold returns correct amount, plan2 above threshold returns correct amount.
- **Files:** `utils/getStudentLoanRepayment.ts` (new), `utils/index.ts`, `app/page.tsx`, `components/InsideIR35Form.tsx`

### 3.2 Add named constants for magic numbers in `InsideIR35Form.tsx` and `page.tsx`
- **What:**
  - `InsideIR35Form.tsx:113` — `0.02` (secondary NI rate) → `EMPLOYEE_NI_SECONDARY_RATE = 0.02`
  - `app/page.tsx:157` — `0.2`, `0.4`, `0.45` (BiK income tax rates) → named constants local to that file
- **Test first:** Existing tests exercise these paths; confirm they still pass after rename
- **Files:** `components/InsideIR35Form.tsx`, `app/page.tsx`

### 3.3 Add named constants in `useCalculate.ts`
- **What:** Module-level named constants for:
  - `CORPORATION_TAX_SMALL_PROFITS_RATE = 0.19` (line 24)
  - `CORPORATION_TAX_UPPER_LIMIT_POUNDS = 250000` (lines 16, 20)
- **Test first:** Existing outside IR35 tests cover corp tax paths
- **Files:** `hooks/useCalculate.ts`

---

## Phase 4 — Extract `computeInsideIR35` to a Util (Higher risk)

### 4.1 Move `computeInsideIR35` out of the component file
- **What:** The pure calculation function `computeInsideIR35` (InsideIR35Form.tsx:29-128) is business logic living in a component file. Extract it as a pure function to `utils/computeInsideIR35.ts`, then import it from `InsideIR35Form`.
- **Test first:** Write dedicated unit tests for `computeInsideIR35` before moving it (basic rate, higher rate, tapered personal allowance cases). These complement the existing integration tests.
- **Files:** `utils/computeInsideIR35.ts` (new), `utils/index.ts`, `components/InsideIR35Form.tsx`

---

## Phase 5 — Extract Inline Components (Low risk, purely structural)

### 5.1 Extract `StatCard`, `SectionCard`, `Row` to separate component files
- **What:** Three presentational components are defined inline in `InsideIR35Form.tsx:130-217`. Extract each to `components/StatCard.tsx`, `components/SectionCard.tsx`, `components/Row.tsx`. Export from `components/index.ts`.
- No logic changes — purely moving component definitions.
- **Test first:** Existing integration tests render these components indirectly; they will catch regressions
- **Files:** `components/StatCard.tsx`, `components/SectionCard.tsx`, `components/Row.tsx` (new), `components/index.ts`, `components/InsideIR35Form.tsx`

---

## Critical Files

| File | Changes |
|------|---------|
| `constants.ts` | Remove dead code, add `TAX_YEARS` export |
| `hooks/useForm.ts` | Add generic type param, add `setValue` |
| `hooks/useCalculate.ts` | Fix typo, add named constants |
| `app/page.tsx` | Use `TAX_YEARS`, use `setValue`, add named constants for BiK rates |
| `components/InsideIR35Form.tsx` | Use `TAX_YEARS`, fix `Taxes` type, use shared student loan util, extract inline components |
| `utils/getStudentLoanRepayment.ts` | New shared utility |
| `utils/computeInsideIR35.ts` | Extracted pure function |
| `components/StatCard.tsx` | Extracted component |
| `components/SectionCard.tsx` | Extracted component |
| `components/Row.tsx` | Extracted component |

---

## Reusable Existing Patterns

- `convertToPence` / `convertToPounds` in `utils/` — use these, don't inline conversion logic
- `Taxes` type from `constants.ts` — use explicitly, not `(typeof TAXES)[string]`
- `useForm` hook — extend rather than replace
- Existing test helpers `setupInsideIR35()` and `setupOutsideIR35()` in test files — do not change their signatures

---

## Ordering (Safest-first)

1. Phase 1 (dead code, shared constant, typo fix) — zero risk
2. Phase 2.3 (fix Taxes type) — trivial
3. Phase 3.2 + 3.3 (named constants) — rename only, no logic change
4. Phase 3.1 (extract student loan util) — new util with new unit tests
5. Phase 2.1 + 2.2 (fix useForm) — extend the hook, then update callers
6. Phase 4 (extract computeInsideIR35) — pure function extraction with new unit tests
7. Phase 5 (extract inline components) — structural only, no logic

---

## Verification

After each phase:
- `pnpm test` — all existing integration tests pass
- `pnpm run build` (tsc + next build) — no type errors
- `pnpm run lint` — no lint errors
- Manual visual check: open the app in browser, confirm no UI differences between tabs

Final gate: run full CI pipeline (`lint` → `tsc --noEmit` → `vitest run`) all green.
