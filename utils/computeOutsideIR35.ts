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
  salaryDrawdown,
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
  salaryDrawdown: number;
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

  const totalSalaryDrawdown = salaryDrawdown * numberOfDirectors;
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

  const totalTaxableIncome =
    salaryDrawdown + dividendDrawdown - taxes.DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;

  const dividendTaxBreakdown = getDividendTaxes({
    dividendDrawdown,
    salaryDrawdown,
    taxes,
  });

  const retainedProfits =
    totalRevenue -
    corporationTaxDue -
    totalSalaryDrawdown -
    totalExpenses -
    totalDividendDrawdown;

  const totalAfterTaxPay =
    dividendDrawdown + salaryDrawdown - dividendTaxBreakdown.total;

  const incomePerDirectorPence = salaryDrawdown + dividendDrawdown;

  const studentLoanRepayments = directorLoanPlans.map((plan) =>
    getStudentLoanRepayment({
      plan,
      incomePence: incomePerDirectorPence,
      taxes,
    }),
  );
  const anyStudentLoan = studentLoanRepayments.some((r) => r > 0);

  const totalIncomePence = salaryDrawdown + dividendDrawdown;
  const effectivePersonalAllowancePence = Math.max(
    0,
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE -
      Math.max(
        0,
        totalIncomePence - MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE,
      ) /
        2,
  );

  const higherRateThreshold =
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE + HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE;

  const maxTaxEfficientDividendPence = Math.min(
    Math.max(0, higherRateThreshold - salaryDrawdown),
    maximumAllowableDividendDrawdown,
  );

  const directorBiK = directorEVP11dPence.map((p11dPence) => {
    const bikValue = p11dPence * (EV_BIK_RATE_PERCENTAGE / 100);
    const bikStart = salaryDrawdown;
    const bikEnd = salaryDrawdown + bikValue;

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

    return {
      p11dPence,
      bikValue,
      incomeTaxOnBik,
      class1aNI: bikValue * (EMPLOYER_NI_RATE_PERCENTAGE / 100),
    };
  });

  const anyBiK = directorBiK.some((b) => b.p11dPence > 0);
  const totalClass1aNI = directorBiK.reduce((sum, b) => sum + b.class1aNI, 0);

  const directorDividendTaxAdjustment = directorBiK.map((bik) => {
    if (bik.bikValue === 0) return 0;
    if (totalIncomePence + bik.bikValue <= higherRateThreshold) return 0;
    const withBiK = getDividendTaxes({
      dividendDrawdown,
      salaryDrawdown,
      additionalEmploymentIncome: bik.bikValue,
      taxes,
    });
    return Math.max(0, withBiK.total - dividendTaxBreakdown.total);
  });

  return {
    totalRevenue,
    totalTaxableIncome,
    corporationTaxDue,
    maximumAllowableDividendDrawdown,
    dividendTaxBreakdown,
    retainedProfits,
    totalAfterTaxPay,
    studentLoanRepayments,
    anyStudentLoan,
    effectivePersonalAllowancePence,
    maxTaxEfficientDividendPence,
    directorBiK,
    anyBiK,
    totalClass1aNI,
    directorDividendTaxAdjustment,
  };
};
