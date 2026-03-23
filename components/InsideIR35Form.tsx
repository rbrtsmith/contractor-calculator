import { useForm } from "../hooks";
import { TextInput } from "./TextInput";
import { SelectInput } from "./SelectInput";
import { currencyFormat, convertToPence, convertToPounds } from "../utils";
import { TAXES } from "../constants";

const taxYears = [
  "2021/22",
  "2022/23",
  "2023/24",
  "2024/25",
  "2025/26",
  "2026/27",
];

const INCOME_TAX_BASIC_RATE = 0.2;
const INCOME_TAX_HIGHER_RATE = 0.4;
const INCOME_TAX_ADDITIONAL_RATE = 0.45;

const computeInsideIR35 = ({
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
  taxes: (typeof TAXES)[string];
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
  const netAfterDeductions = grossContractValue - expenses - pensionContributions;

  // Solve for gross salary: netAfterDeductions = grossSalary + employerNI
  // If grossSalary > secondaryThreshold:
  //   netAfterDeductions = grossSalary * (1 + employerNIRate) - employerNIRate * secondaryThreshold
  //   grossSalary = (netAfterDeductions + employerNIRate * secondaryThreshold) / (1 + employerNIRate)
  let grossSalary: number;
  const tentativeGrossSalary =
    (netAfterDeductions + employerNIRate * EMPLOYER_NI_SECONDARY_THRESHOLD_PENCE) /
    (1 + employerNIRate);

  if (tentativeGrossSalary > EMPLOYER_NI_SECONDARY_THRESHOLD_PENCE) {
    grossSalary = tentativeGrossSalary;
  } else {
    // Below secondary threshold — no employer NI
    grossSalary = netAfterDeductions;
  }

  const employerNI = Math.max(0, netAfterDeductions - grossSalary);

  // Personal allowance (tapered above £100k)
  const amountOver100k = grossSalary - MAXIMUM_FULL_PERSONAL_ALLOWANCE_THRESHOLD_PENCE;
  const personalAllowance =
    amountOver100k <= 0
      ? TAX_FREE_PERSONAL_ALLOWANCE_PENCE
      : Math.max(0, TAX_FREE_PERSONAL_ALLOWANCE_PENCE - amountOver100k / 2);

  // Income tax
  const higherRateThreshold =
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE + HIGHER_DIVIDEND_TAX_THRESHOLD_PENCE; // £50,270
  const taxableIncome = Math.max(0, grossSalary - personalAllowance);
  const inAdditionalRateBand = Math.max(
    0,
    grossSalary - ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE
  );
  const inHigherRateBand = Math.max(
    0,
    Math.min(grossSalary, ADDITIONAL_DIVIDEND_TAX_THRESHOLD_PENCE) - higherRateThreshold
  );
  const inBasicRateBand = Math.max(0, taxableIncome - inHigherRateBand - inAdditionalRateBand);

  const incomeTax =
    inBasicRateBand * INCOME_TAX_BASIC_RATE +
    inHigherRateBand * INCOME_TAX_HIGHER_RATE +
    inAdditionalRateBand * INCOME_TAX_ADDITIONAL_RATE;

  // Employee NI
  const employeeNIBasic = Math.max(
    0,
    Math.min(grossSalary, EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE) -
      EMPLOYEE_NI_PRIMARY_THRESHOLD_PENCE
  );
  const employeeNIHigher = Math.max(0, grossSalary - EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE);
  const employeeNI =
    Math.max(0, employeeNIBasic) * employeeNIBasicRate + Math.max(0, employeeNIHigher) * 0.02;

  const netPay = grossSalary - incomeTax - employeeNI;

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
    netPay,
  };
};

export const InsideIR35Form = ({ hidden }: { hidden: boolean }) => {
  const [values, handleChange] = useForm({
    numberOfDaysWorked: "230",
    dailyRate: "600.00",
    expenses: "1200.00",
    pensionContributions: "0.00",
    taxYear: taxYears[taxYears.length - 1],
  });

  const { numberOfDaysWorked, dailyRate, expenses, pensionContributions, taxYear } = values;

  const taxes = TAXES[taxYear];

  const result = computeInsideIR35({
    numberOfDaysWorked: Number(numberOfDaysWorked),
    dailyRate: convertToPence(dailyRate),
    expenses: convertToPence(expenses),
    pensionContributions: convertToPence(pensionContributions),
    taxes,
  });

  return (
    <div style={{ display: hidden ? "none" : undefined }}>
      <div className="w-full pt-10 max-w-xl text-left mx-auto">
        <SelectInput
          label="Tax year"
          name="taxYear"
          value={taxYear}
          onChange={handleChange}
          options={taxYears.map((year) => ({ label: year, value: year }))}
        />
        <TextInput
          label="Number of days worked annually"
          maxLength={3}
          type="number"
          step="any"
          name="numberOfDaysWorked"
          value={numberOfDaysWorked}
          onChange={handleChange}
        />
        <TextInput
          label="Daily rate"
          prepend="£"
          type="number"
          step="0.01"
          min={0}
          name="dailyRate"
          value={dailyRate}
          onChange={handleChange}
        />
        <TextInput
          label="Annual allowable expenses"
          prepend="£"
          step="0.01"
          type="number"
          min={0}
          name="expenses"
          value={expenses}
          onChange={handleChange}
        />
        <TextInput
          label="Annual employer pension contributions"
          prepend="£"
          step="0.01"
          type="number"
          min={0}
          name="pensionContributions"
          value={pensionContributions}
          onChange={handleChange}
        />
        <ul>
          <li className="mb-2">
            <strong>Gross contract value:</strong>{" "}
            {currencyFormat(result.grossContractValue)}
          </li>
          <li className="mb-2">
            <strong>Employer NI ({taxes.EMPLOYER_NI_RATE_PERCENTAGE}% above{" "}
            {currencyFormat(taxes.EMPLOYER_NI_SECONDARY_THRESHOLD_PENCE)}):</strong>{" "}
            {currencyFormat(result.employerNI)}
          </li>
          <li className="mb-2">
            <strong>Gross PAYE salary:</strong> {currencyFormat(result.grossSalary)}
          </li>
          <li className="mb-2">
            <strong>Income tax:</strong>
            <ul className="list-disc list-inside">
              <li>Basic (20%): {currencyFormat(result.incomeTaxBreakdown.basic)}</li>
              <li>Higher (40%): {currencyFormat(result.incomeTaxBreakdown.higher)}</li>
              <li>Additional (45%): {currencyFormat(result.incomeTaxBreakdown.additional)}</li>
              <li>Total: {currencyFormat(result.incomeTax)}</li>
            </ul>
          </li>
          <li className="mb-2">
            <strong>
              Employee NI ({taxes.EMPLOYEE_NI_BASIC_RATE_PERCENTAGE}% up to{" "}
              {currencyFormat(taxes.EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE)}, 2% above):
            </strong>{" "}
            {currencyFormat(result.employeeNI)}
          </li>
          <li className="mb-2">
            <strong>Net take-home pay:</strong> {currencyFormat(result.netPay)}
          </li>
        </ul>
      </div>
    </div>
  );
};
