import { useState } from "react";
import { useForm, useCalculate } from "../hooks";
import { TextInput, SelectInput, Button } from "../components";
import { currencyFormat, convertToPounds, convertToPence } from "../utils";

import { TAXES } from "../constants";

const taxYears = [
  "2021/22",
  "2022/23",
  "2023/24",
  "2024/25",
  "2025/26",
  "2026/27",
];

const Home = () => {
  const [directorLoanPlans, setDirectorLoanPlans] = useState<string[]>(["none"]);

  const [values, handleChange] = useForm({
    numberOfDaysWorked: "230",
    dailyRate: "600.00",
    numberOfDirectors: "1",
    salaryDrawdown: `${convertToPounds(
      TAXES[taxYears[0]].MAX_TAX_EFFICIENT_SALARY_PENCE,
    )}.00`,
    generalExpenses: "1200.00",
    pensionContributions: "0.00",
    dividendDrawdown: "0",
    taxYear: taxYears[taxYears.length - 1],
  });

  const {
    numberOfDaysWorked,
    dailyRate,
    salaryDrawdown,
    numberOfDirectors,
    generalExpenses,
    pensionContributions,
    dividendDrawdown,
    taxYear,
  } = values;

  const numDirs = Number(numberOfDirectors);
  const syncedLoanPlans = Array.from(
    { length: numDirs },
    (_, i) => directorLoanPlans[i] ?? "none"
  );

  const taxes = TAXES[taxYear];

  const {
    TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
    MAX_TAX_EFFICIENT_SALARY_PENCE,
    BASIC_DIVIDEND_TAX_RATE_PERCENTAGE,
    HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE,
    ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE,
  } = taxes;

  const {
    totalRevenue,
    corporationTaxDue,
    maximumAllowableDividendDrawdown,
    totalTaxableIncome,
    dividendTaxBreakdown,
    retainedProfits,
    totalAfterTaxPay,
  } = useCalculate({
    numberOfDaysWorked,
    dailyRate,
    salaryDrawdown,
    numberOfDirectors,
    generalExpenses,
    pensionContributions,
    dividendDrawdown,
    taxes,
  });

  const incomePerDirectorPence =
    convertToPence(salaryDrawdown) + convertToPence(dividendDrawdown);

  const getStudentLoanRepayment = (plan: string): number => {
    if (plan === "none") return 0;
    const threshold =
      plan === "plan1"
        ? taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE
        : taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE;
    const above = incomePerDirectorPence - threshold;
    return above > 0 ? above * 0.09 : 0;
  };

  const studentLoanRepayments = syncedLoanPlans.map(getStudentLoanRepayment);
  const anyStudentLoan = studentLoanRepayments.some((r) => r > 0);

  return (
    <main>
      <div className="flex flex-col justify-center text-center pt-10 px-4">
        <h1 className="leading-none text-[72px] bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 font-extrabold mb-6">
          Contractor income calculator
        </h1>
        <p className="mb-0">Outside IR35 only for now…</p>
        <div className="w-full pt-10 max-w-xl text-left mx-auto">
          <SelectInput
            label="Tax year"
            name="taxYear"
            value={taxYear}
            onChange={handleChange}
            options={taxYears.map((year) => ({
              label: year,
              value: year,
            }))}
          />
          <TextInput
            label="Number of directors (dividends evenly split)"
            max="9"
            min="1"
            type="number"
            step="1"
            name="numberOfDirectors"
            value={numberOfDirectors}
            onChange={handleChange}
          />
          {syncedLoanPlans.map((plan, i) => (
            <SelectInput
              key={i}
              label={
                numDirs > 1
                  ? `Director ${i + 1} student loan plan`
                  : "Student loan plan"
              }
              name={`directorLoanPlan_${i}`}
              value={plan}
              onChange={(e) => {
                const updated = [...syncedLoanPlans];
                updated[i] = e.currentTarget.value;
                setDirectorLoanPlans(updated);
              }}
              options={[
                { label: "None", value: "none" },
                { label: "Plan 1", value: "plan1" },
                { label: "Plan 2", value: "plan2" },
              ]}
            />
          ))}
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
            maxLength={10}
            name="dailyRate"
            value={dailyRate}
            onChange={handleChange}
          />
          <TextInput
            label="Annual expenses"
            prepend="£"
            step="0.01"
            type="number"
            min={0}
            maxLength={10}
            name="generalExpenses"
            value={generalExpenses}
            onChange={handleChange}
          />
          <TextInput
            label="Annual pension contributions"
            prepend="£"
            step="0.01"
            type="number"
            min={0}
            maxLength={10}
            name="pensionContributions"
            value={pensionContributions}
            onChange={handleChange}
          />
          <TextInput
            label={`Annual salary drawdown ${
              Number(numberOfDirectors) > 1 ? "per director" : ""
            } (${currencyFormat(
              MAX_TAX_EFFICIENT_SALARY_PENCE,
            )} is the most tax efficient)`}
            prepend="£"
            append={
              <Button
                disabled={
                  MAX_TAX_EFFICIENT_SALARY_PENCE ===
                  Math.floor(Number(salaryDrawdown) * 100)
                }
                onClick={() => {
                  const evt = {
                    currentTarget: {
                      name: "salaryDrawdown",
                      value: convertToPounds(
                        MAX_TAX_EFFICIENT_SALARY_PENCE,
                      ).toFixed(2),
                    },
                  } as any as React.FormEvent<HTMLInputElement>;
                  handleChange(evt);
                }}
              >
                Max out
              </Button>
            }
            type="number"
            step="0.01"
            min={0}
            maxLength={6}
            name="salaryDrawdown"
            value={salaryDrawdown}
            onChange={handleChange}
          />
          <TextInput
            label={`Annual dividend drawdown ${
              Number(numberOfDirectors) > 1 ? "per director" : ""
            } (Maximum available is ${currencyFormat(
              maximumAllowableDividendDrawdown,
            )})`}
            prepend="£"
            append={
              <Button
                disabled={
                  maximumAllowableDividendDrawdown ===
                  Math.floor(Number(dividendDrawdown) * 100)
                }
                onClick={() => {
                  const evt = {
                    currentTarget: {
                      name: "dividendDrawdown",
                      value: convertToPounds(
                        maximumAllowableDividendDrawdown,
                      ).toFixed(2),
                    },
                  } as any as React.FormEvent<HTMLInputElement>;
                  handleChange(evt);
                }}
              >
                Max out
              </Button>
            }
            step="0.01"
            type="number"
            min={0}
            maxLength={10}
            max={convertToPounds(maximumAllowableDividendDrawdown)}
            name="dividendDrawdown"
            value={dividendDrawdown}
            onChange={handleChange}
          />
          <ul>
            <li className="mb-2">
              <strong>Gross revenue:</strong> {currencyFormat(totalRevenue)}
            </li>
            <li className="mb-2">
              <strong>Corporation tax due:</strong>{" "}
              {currencyFormat(corporationTaxDue)}
            </li>
            <li className="mb-2">
              <strong>Retained profits:</strong>{" "}
              {currencyFormat(retainedProfits)}
            </li>
            <li className="mb-2">
              <strong>
                Taxable income
                {Number(numberOfDirectors) > 1 ? " per director:" : ":"}
              </strong>{" "}
              {currencyFormat(totalTaxableIncome)}
              <p>
                Is{" "}
                {totalTaxableIncome <= TAX_FREE_PERSONAL_ALLOWANCE_PENCE
                  ? "less"
                  : "greater"}{" "}
                than your personal allowance of{" "}
                {currencyFormat(TAX_FREE_PERSONAL_ALLOWANCE_PENCE)}
              </p>
            </li>
            <li className="mb-2">
              <strong>
                Tax due on dividends
                {Number(numberOfDirectors) > 1 ? " per director:" : ":"}
              </strong>{" "}
              <em>(First £2,000.00 is tax free)</em>
              <ul className="list-disc list-inside">
                <li>
                  Basic ({BASIC_DIVIDEND_TAX_RATE_PERCENTAGE}%):{" "}
                  {currencyFormat(dividendTaxBreakdown.basic)}
                </li>
                <li>
                  Higher ({HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE}%):{" "}
                  {currencyFormat(dividendTaxBreakdown.higher)}
                </li>
                <li>
                  Additional ({ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE}%):{" "}
                  {currencyFormat(dividendTaxBreakdown.additional)}
                </li>
                <li>
                  Total dividend tax due:{" "}
                  {currencyFormat(dividendTaxBreakdown.total)}
                </li>
              </ul>
            </li>
            {anyStudentLoan && (
              <li className="mb-2">
                <strong>
                  Student loan repayment
                  {numDirs > 1 ? "s" : ""}:
                </strong>
                {numDirs === 1 ? (
                  <>
                    {" "}
                    (
                    {syncedLoanPlans[0] === "plan1" ? "Plan 1" : "Plan 2"}
                    ): {currencyFormat(studentLoanRepayments[0])}
                  </>
                ) : (
                  <ul className="list-disc list-inside">
                    {syncedLoanPlans.map((plan, i) =>
                      plan !== "none" ? (
                        <li key={i}>
                          Director {i + 1} (
                          {plan === "plan1" ? "Plan 1" : "Plan 2"}
                          ): {currencyFormat(studentLoanRepayments[i])}
                        </li>
                      ) : null
                    )}
                  </ul>
                )}
              </li>
            )}
            <li className="mb-2">
              {numDirs > 1 ? (
                <>
                  <strong>Net pay per director:</strong>
                  {studentLoanRepayments.every(
                    (r) => r === studentLoanRepayments[0]
                  ) ? (
                    <>
                      {" "}
                      {currencyFormat(
                        totalAfterTaxPay - studentLoanRepayments[0]
                      )}{" "}
                      (
                      {currencyFormat(
                        (totalAfterTaxPay - studentLoanRepayments[0]) *
                          numDirs
                      )}{" "}
                      when combined)
                    </>
                  ) : (
                    <ul className="list-disc list-inside">
                      {syncedLoanPlans.map((_, i) => (
                        <li key={i}>
                          Director {i + 1}:{" "}
                          {currencyFormat(
                            totalAfterTaxPay - studentLoanRepayments[i]
                          )}
                        </li>
                      ))}
                      <li>
                        Combined:{" "}
                        {currencyFormat(
                          studentLoanRepayments.reduce(
                            (sum, r) => sum + (totalAfterTaxPay - r),
                            0
                          )
                        )}
                      </li>
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <strong>Net pay:</strong>{" "}
                  {currencyFormat(totalAfterTaxPay - studentLoanRepayments[0])}
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default Home;
