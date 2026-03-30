import { Taxes } from "../constants";
import { getDividendTaxes } from "./getDividendTaxes";
import { getStudentLoanRepayment } from "./getStudentLoanRepayment";

const CORPORATION_TAX_UPPER_LIMIT_POUNDS = 250000;
const CORPORATION_TAX_SMALL_PROFITS_LIMIT_POUNDS = 50000;
const CORPORATION_TAX_SMALL_PROFITS_RATE = 0.19;
const COMPLEX_CORP_TAX_PROFIT_MULTIPLIER = 0.25;
const COMPLEX_CORP_TAX_MARGINAL_RELIEF_MULTIPLIER = 3 / 200;

const INCOME_TAX_BASIC_RATE = 0.2;
const INCOME_TAX_HIGHER_RATE = 0.4;
const INCOME_TAX_ADDITIONAL_RATE = 0.45;

const getComplexCorporationTaxDue = (profit: number, taxes: Taxes): number => {
  if (profit >= CORPORATION_TAX_UPPER_LIMIT_POUNDS)
    return profit * (taxes.CORPORATION_TAX_PERCENTAGE / 100);

  if (profit <= CORPORATION_TAX_SMALL_PROFITS_LIMIT_POUNDS)
    return profit * CORPORATION_TAX_SMALL_PROFITS_RATE;

  const profitPlus25Percent = profit * COMPLEX_CORP_TAX_PROFIT_MULTIPLIER;
  const marginalRelief =
    (CORPORATION_TAX_UPPER_LIMIT_POUNDS - profit) *
    COMPLEX_CORP_TAX_MARGINAL_RELIEF_MULTIPLIER;
  return profitPlus25Percent - marginalRelief;
};

const getCorporationTaxDue = ({
  totalRevenue,
  totalExpenses,
  totalSalaryDrawdown,
  taxes,
}: {
  totalRevenue: number;
  totalExpenses: number;
  totalSalaryDrawdown: number;
  taxes: Taxes;
}): number => {
  const profit = totalRevenue - totalSalaryDrawdown - totalExpenses;
  if (taxes.CORPORATION_TAX_PERCENTAGE === 25)
    return getComplexCorporationTaxDue(profit / 100, taxes) * 100;
  return profit * (taxes.CORPORATION_TAX_PERCENTAGE / 100);
};

export const computeOutsideIR35 = ({
  numberOfDaysWorked,
  dailyRate,
  directorSalariesPence,
  numberOfDirectors,
  generalExpenses,
  pensionContributions,
  dividendDrawdown,
  directorEVP11dPence,
  directorLoanPlans,
  taxes,
}: {
  numberOfDaysWorked: number;
  dailyRate: number;
  directorSalariesPence: number[];
  numberOfDirectors: number;
  generalExpenses: number;
  pensionContributions: number;
  dividendDrawdown: number;
  directorEVP11dPence: number[];
  directorLoanPlans: string[];
  taxes: Taxes;
}) => {
  const {
    EV_BIK_RATE_PERCENTAGE,
    EMPLOYER_NI_RATE_PERCENTAGE,
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
    HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE,
    ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE,
    MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE,
  } = taxes;

  const syncedSalaries = Array.from(
    { length: numberOfDirectors },
    (_, i) => directorSalariesPence[i] ?? 0,
  );

  const totalSalaryDrawdown = syncedSalaries.reduce((s, v) => s + v, 0);
  const totalDividendDrawdown = dividendDrawdown * numberOfDirectors;
  const totalRevenue = numberOfDaysWorked * dailyRate;
  const totalExpenses = generalExpenses + pensionContributions;

  const corporationTaxDue = getCorporationTaxDue({
    totalRevenue,
    totalExpenses,
    totalSalaryDrawdown,
    taxes,
  });

  const maximumAllowableDividendDrawdown =
    (totalRevenue - corporationTaxDue - totalExpenses - totalSalaryDrawdown) /
    numberOfDirectors;

  const higherRateThreshold =
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE + HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE;

  // Per-director calculations — each uses their own salary
  const directorResults = syncedSalaries.map((salaryDrawdown, i) => {
    const totalIncomePence = salaryDrawdown + dividendDrawdown;

    const dividendTaxBreakdown = getDividendTaxes({
      dividendDrawdown,
      salaryDrawdown,
      taxes,
    });

    const effectivePersonalAllowancePence = Math.max(
      0,
      TAX_FREE_PERSONAL_ALLOWANCE_PENCE -
        Math.max(
          0,
          totalIncomePence - MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE,
        ) /
          2,
    );

    const maxTaxEfficientDividendPence = Math.min(
      Math.max(0, higherRateThreshold - salaryDrawdown),
      maximumAllowableDividendDrawdown,
    );

    const p11dPence = directorEVP11dPence[i] ?? 0;
    const bikValue = p11dPence * (EV_BIK_RATE_PERCENTAGE / 100);
    const bikStart = totalIncomePence;
    const bikEnd = totalIncomePence + bikValue;

    const bikInBasic = Math.max(
      0,
      Math.min(bikEnd, higherRateThreshold) -
        Math.max(bikStart, TAX_FREE_PERSONAL_ALLOWANCE_PENCE),
    );
    const bikInHigher = Math.max(
      0,
      Math.min(bikEnd, ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE) -
        Math.max(bikStart, higherRateThreshold),
    );
    const bikInAdditional = Math.max(
      0,
      bikEnd - Math.max(bikStart, ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE),
    );

    const incomeTaxOnBik =
      bikInBasic * INCOME_TAX_BASIC_RATE +
      bikInHigher * INCOME_TAX_HIGHER_RATE +
      bikInAdditional * INCOME_TAX_ADDITIONAL_RATE;

    const bik = {
      p11dPence,
      bikValue,
      incomeTaxOnBik,
      class1aNI: bikValue * (EMPLOYER_NI_RATE_PERCENTAGE / 100),
    };

    const dividendTaxAdjustment = (() => {
      if (bik.bikValue === 0) return 0;
      if (totalIncomePence + bik.bikValue <= higherRateThreshold) return 0;
      const withBiK = getDividendTaxes({
        dividendDrawdown,
        salaryDrawdown,
        additionalEmploymentIncome: bik.bikValue,
        taxes,
      });
      return Math.max(0, withBiK.total - dividendTaxBreakdown.total);
    })();

    const studentLoanRepayment = getStudentLoanRepayment({
      plan: directorLoanPlans[i] ?? "none",
      incomePence: totalIncomePence,
      taxes,
    });

    const afterTaxPay =
      dividendDrawdown + salaryDrawdown - dividendTaxBreakdown.total;

    return {
      salaryDrawdown,
      dividendTaxBreakdown,
      effectivePersonalAllowancePence,
      maxTaxEfficientDividendPence,
      bik,
      dividendTaxAdjustment,
      studentLoanRepayment,
      afterTaxPay,
      totalIncomePence,
    };
  });

  const highestSalaryIndex = syncedSalaries.reduce(
    (maxIdx, salary, i) => (salary > syncedSalaries[maxIdx] ? i : maxIdx),
    0,
  );
  const rep = directorResults[highestSalaryIndex];

  const directorTaxableIncome = directorResults.map(
    (d) =>
      d.salaryDrawdown +
      dividendDrawdown -
      taxes.DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
  );

  // Keep scalar for single-director display compatibility
  const totalTaxableIncome =
    rep.salaryDrawdown +
    dividendDrawdown -
    taxes.DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;

  const totalAfterTaxPay = directorResults.reduce(
    (sum, d) => sum + d.afterTaxPay,
    0,
  );

  const retainedProfits =
    totalRevenue -
    corporationTaxDue -
    totalSalaryDrawdown -
    totalExpenses -
    totalDividendDrawdown;

  const directorBiK = directorResults.map((d) => d.bik);
  const anyBiK = directorBiK.some((b) => b.p11dPence > 0);
  const totalClass1aNI = directorBiK.reduce((sum, b) => sum + b.class1aNI, 0);

  const studentLoanRepayments = directorResults.map(
    (d) => d.studentLoanRepayment,
  );
  const anyStudentLoan = studentLoanRepayments.some((r) => r > 0);

  const directorDividendTaxAdjustment = directorResults.map(
    (d) => d.dividendTaxAdjustment,
  );

  return {
    totalRevenue,
    totalTaxableIncome,
    directorTaxableIncome,
    corporationTaxDue,
    maximumAllowableDividendDrawdown,
    dividendTaxBreakdown: rep.dividendTaxBreakdown,
    directorDividendTaxBreakdown: directorResults.map(
      (d) => d.dividendTaxBreakdown,
    ),
    retainedProfits,
    totalAfterTaxPay,
    studentLoanRepayments,
    anyStudentLoan,
    effectivePersonalAllowancePence: rep.effectivePersonalAllowancePence,
    directorEffectivePersonalAllowancePence: directorResults.map(
      (d) => d.effectivePersonalAllowancePence,
    ),
    maxTaxEfficientDividendPence: rep.maxTaxEfficientDividendPence,
    directorBiK,
    anyBiK,
    totalClass1aNI,
    directorDividendTaxAdjustment,
    directorAfterTaxPay: directorResults.map((d) => d.afterTaxPay),
  };
};
