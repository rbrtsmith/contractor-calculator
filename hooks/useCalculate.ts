import { convertToPence, getDividendTaxes } from "../utils";
import { Taxes } from "../constants";

type Inputs = {
  numberOfDaysWorked: string;
  dailyRate: string;
  salaryDrawdown: string;
  numberOfDirectors: string;
  generalExpenses: string;
  pensionContributions: string;
  dividendDrawdown: string;
  taxes: Taxes;
};

const CORPORATION_TAX_UPPER_LIMIT_POUNDS = 250000;
const CORPORATION_TAX_SMALL_PROFITS_LIMIT_POUNDS = 50000;
const CORPORATION_TAX_SMALL_PROFITS_RATE = 0.19;
const COMPLEX_CORP_TAX_PROFIT_MULTIPLIER = 0.25;
const COMPLEX_CORP_TAX_MARGINAL_RELIEF_MULTIPLIER = 3 / 200;

const getComplexCorporationTaxDue = (profit: number, taxes: Taxes) => {
  if (profit >= CORPORATION_TAX_UPPER_LIMIT_POUNDS) {
    return profit * (taxes.CORPORATION_TAX_PERCENTAGE / 100);
  }

  if (profit <= CORPORATION_TAX_SMALL_PROFITS_LIMIT_POUNDS)
    return profit * CORPORATION_TAX_SMALL_PROFITS_RATE;

  const profitPlus25Percent = profit * COMPLEX_CORP_TAX_PROFIT_MULTIPLIER;
  const marginalReleif =
    (CORPORATION_TAX_UPPER_LIMIT_POUNDS - profit) *
    COMPLEX_CORP_TAX_MARGINAL_RELIEF_MULTIPLIER;

  const taxDue = profitPlus25Percent - marginalReleif;
  return taxDue;
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
}) => {
  const profit = totalRevenue - totalSalaryDrawdown - totalExpenses;
  if (taxes.CORPORATION_TAX_PERCENTAGE === 25) {
    return getComplexCorporationTaxDue(profit / 100, taxes) * 100;
  }
  return profit * (taxes.CORPORATION_TAX_PERCENTAGE / 100);
};

const getMaximumAllowableDividendDrawdown = ({
  totalRevenue,
  corporationTaxDue,
  numberOfDirectors,
  totalExpenses,
  totalSalaryDrawdown,
}: {
  totalRevenue: number;
  corporationTaxDue: number;
  numberOfDirectors: number;
  totalExpenses: number;
  totalSalaryDrawdown: number;
}) =>
  (totalRevenue - (corporationTaxDue + totalExpenses + totalSalaryDrawdown)) /
  numberOfDirectors;

const compute = ({
  numberOfDaysWorked,
  dailyRate,
  generalExpenses,
  pensionContributions,
  salaryDrawdown,
  dividendDrawdown,
  numberOfDirectors,
  taxes,
}: {
  numberOfDaysWorked: number;
  dailyRate: number;
  salaryDrawdown: number;
  numberOfDirectors: number;
  generalExpenses: number;
  pensionContributions: number;
  dividendDrawdown: number;
  taxes: Taxes;
}) => {
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

  const maximumAllowableDividendDrawdown = getMaximumAllowableDividendDrawdown({
    totalRevenue,
    corporationTaxDue,
    numberOfDirectors,
    totalExpenses,
    totalSalaryDrawdown,
  });

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
  // need to get loss of personal allowance…
  return {
    totalRevenue,
    totalTaxableIncome,
    corporationTaxDue,
    maximumAllowableDividendDrawdown,
    dividendTaxBreakdown,
    retainedProfits,
    totalAfterTaxPay,
  };
};

export const useCalculate = ({
  numberOfDaysWorked,
  dailyRate,
  generalExpenses,
  pensionContributions,
  salaryDrawdown,
  numberOfDirectors,
  dividendDrawdown,
  taxes,
}: Inputs) => {
  return compute({
    numberOfDaysWorked: Number(numberOfDaysWorked),
    numberOfDirectors: Number(numberOfDirectors),
    dailyRate: convertToPence(dailyRate),
    generalExpenses: convertToPence(generalExpenses),
    pensionContributions: convertToPence(pensionContributions),
    salaryDrawdown: convertToPence(salaryDrawdown),
    dividendDrawdown: convertToPence(dividendDrawdown),
    taxes,
  });
};
