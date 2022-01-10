import { useForm, useCalculate } from "../hooks";
import { TextInput } from "../components";
import { currencyFormat, convertToPounds } from "../utils";
import {
  MAX_TAX_EFFICIENT_SALARY_PENCE,
  TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
} from "../constants";

const Home = () => {
  const [values, handleChange] = useForm({
    numberOfDaysWorked: "252",
    dailyRate: "750.00",
    numberOfDirectors: "1",
    salaryDrawdown: `${convertToPounds(MAX_TAX_EFFICIENT_SALARY_PENCE)}.00`,
    generalExpenses: "1200.00",
    pensionContributions: "0.00",
    dividendDrawdown: "10000.00",
  });

  const {
    numberOfDaysWorked,
    dailyRate,
    salaryDrawdown,
    numberOfDirectors,
    generalExpenses,
    pensionContributions,
    dividendDrawdown,
  } = values;

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
  });

  return (
    <main>
      <div className="flex flex-col justify-center text-center pt-10">
        <h1 className="text-[72px] bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 font-extrabold">
          Contractor income calculator
        </h1>
        <p>For the 2021-2022 tax year (Outside IR35 only for now…)</p>
        <div className="w-full pt-10 max-w-xl text-left mx-auto">
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
              <strong>Total revenue:</strong> {currencyFormat(totalRevenue)}
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
                Total taxable income
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
                Tax to pay on dividends
                {Number(numberOfDirectors) > 1 ? " per director:" : ":"}
              </strong>{" "}
              <em>(First £2,000.00 is tax free)</em>
              <ul className="list-disc list-inside">
                <li>
                  Basic (7.5%): {currencyFormat(dividendTaxBreakdown.basic)}
                </li>
                <li>
                  Higher (32.5%): {currencyFormat(dividendTaxBreakdown.higher)}
                </li>
                <li>
                  Additional (38.1%):{" "}
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
              </strong>
            </li>
            <li className="mb-2">
              {Number(numberOfDirectors) > 1 ? (
                <>
                  <strong>Total after tax pay per director:</strong>{" "}
                  {currencyFormat(totalAfterTaxPay)}
                  <div>
                    {currencyFormat(
                      totalAfterTaxPay * Number(numberOfDirectors)
                    )}{" "}
                    (Combined)
                  </div>
                </>
              ) : (
                <>
                  <strong>Total after tax pay:</strong>{" "}
                  {currencyFormat(totalAfterTaxPay)}
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
