import { Taxes } from "../constants";

const INCOME_TAX_BASIC_RATE = 0.2;
const INCOME_TAX_HIGHER_RATE = 0.4;
const INCOME_TAX_ADDITIONAL_RATE = 0.45;
const EMPLOYEE_NI_SECONDARY_RATE = 0.02;

export const computeInsideIR35 = ({
  numberOfDaysWorked,
  dailyRate,
  expenses,
  pensionContributions,
  taxes,
}: {
  numberOfDaysWorked: number;
  dailyRate: number;
  expenses: number;
  pensionContributions: number;
  taxes: Taxes;
}) => {
  const {
    EMPLOYER_NI_SECONDARY_THRESHOLD_PENCE,
    EMPLOYER_NI_RATE_PERCENTAGE,
    EMPLOYEE_NI_PRIMARY_THRESHOLD_PENCE,
    EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE,
    EMPLOYEE_NI_BASIC_RATE_PERCENTAGE,
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
    HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE,
    ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE,
    MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE,
  } = taxes;

  const employerNIRate = EMPLOYER_NI_RATE_PERCENTAGE / 100;
  const employeeNIBasicRate = EMPLOYEE_NI_BASIC_RATE_PERCENTAGE / 100;

  const grossContractValue = numberOfDaysWorked * dailyRate;
  const netAfterDeductions =
    grossContractValue - expenses - pensionContributions;

  const tentativeGrossSalary =
    (netAfterDeductions +
      employerNIRate * EMPLOYER_NI_SECONDARY_THRESHOLD_PENCE) /
    (1 + employerNIRate);

  const grossSalary =
    tentativeGrossSalary > EMPLOYER_NI_SECONDARY_THRESHOLD_PENCE
      ? tentativeGrossSalary
      : netAfterDeductions;

  const employerNI = Math.max(0, netAfterDeductions - grossSalary);

  const amountOver100k =
    grossSalary - MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE;
  const personalAllowance =
    amountOver100k <= 0
      ? TAX_FREE_PERSONAL_ALLOWANCE_PENCE
      : Math.max(0, TAX_FREE_PERSONAL_ALLOWANCE_PENCE - amountOver100k / 2);

  const higherRateThreshold =
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE + HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE;
  const taxableIncome = Math.max(0, grossSalary - personalAllowance);
  const inAdditionalRateBand = Math.max(
    0,
    grossSalary - ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE,
  );
  const inHigherRateBand = Math.max(
    0,
    Math.min(grossSalary, ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE) -
      higherRateThreshold,
  );
  const inBasicRateBand = Math.max(
    0,
    taxableIncome - inHigherRateBand - inAdditionalRateBand,
  );

  const incomeTax =
    inBasicRateBand * INCOME_TAX_BASIC_RATE +
    inHigherRateBand * INCOME_TAX_HIGHER_RATE +
    inAdditionalRateBand * INCOME_TAX_ADDITIONAL_RATE;

  const employeeNIBasic = Math.max(
    0,
    Math.min(grossSalary, EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE) -
      EMPLOYEE_NI_PRIMARY_THRESHOLD_PENCE,
  );
  const employeeNIHigher = Math.max(
    0,
    grossSalary - EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE,
  );
  const employeeNI =
    Math.max(0, employeeNIBasic) * employeeNIBasicRate +
    Math.max(0, employeeNIHigher) * EMPLOYEE_NI_SECONDARY_RATE;

  return {
    grossContractValue,
    employerNI,
    grossSalary,
    incomeTax,
    incomeTaxBreakdown: {
      basic: inBasicRateBand * INCOME_TAX_BASIC_RATE,
      higher: inHigherRateBand * INCOME_TAX_HIGHER_RATE,
      additional: inAdditionalRateBand * INCOME_TAX_ADDITIONAL_RATE,
    },
    employeeNI,
    netPay: grossSalary - incomeTax - employeeNI,
  };
};
