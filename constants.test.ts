import { asTaxYear, TAX_YEARS } from "./constants";

test("asTaxYear: returns valid tax year unchanged", () => {
  expect(asTaxYear("2026/27")).toBe("2026/27");
});

test("asTaxYear: returns latest tax year for invalid input", () => {
  expect(asTaxYear("invalid")).toBe(TAX_YEARS[TAX_YEARS.length - 1]);
});
