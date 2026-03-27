import { computeInsideIR35 } from "./computeInsideIR35";
import { TAXES } from "../constants";

const taxes = TAXES["2026/27"];

// Helper: converts £ to pence
const p = (pounds: number) => pounds * 100;

describe("computeInsideIR35", () => {
  it("basic rate only — 100 days at £250/day gives income below higher rate threshold", () => {
    // 100 × £250 = £25,000 gross — comfortably below £50,270 higher rate threshold
    const result = computeInsideIR35({
      numberOfDaysWorked: 100,
      dailyRate: p(250),
      expenses: 0,
      pensionContributions: 0,
      taxes,
    });

    expect(result.grossContractValue).toBe(100 * p(250));
    expect(result.employerNI).toBeGreaterThan(0);
    expect(result.grossSalary).toBeGreaterThan(0);
    expect(result.incomeTaxBreakdown.higher).toBe(0);
    expect(result.incomeTaxBreakdown.additional).toBe(0);
    expect(result.incomeTaxBreakdown.basic).toBeGreaterThan(0);
    expect(result.netPay).toBe(
      result.grossSalary - result.incomeTax - result.employeeNI,
    );
  });

  it("higher rate — 230 days at £250/day crosses higher rate threshold", () => {
    // 230 × £250 = £57,500 gross — above £50,270 higher rate threshold
    const result = computeInsideIR35({
      numberOfDaysWorked: 230,
      dailyRate: p(250),
      expenses: 0,
      pensionContributions: 0,
      taxes,
    });

    expect(result.incomeTaxBreakdown.higher).toBeGreaterThan(0);
    expect(result.incomeTaxBreakdown.additional).toBe(0);
  });

  it("tapered personal allowance — income over £100k reduces personal allowance", () => {
    // 230 × £600 = £138,000 gross — personal allowance fully tapered above £125,140
    const result = computeInsideIR35({
      numberOfDaysWorked: 230,
      dailyRate: p(600),
      expenses: 0,
      pensionContributions: 0,
      taxes,
    });

    expect(result.incomeTaxBreakdown.higher).toBeGreaterThan(0);
    expect(result.grossSalary).toBeGreaterThan(0);
  });

  it("additional rate — income above additional rate threshold", () => {
    // 400 × £500 = £200,000 gross — above £125,140 additional rate threshold
    const result = computeInsideIR35({
      numberOfDaysWorked: 400,
      dailyRate: p(500),
      expenses: 0,
      pensionContributions: 0,
      taxes,
    });

    expect(result.incomeTaxBreakdown.additional).toBeGreaterThan(0);
  });

  it("expenses reduce gross salary", () => {
    const withoutExpenses = computeInsideIR35({
      numberOfDaysWorked: 230,
      dailyRate: p(600),
      expenses: 0,
      pensionContributions: 0,
      taxes,
    });
    const withExpenses = computeInsideIR35({
      numberOfDaysWorked: 230,
      dailyRate: p(600),
      expenses: p(1200),
      pensionContributions: 0,
      taxes,
    });

    expect(withExpenses.grossSalary).toBeLessThan(withoutExpenses.grossSalary);
  });

  it("pension contributions reduce gross salary", () => {
    const withoutPension = computeInsideIR35({
      numberOfDaysWorked: 230,
      dailyRate: p(600),
      expenses: 0,
      pensionContributions: 0,
      taxes,
    });
    const withPension = computeInsideIR35({
      numberOfDaysWorked: 230,
      dailyRate: p(600),
      expenses: 0,
      pensionContributions: p(5000),
      taxes,
    });

    expect(withPension.grossSalary).toBeLessThan(withoutPension.grossSalary);
  });

  it("netPay equals grossSalary minus incomeTax minus employeeNI", () => {
    const result = computeInsideIR35({
      numberOfDaysWorked: 180,
      dailyRate: p(450),
      expenses: 0,
      pensionContributions: 0,
      taxes,
    });

    expect(result.netPay).toBeCloseTo(
      result.grossSalary - result.incomeTax - result.employeeNI,
    );
  });
});
