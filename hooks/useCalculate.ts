import { convertToPence, getDividendTaxes } from "../utils";
import {
  CORPORATION_TAX_PERCENTAGE,
  HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE,
  ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE,
  TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
  MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE,
  DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
} from "../constants";

type Inputs = {
  numberOfDaysWorked: string;
  dailyRate: string;
  salaryDrawdown: string;
  numberOfDirectors: string;
  generalExpenses: string;
  pensionContributions: string;
  dividendDrawdown: string;
};

const getTotalRevenue = (numberOfDaysWorked: number, dailyRate: number) => {
  return numberOfDaysWorked * dailyRate;
};

const getCorportationTaxDue = ({
  totalRevenue,
  totalExpenses,
  totalSalaryDrawdown,
}: {
  totalRevenue: number;
  totalExpenses: number;
  totalSalaryDrawdown: number;
}) => {
  const amountTaxable = totalRevenue - totalSalaryDrawdown - totalExpenses;
  return amountTaxable * (CORPORATION_TAX_PERCENTAGE / 100);
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

const getTaxBandDividendEarnings = ({
  dividendDrawdown,
  salaryDrawdown,
}: {
  dividendDrawdown: number;
  salaryDrawdown: number;
}) => {
  const totalEarnings = salaryDrawdown + dividendDrawdown;
  const totalTaxableIncome =
    salaryDrawdown + dividendDrawdown - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
  if (totalEarnings <= TAX_FREE_PERSONAL_ALLOWANCE_PENCE) {
    return {
      basicRateEarnings: 0,
      higherRateEarnings: 0,
      additionalRateEarnings: 0,
    };
  }

  if (
    totalEarnings <
    HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE + TAX_FREE_PERSONAL_ALLOWANCE_PENCE
  ) {
    return {
      basicRateEarnings: totalTaxableIncome - TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
      higherRateEarnings: 0,
      additionalRateEarnings: 0,
    };
  }

  if (totalEarnings < MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE) {
    const amountBasic =
      HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
    const amountHigher =
      totalEarnings -
      (HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE + TAX_FREE_PERSONAL_ALLOWANCE_PENCE);
    return {
      basicRateEarnings: amountBasic,
      higherRateEarnings: amountHigher,
      additionalRateEarnings: 0,
    };
  }

  if (
    totalEarnings <
    ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE + TAX_FREE_PERSONAL_ALLOWANCE_PENCE
  ) {
    // over 100k, need to deduct personal allowance £2 for every £1 over
    const amountOver100K =
      totalEarnings - MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE;
    const newTaxFreePersonalAllowancePence =
      TAX_FREE_PERSONAL_ALLOWANCE_PENCE - amountOver100K;
    // console.log("amountOver100K", amountOver100K / 100);
    // console.log(
    //   "newTaxFreePersonalAllowancePence",
    //   newTaxFreePersonalAllowancePence / 100
    // );
    // const amountBasic = 0;
    // const amountHigher = 0;
    const amountBasic =
      HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
    const amountHigher =
      totalEarnings -
      (HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE + TAX_FREE_PERSONAL_ALLOWANCE_PENCE);
    // out by £16.25 on £100 over
    // out by £33.25 on £200 over
    return {
      basicRateEarnings: amountBasic,
      higherRateEarnings: amountHigher,
      additionalRateEarnings: 0,
    };
  }

  return {
    basicRateEarnings: 90000000,
    higherRateEarnings: 90000000,
    additionalRateEarnings: 90000000,
  };
  // if (
  //   dividendDrawdown < BASIC_DIVIDEND_TAX_BAND_THRESHOLD_PENCE ||
  //   totalEarnings < PERSONAL_ALLOWANCE_PENCE
  // ) {
  //   return {
  //     basicRateEarnings: 0,
  //     higherRateEarnings: 0,
  //     additionalRateEarnings: 0,
  //   };
  // }

  // if (totalEarnings < HIGHER_DIVIDEND_TAX_BAND_THRESHOLD_PENCE) {
  //   return {
  //     basicRateEarnings:
  //       dividendDrawdown - BASIC_DIVIDEND_TAX_BAND_THRESHOLD_PENCE,
  //     higherRateEarnings: 0,
  //     additionalRateEarnings: 0,
  //   };
  // }

  // const basicRateEarnings =
  //   HIGHER_DIVIDEND_TAX_BAND_THRESHOLD_PENCE -
  //   DIVIDEND_TAX_FREE_ALLOWANCE_PENCE -
  //   salaryDrawdown;

  // if (totalEarnings < ADDITIONAL_DIVIDEND_TAX_BAND_THRESHOLD_PENCE) {
  //   return {
  //     basicRateEarnings,
  //     higherRateEarnings:
  //       dividendDrawdown -
  //       basicRateEarnings -
  //       DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
  //     additionalRateEarnings: 0,
  //   };
  // }

  // const higherRateEarnings =
  //   ADDITIONAL_DIVIDEND_TAX_BAND_THRESHOLD_PENCE -
  //   basicRateEarnings -
  //   DIVIDEND_TAX_FREE_ALLOWANCE_PENCE -
  //   salaryDrawdown;

  // return {
  //   basicRateEarnings,
  //   higherRateEarnings,
  //   additionalRateEarnings:
  //     dividendDrawdown -
  //     higherRateEarnings -
  //     basicRateEarnings -
  //     DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
  // };
};

// const getDividendTaxes = ({
//   dividendDrawdown,
//   salaryDrawdown,
// }: {
//   dividendDrawdown: number;
//   salaryDrawdown: number;
// }) => {
//   const { basicRateEarnings, higherRateEarnings, additionalRateEarnings } =
//     getTaxBandDividendEarnings({
//       dividendDrawdown,
//       salaryDrawdown,
//     });

//   const basic = basicRateEarnings * (BASIC_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
//   const higher =
//     higherRateEarnings * (HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
//   const additional =
//     additionalRateEarnings * (ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
//   const total = basic + higher + additional;

//   return {
//     basic,
//     higher,
//     additional,
//     total,
//   };
// };

const compute = ({
  numberOfDaysWorked,
  dailyRate,
  generalExpenses,
  pensionContributions,
  salaryDrawdown,
  dividendDrawdown,
  numberOfDirectors,
}: {
  numberOfDaysWorked: number;
  dailyRate: number;
  salaryDrawdown: number;
  numberOfDirectors: number;
  generalExpenses: number;
  pensionContributions: number;
  dividendDrawdown: number;
}) => {
  const totalSalaryDrawdown = salaryDrawdown * numberOfDirectors;
  const totalDividendDrawdown = dividendDrawdown * numberOfDirectors;
  const totalRevenue = numberOfDaysWorked * dailyRate;
  // const totalExpenses =
  //   salaryDrawdown * numberOfDirectors + generalExpenses + pensionContributions;
  const totalExpenses = generalExpenses + pensionContributions;
  const corporationTaxDue = getCorportationTaxDue({
    totalRevenue,
    totalExpenses,
    totalSalaryDrawdown,
  });

  const maximumAllowableDividendDrawdown = getMaximumAllowableDividendDrawdown({
    totalRevenue,
    corporationTaxDue,
    numberOfDirectors,
    totalExpenses,
    totalSalaryDrawdown,
  });

  const totalTaxableIncome =
    salaryDrawdown + dividendDrawdown - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;

  const dividendTaxBreakdown = getDividendTaxes({
    dividendDrawdown,
    salaryDrawdown,
  });

  const retainedProfits =
    totalRevenue -
    corporationTaxDue -
    totalSalaryDrawdown -
    totalExpenses -
    totalDividendDrawdown;

  const getRemainingTaxFreeAllowance = () => {};

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
}: Inputs) => {
  return compute({
    numberOfDaysWorked: Number(numberOfDaysWorked),
    numberOfDirectors: Number(numberOfDirectors),
    dailyRate: convertToPence(dailyRate),
    generalExpenses: convertToPence(generalExpenses),
    pensionContributions: convertToPence(pensionContributions),
    salaryDrawdown: convertToPence(salaryDrawdown),
    dividendDrawdown: convertToPence(dividendDrawdown),
  });
};
