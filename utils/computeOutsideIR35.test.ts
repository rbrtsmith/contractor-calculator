import { computeOutsideIR35 } from "./computeOutsideIR35";
import { TAXES } from "../constants";

const taxes = TAXES["2026/27"];

// Helper: converts £ to pence
const p = (pounds: number) => pounds * 100;

describe("computeOutsideIR35", () => {
  it("gross revenue = days × daily rate", () => {
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: p(25000),
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    expect(result.totalRevenue).toBe(200 * p(500));
  });

  it("2026/27 marginal relief corp tax — profit £87,436 (between £50k and £250k)", () => {
    // 200 days × £500 = £100,000. Salary £12,564. No expenses.
    // Profit = £100,000 − £12,564 = £87,436. 25% marginal relief applies.
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: p(25000),
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    // Corp tax with marginal relief — not the flat 19% small profits rate
    expect(result.corporationTaxDue).toBeGreaterThan(p(87436) * 0.19);
    expect(result.corporationTaxDue).toBeLessThan(p(87436) * 0.25);
  });

  it("2022/23 flat 19% corp tax — profit below £250k uses flat rate", () => {
    // 2022/23 uses flat 19% for all profit levels
    const taxes2223 = TAXES["2022/23"];
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes: taxes2223,
    });

    // Profit = £100,000 − £12,564 = £87,436. Flat 19%.
    expect(result.corporationTaxDue).toBeCloseTo(p(87436) * 0.19, 0);
  });

  it("maximum allowable dividend equals retained profits after corp tax divided by directors", () => {
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564), p(12564)],
      numberOfDirectors: 2,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [0, 0],
      directorLoanPlans: [[], []],
      taxes,
    });

    expect(result.maximumAllowableDividendDrawdown).toBeGreaterThan(0);
    // Two directors split profits equally
    const totalProfitAfterTax =
      result.totalRevenue - result.corporationTaxDue - p(12564) * 2;
    expect(result.maximumAllowableDividendDrawdown).toBeCloseTo(
      totalProfitAfterTax / 2,
      0,
    );
  });

  it("BiK value = P11D × BiK rate percentage", () => {
    // 2026/27 EV BiK rate = 4%
    const result = computeOutsideIR35({
      numberOfDaysWorked: 100,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [p(50000)],
      directorLoanPlans: [[]],
      taxes,
    });

    expect(result.directorBiK[0].bikValue).toBe(p(50000) * (4 / 100));
  });

  it("BiK within basic rate band — no dividend tax adjustment", () => {
    // Salary £12,564 + dividends £20,000 + BiK £2,000 = £34,564 — below higher rate threshold £50,270
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: p(20000),
      directorEVP11dPence: [p(50000)], // BiK = £2,000
      directorLoanPlans: [[]],
      taxes,
    });

    expect(result.directorDividendTaxAdjustment[0]).toBe(0);
  });

  it("BiK crossing higher rate — dividend tax adjustment is positive", () => {
    // Salary £12,564 + dividends £20,000 + BiK £40,000 = £72,564 — above higher rate threshold
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: p(20000),
      directorEVP11dPence: [p(1000000)], // BiK = £40,000
      directorLoanPlans: [[]],
      taxes,
    });

    expect(result.directorDividendTaxAdjustment[0]).toBeGreaterThan(0);
  });

  it("student loan plan 2 repayment included", () => {
    // Salary £12,564 + dividends £30,000 = £42,564. Plan 2 threshold £27,295. Repayment 9% of excess.
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: p(30000),
      directorEVP11dPence: [0],
      directorLoanPlans: [["plan2"]],
      taxes,
    });

    expect(result.studentLoanRepayments[0]).toBeGreaterThan(0);
    expect(result.anyStudentLoan).toBe(true);
  });

  it("no student loan when plan is none", () => {
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: p(30000),
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    expect(result.studentLoanRepayments[0]).toBe(0);
    expect(result.anyStudentLoan).toBe(false);
  });

  it("salary above personal allowance — directorSalaryIncomeTax returned and anySalaryIncomeTax true", () => {
    // Salary £20,000. PA £12,570. Taxable salary = £7,430. Income tax = £7,430 × 20% = £1,486.
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(20000)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    const taxableSalary = p(20000) - taxes.TAX_FREE_PERSONAL_ALLOWANCE_PENCE;
    expect(result.directorSalaryIncomeTax[0]).toBeCloseTo(
      taxableSalary * 0.2,
      0,
    );
    expect(result.anySalaryIncomeTax).toBe(true);
  });

  it("salary at or below personal allowance — anySalaryIncomeTax is false", () => {
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    expect(result.directorSalaryIncomeTax[0]).toBe(0);
    expect(result.anySalaryIncomeTax).toBe(false);
  });

  it("maximumSalaryPerDirectorPence = (revenue − expenses) / numDirs", () => {
    // Revenue £100,000, expenses £5,000, pension £3,000, 2 directors
    // Max salary per director = (£100,000 − £5,000 − £3,000) / 2 = £46,000
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12564), p(12564)],
      numberOfDirectors: 2,
      generalExpenses: p(5000),
      pensionContributions: p(3000),
      dividendDrawdown: 0,
      directorEVP11dPence: [0, 0],
      directorLoanPlans: [[], []],
      taxes,
    });

    expect(result.maximumSalaryPerDirectorPence).toBe(p(46000));
  });

  it("salary above personal allowance incurs income tax deducted from net pay", () => {
    // Salary £20,000. Personal allowance £12,570. Taxable salary = £7,430. Income tax = £7,430 × 20% = £1,486.
    // No dividends, so net pay = £20,000 − £1,486 = £18,514.
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(20000)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    const taxableSalary = p(20000) - taxes.TAX_FREE_PERSONAL_ALLOWANCE_PENCE;
    const expectedIncomeTax = taxableSalary * 0.2;
    const expectedNetPay = p(20000) - expectedIncomeTax;
    expect(result.directorAfterTaxPay[0]).toBeCloseTo(expectedNetPay, 0);
  });

  it("salary at personal allowance — no income tax on salary", () => {
    // Salary exactly at £12,570 personal allowance — no income tax on salary
    const result = computeOutsideIR35({
      numberOfDaysWorked: 200,
      dailyRate: p(500),
      directorSalariesPence: [p(12570)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    expect(result.directorAfterTaxPay[0]).toBe(p(12570));
  });

  it("maxTaxEfficientDividendPence caps at higher rate threshold", () => {
    // With salary at max (£12,564), max efficient dividend = £50,270 − £12,564 = £37,706
    // capped by available profit
    const result = computeOutsideIR35({
      numberOfDaysWorked: 400,
      dailyRate: p(1000),
      directorSalariesPence: [p(12564)],
      numberOfDirectors: 1,
      generalExpenses: 0,
      pensionContributions: 0,
      dividendDrawdown: 0,
      directorEVP11dPence: [0],
      directorLoanPlans: [[]],
      taxes,
    });

    const higherRateThreshold =
      taxes.TAX_FREE_PERSONAL_ALLOWANCE_PENCE +
      taxes.HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE;
    const expectedCap = higherRateThreshold - p(12564);
    expect(result.maxTaxEfficientDividendPence).toBeLessThanOrEqual(
      expectedCap,
    );
  });
});
