import { useForm, useCalculate } from "../hooks";
import { TextInput, SelectInput } from "../components";
import { currencyFormat, convertToPounds } from "../utils";

import { TAXES } from "../constants";

const taxYears = ["2021/22", "2022/23"];

const Home = () => {
  const [values, handleChange] = useForm({
    numberOfDaysWorked: "230",
    dailyRate: "700.00",
    numberOfDirectors: "1",
    salaryDrawdown: `${convertToPounds(
      TAXES[taxYears[0]].MAX_TAX_EFFICIENT_SALARY_PENCE
    )}.00`,
    generalExpenses: "1200.00",
    pensionContributions: "0.00",
    dividendDrawdown: "10000.00",
    taxYear: taxYears[0],
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

  return (
    <main>
      <div className="flex flex-col justify-center text-center pt-10 px-4">
        <h1 className="leading-none text-[72px] bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 font-extrabold">
          Contractor income calculator
        </h1>
        <div className="w-full pt-10 max-w-xl text-left mx-auto">
          <SelectInput
            label="Tax year"
            name="taxYear"
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
              MAX_TAX_EFFICIENT_SALARY_PENCE
            )} is the most tax efficient)`}
            prepend="£"
            append={
              <button
                className="h-full bg-blue-500 hover:bg-blue-700 text-white px-2 font-bold"
                onClick={() => {
                  const evt = {
                    currentTarget: {
                      name: "salaryDrawdown",
                      value: convertToPounds(
                        MAX_TAX_EFFICIENT_SALARY_PENCE
                      ).toFixed(2),
                    },
                  } as any as React.FormEvent<HTMLInputElement>;
                  handleChange(evt);
                }}
              >
                Max out
              </button>
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
              maximumAllowableDividendDrawdown
            )})`}
            prepend="£"
            append={
              <button
                className="h-full bg-blue-500 hover:bg-blue-700 text-white px-2 font-bold"
                onClick={() => {
                  const evt = {
                    currentTarget: {
                      name: "dividendDrawdown",
                      value: convertToPounds(
                        maximumAllowableDividendDrawdown
                      ).toFixed(2),
                    },
                  } as any as React.FormEvent<HTMLInputElement>;
                  handleChange(evt);
                }}
              >
                Max out
              </button>
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
            <li className="mb-2">
              <strong>
                Tax to pay on salary
                {Number(numberOfDirectors) > 1 ? " per director:" : ":"}
              </strong>{" "}
              £0.00
            </li>
            <li className="mb-2">
              {Number(numberOfDirectors) > 1 ? (
                <>
                  <strong>Net pay per director:</strong>{" "}
                  {currencyFormat(totalAfterTaxPay)} (
                  {currencyFormat(totalAfterTaxPay * Number(numberOfDirectors))}{" "}
                  when combined)
                </>
              ) : (
                <>
                  <strong>Net pay:</strong> {currencyFormat(totalAfterTaxPay)}
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
