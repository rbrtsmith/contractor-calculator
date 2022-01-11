import { Taxes } from "../constants";

export const getDividendTaxes = ({
  dividendDrawdown,
  salaryDrawdown,
  taxes,
}: {
  dividendDrawdown: number;
  salaryDrawdown: number;
  taxes: Taxes;
}) => {
  const {
    DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
    HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE,
    BASIC_DIVIDEND_TAX_RATE_PERCENTAGE,
    HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE,
    MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE,
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
    ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE,
  } = taxes;

  const getAmountOfPersonalAllowanceLeft = (
    dividendDrawdown: number,
    salaryDrawdown: number
  ) => {
    const amountOver100k =
      dividendDrawdown +
      salaryDrawdown -
      MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE;

    if (amountOver100k <= 0) {
      return TAX_FREE_PERSONAL_ALLOWANCE_PENCE - salaryDrawdown;
    }

    const amountOfPersonalAllowanceLeft =
      TAX_FREE_PERSONAL_ALLOWANCE_PENCE - amountOver100k / 2 - salaryDrawdown;

    return amountOfPersonalAllowanceLeft > 0
      ? amountOfPersonalAllowanceLeft
      : 0;
  };

  const amountOfPersonalAllowanceLeft = getAmountOfPersonalAllowanceLeft(
    dividendDrawdown,
    salaryDrawdown
  );

  const taxFreeDividendsLeft =
    amountOfPersonalAllowanceLeft + DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
  const taxableDividends =
    dividendDrawdown - taxFreeDividendsLeft < 0
      ? 0
      : dividendDrawdown - taxFreeDividendsLeft;

  if (taxableDividends === 0) {
    return {
      basic: 0,
      higher: 0,
      additional: 0,
      total: 0,
    };
  }
  if (
    taxableDividends <=
    HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE
  ) {
    // below higher rate tax threshold
    const taxToPay =
      taxableDividends * (BASIC_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
    return {
      basic: taxToPay,
      higher: 0,
      additional: 0,
      total: taxToPay,
    };
  }

  const amountOverFullPersonalAllowanceThreshold =
    salaryDrawdown +
    dividendDrawdown -
    MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE;
  if (amountOfPersonalAllowanceLeft > 0) {
    // higher rate threshold but with personal allowance remaining
    const amountAtLowerRate =
      HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
    const amountAthigherRate = taxableDividends - amountAtLowerRate;
    const lowerTaxToPay =
      amountAtLowerRate * (BASIC_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
    const higherTaxToPay =
      amountAthigherRate * (HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
    return {
      basic: lowerTaxToPay,
      higher: higherTaxToPay,
      additional: 0,
      total: lowerTaxToPay + higherTaxToPay,
    };
  }

  if (taxableDividends <= ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE) {
    // higher rate threshold but with no personal allowance remaining
    // console.log("hit");
    // const taxFreeDividendsLeft =
    //   amountOfPersonalAllowanceLeft + DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
    // console.log("taxFreeDividendsLeft", taxFreeDividendsLeft / 100);
    // // const taxableDividends =
    // //   dividendDrawdown - taxFreeDividendsLeft < 0
    // //     ? 0
    // //     : dividendDrawdown - taxFreeDividendsLeft;
    // return {
    //   basic: 0,
    //   higher: 0,
    //   additional: 0,
    //   total: 0,
    // };
    const amountAtLowerRate =
      HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;

    const amountAthigherRate = taxableDividends - amountAtLowerRate;
    const lowerTaxToPay =
      amountAtLowerRate * (BASIC_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
    const higherTaxToPay =
      amountAthigherRate * (HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
    console.log("amountOfPersonalAllowanceLeft", amountOfPersonalAllowanceLeft);
    console.log(
      `youll pay ${BASIC_DIVIDEND_TAX_RATE_PERCENTAGE}% tax on the next`,
      amountAtLowerRate / 100,
      `plus additional tax of ${HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE}% on the next`,
      amountAthigherRate / 100
    );
    // The band reduces
    return {
      basic: lowerTaxToPay,
      higher: higherTaxToPay,
      additional: 0,
      total: lowerTaxToPay + higherTaxToPay,
    };
  }

  // if (amountOfPersonalAllowanceLeft > 0) {
  //   // earnings over £100k but still has personal allowance remaining
  //   // start paying dividend taxes earlier
  //   // const newTaxFreePersonalAllowancePence =
  //   //   TAX_FREE_PERSONAL_ALLOWANCE_PENCE -
  //   //   amountOverFullPersonalAllowanceThreshold;
  //   // console.log(amountOverFullPersonalAllowanceThreshold);
  //   // console.log(taxFreeDividendsLeft);
  //   const amountAtLowerRate =
  //     HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE - DIVIDEND_TAX_FREE_ALLOWANCE_PENCE;
  //   const amountAthigherRate = taxableDividends - amountAtLowerRate;
  //   const lowerTaxToPay =
  //     amountAtLowerRate * (BASIC_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
  //   const higherTaxToPay =
  //     amountAthigherRate * (HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE / 100);
  //   return {
  //     basic: lowerTaxToPay,
  //     higher: higherTaxToPay,
  //     additional: 0,
  //     total: lowerTaxToPay + higherTaxToPay,
  //   };
  // }

  return {
    basic: 0,
    higher: 0,
    additional: 0,
    total: 0,
  };

  // personal allowance used up
};
