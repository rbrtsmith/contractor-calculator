import { Taxes } from "../constants";

export const getDividendTaxes = ({
  dividendDrawdown,
  salaryDrawdown,
  additionalEmploymentIncome = 0,
  taxes,
}: {
  dividendDrawdown: number;
  salaryDrawdown: number;
  additionalEmploymentIncome?: number;
  taxes: Taxes;
}) => {
  const {
    DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
    HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE,
    BASIC_DIVIDEND_TAX_RATE_PERCENTAGE,
    HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE,
    ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE,
    MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE,
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
    ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE,
  } = taxes;

  // BiK (additionalEmploymentIncome) is non-savings income, stacks before dividends
  const totalIncome = salaryDrawdown + additionalEmploymentIncome + dividendDrawdown;

  // Personal allowance, tapered by £1 for every £2 over £100k
  const amountOver100k = totalIncome - MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE;
  const personalAllowance =
    amountOver100k <= 0
      ? TAX_FREE_PERSONAL_ALLOWANCE_PENCE
      : Math.max(0, TAX_FREE_PERSONAL_ALLOWANCE_PENCE - amountOver100k / 2);

  // Tax-free dividends = any personal allowance remaining after salary + BiK + dividend allowance
  const personalAllowanceForDividends = Math.max(
    0,
    personalAllowance - salaryDrawdown - additionalEmploymentIncome,
  );
  const taxFreeDividends = personalAllowanceForDividends + DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
  const taxableDividends = Math.max(0, dividendDrawdown - taxFreeDividends);

  if (taxableDividends === 0) {
    return { basic: 0, higher: 0, additional: 0, total: 0 };
  }

  // Income thresholds (total income basis)
  const higherRateThreshold =
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE + HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE; // £50,270

  // Split taxable dividends across rate bands using total income position
  const inAdditionalRate = Math.min(
    taxableDividends,
    Math.max(0, totalIncome - ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE)
  );
  const inHigherRateAndAbove = Math.max(0, totalIncome - higherRateThreshold);
  const inHigherRate = Math.min(
    taxableDividends - inAdditionalRate,
    Math.max(0, inHigherRateAndAbove - inAdditionalRate)
  );
  const inBasicRate = taxableDividends - inAdditionalRate - inHigherRate;

  const basicTax = inBasicRate * (BASIC_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
  const higherTax = inHigherRate * (HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
  const additionalTax = inAdditionalRate * (ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE / 100);

  return {
    basic: basicTax,
    higher: higherTax,
    additional: additionalTax,
    total: basicTax + higherTax + additionalTax,
  };
};
