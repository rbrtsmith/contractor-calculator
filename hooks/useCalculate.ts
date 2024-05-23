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

const getComplexCorporationTaxDue = (profit: number, taxes: Taxes) => {
  const UPPER_LIMIT = 250000;
  const PROFIT_MULTIPLIER = 0.25;
  const MARGINAL_RATE_MULTIPLIER = 3 / 200;

  if (profit >= 250000) {
    return profit * (taxes.CORPORATION_TAX_PERCENTAGE / 100);
  }

  // step 1
  const profitPlus25Percent = profit * PROFIT_MULTIPLIER;

  // step 3
  const marginalReleif = (UPPER_LIMIT - profit) * MARGINAL_RATE_MULTIPLIER;

  // step 4
  const taxDue = profitPlus25Percent - marginalReleif;
  return taxDue;
};

const getCorportationTaxDue = ({
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
  const corporationTaxDue = getCorportationTaxDue({
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
