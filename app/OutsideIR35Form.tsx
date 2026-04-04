"use client";

import { useState } from "react";
import { useForm } from "../hooks";
import {
  TextInput,
  SelectInput,
  Button,
  ExpandableContent,
  ResultsSection,
  Tooltip,
} from "../components";
import {
  currencyFormat,
  convertToPounds,
  convertToPence,
  computeOutsideIR35,
} from "../utils";
import { TAXES, TAX_YEARS, asTaxYear } from "../constants";

const LOAN_PLAN_OPTIONS = [
  { label: "Plan 1", value: "plan1" },
  { label: "Plan 2", value: "plan2" },
  { label: "Postgrad Loan", value: "postgrad" },
];

export const OutsideIR35Form = ({ hidden }: { hidden: boolean }) => {
  const [directorLoanPlans, setDirectorLoanPlans] = useState<string[][]>([[]]);
  const [directorEVP11d, setDirectorEVP11d] = useState<string[]>(["0"]);
  const [daysMode, setDaysMode] = useState<"annual" | "weekly">("annual");
  const [wfhAllowance, setWfhAllowance] = useState(false);
  const [salaryMode, setSalaryMode] = useState<"uniform" | "per-director">(
    "uniform",
  );
  const [directorSalaries, setDirectorSalaries] = useState<string[]>([
    `${convertToPounds(TAXES[TAX_YEARS[0]].MAX_TAX_EFFICIENT_SALARY_PENCE)}.00`,
  ]);

  const [values, { handleChange, setValue }] = useForm({
    numberOfDaysWorked: "230",
    weeksPerYear: "46",
    daysPerWeek: "5",
    dailyRate: "600.00",
    numberOfDirectors: "1",
    salaryDrawdown: `${convertToPounds(
      TAXES[TAX_YEARS[0]].MAX_TAX_EFFICIENT_SALARY_PENCE,
    )}.00`,
    generalExpenses: "1200.00",
    pensionContributions: "0.00",
    dividendDrawdown: "0",
    taxYear: TAX_YEARS[TAX_YEARS.length - 1],
  });

  const {
    numberOfDaysWorked,
    weeksPerYear,
    daysPerWeek,
    dailyRate,
    salaryDrawdown,
    numberOfDirectors,
    generalExpenses,
    pensionContributions,
    dividendDrawdown,
    taxYear,
  } = values;

  const effectiveDaysWorked =
    daysMode === "weekly"
      ? String(Number(weeksPerYear) * Number(daysPerWeek))
      : numberOfDaysWorked;

  const numDirs = Math.max(1, Number(numberOfDirectors) || 1);

  const taxes = TAXES[asTaxYear(taxYear)];
  const {
    MAX_TAX_EFFICIENT_SALARY_PENCE,
    BASIC_DIVIDEND_TAX_RATE_PERCENTAGE,
    HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE,
    ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE,
    DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
    EV_BIK_RATE_PERCENTAGE,
  } = taxes;

  const defaultSalary = `${convertToPounds(MAX_TAX_EFFICIENT_SALARY_PENCE)}.00`;
  const syncedSalaries = Array.from({ length: numDirs }, (_, i) => {
    if (salaryMode === "uniform") return salaryDrawdown;
    return directorSalaries[i] ?? defaultSalary;
  });

  const syncedLoanPlans = Array.from(
    { length: numDirs },
    (_, i) => directorLoanPlans[i] ?? [],
  );
  const syncedEVP11d = Array.from(
    { length: numDirs },
    (_, i) => directorEVP11d[i] ?? "0",
  );

  const totalGeneralExpensesPence =
    convertToPence(generalExpenses) + (wfhAllowance ? 31200 * numDirs : 0);

  const {
    totalRevenue,
    corporationTaxDue,
    maximumAllowableDividendDrawdown,
    maximumSalaryPerDirectorPence,
    totalTaxableIncome,
    directorTaxableIncome,
    dividendTaxBreakdown,
    directorDividendTaxBreakdown,
    retainedProfits,
    totalAfterTaxPay,
    studentLoanRepayments,
    anyStudentLoan,
    effectivePersonalAllowancePence,
    directorEffectivePersonalAllowancePence,
    maxTaxEfficientDividendPence,
    directorBiK,
    anyBiK,
    totalClass1aNI,
    directorDividendTaxAdjustment,
    directorAfterTaxPay,
    directorSalaryIncomeTax,
    anySalaryIncomeTax,
  } = computeOutsideIR35({
    numberOfDaysWorked: Number(effectiveDaysWorked),
    dailyRate: convertToPence(dailyRate),
    directorSalariesPence: syncedSalaries.map((s) => convertToPence(s)),
    numberOfDirectors: numDirs,
    generalExpenses: totalGeneralExpensesPence,
    pensionContributions: convertToPence(pensionContributions),
    dividendDrawdown: convertToPence(dividendDrawdown),
    directorEVP11dPence: syncedEVP11d.map((p11d) => convertToPence(p11d)),
    directorLoanPlans: syncedLoanPlans,
    taxes,
  });

  const totalFundableForSalary =
    totalRevenue -
    totalGeneralExpensesPence -
    convertToPence(pensionContributions);
  const directorMaxSalaryPence = syncedSalaries.map((_, i) => {
    const otherSalaries = syncedSalaries.reduce(
      (sum, s, j) => (j !== i ? sum + convertToPence(s) : sum),
      0,
    );
    return Math.max(0, totalFundableForSalary - otherSalaries);
  });

  const wfhAllowancePencePerDirector = wfhAllowance ? 31200 : 0;
  const adjustedTotalAfterTaxPay =
    totalAfterTaxPay + wfhAllowancePencePerDirector * numDirs;
  const adjustedDirectorAfterTaxPay = directorAfterTaxPay.map(
    (p) => p + wfhAllowancePencePerDirector,
  );

  return (
    <div
      style={{ display: hidden ? "none" : undefined }}
      className="w-full pt-6 max-w-xl text-left mx-auto"
    >
      <SelectInput
        label="Tax year"
        name="taxYear"
        value={taxYear}
        onChange={handleChange}
        options={TAX_YEARS.map((year) => ({
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
        tooltip={
          <Tooltip
            triggerLabel="Number of directors information"
            content="The number of director-shareholders in the company. Dividends are split evenly between directors, which can reduce the overall tax bill by keeping each person's income in lower tax bands."
          />
        }
      />
      <div className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Days worked annually
          </span>
        </div>
        <div className="px-4 pt-3 pb-4">
          <div className="days-mode-toggle mb-3">
            <label
              className={`days-mode-option${daysMode === "annual" ? " days-mode-option-active" : ""}`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={daysMode === "annual"}
                onChange={() => setDaysMode("annual")}
              />
              Annual days
            </label>
            <label
              className={`days-mode-option${daysMode === "weekly" ? " days-mode-option-active" : ""}`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={daysMode === "weekly"}
                onChange={() => setDaysMode("weekly")}
              />
              Weeks × days per week
            </label>
          </div>
          {daysMode === "annual" ? (
            <input
              type="number"
              step="any"
              aria-label="Days worked annually"
              name="numberOfDaysWorked"
              value={numberOfDaysWorked}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg w-full h-10 p-2 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="pb-1 text-xs text-slate-500">
                  Weeks per year
                </div>
                <input
                  type="number"
                  step="1"
                  min={1}
                  max={52}
                  name="weeksPerYear"
                  value={weeksPerYear}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-lg w-full h-10 p-2 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </label>
              <label className="block">
                <div className="pb-1 text-xs text-slate-500">Days per week</div>
                <input
                  type="number"
                  step="1"
                  min={1}
                  max={7}
                  name="daysPerWeek"
                  value={daysPerWeek}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-lg w-full h-10 p-2 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </label>
            </div>
          )}
          {daysMode === "weekly" && (
            <div className="mt-2 text-xs text-slate-500">
              = {effectiveDaysWorked} days per year
            </div>
          )}
        </div>
      </div>
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
        tooltip={
          <Tooltip
            triggerLabel="Daily rate information"
            content="Your day rate charged to the client. Multiplied by days worked to give the company's gross revenue."
          />
        }
      />
      <ExpandableContent title="Student loan">
        {syncedLoanPlans.map((plans, i) => (
          <div key={i} className="mb-4">
            <div className="pb-1.5 flex items-center gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                {numDirs > 1
                  ? `Director ${i + 1} student loan plans`
                  : "Student loan plans"}
              </span>
              <Tooltip
                triggerLabel={
                  numDirs > 1
                    ? `Director ${i + 1} student loan plan information`
                    : "Student loan plan information"
                }
                content={
                  <>
                    <p>
                      Select all plans that apply. Repayments are calculated on
                      total income (salary + dividends) above each plan&apos;s
                      threshold.
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Plan 1 &amp; 2</span> — if
                      you hold both, only 9% from the lower threshold (Plan 1)
                      is charged.
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Postgrad Loan</span> — 6%
                      above £21,000, calculated independently.
                    </p>
                  </>
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              {LOAN_PLAN_OPTIONS.map(({ label, value }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                    checked={plans.includes(value)}
                    onChange={(e) => {
                      const updatedPlans = e.currentTarget.checked
                        ? [...plans, value]
                        : plans.filter((p) => p !== value);
                      const updated = [...syncedLoanPlans];
                      updated[i] = updatedPlans;
                      setDirectorLoanPlans(updated);
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </ExpandableContent>
      <ExpandableContent title="Expenses">
        <TextInput
          label="Annual expenses"
          tooltip={
            <Tooltip
              triggerLabel="Annual expenses information"
              content={
                <>
                  <p className="font-semibold mb-1">What to include:</p>
                  <ul className="list-disc list-inside space-y-0.5 mb-2">
                    <li>Office costs &amp; equipment</li>
                    <li>Professional subscriptions</li>
                    <li>Travel &amp; accommodation</li>
                    <li>Accountancy fees</li>
                  </ul>
                  <p>
                    Enter the total for the whole company (across all
                    directors).
                  </p>
                  <p className="mt-1">
                    Business expenses are tax-deductible, reducing your
                    corporation tax liability.
                  </p>
                </>
              }
            />
          }
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
          tooltip={
            <Tooltip
              triggerLabel="Annual pension contributions information"
              content={
                <>
                  <p>
                    Enter the combined total of employer pension contributions
                    made by the company on behalf of all directors.
                  </p>
                  <p className="mt-1">
                    Employer contributions are a tax-deductible business
                    expense, reducing your corporation tax liability.
                  </p>
                </>
              }
            />
          }
          prepend="£"
          step="0.01"
          type="number"
          min={0}
          maxLength={10}
          name="pensionContributions"
          value={pensionContributions}
          onChange={handleChange}
        />
        <div className="mb-2 flex items-center gap-3">
          <input
            id="wfh-allowance"
            type="checkbox"
            checked={wfhAllowance}
            onChange={(e) => setWfhAllowance(e.currentTarget.checked)}
            className="w-4 h-4 accent-blue-500 cursor-pointer"
          />
          <label
            htmlFor="wfh-allowance"
            className="text-sm font-medium text-slate-700 cursor-pointer select-none"
          >
            Work from home allowance (£6/week × 52 weeks ={" "}
            <span className="font-semibold">£312/year</span>)
          </label>
          <Tooltip
            triggerLabel="Work from home allowance information"
            content={
              <>
                <p>
                  HMRC allows employees who work from home to claim a tax-free
                  allowance of £6/week (£312/year) to cover household costs such
                  as heating and electricity.
                </p>
                <p className="mt-1">
                  Each director qualifies individually. The total is paid as a
                  tax-free benefit — it reduces corporation tax and adds to your
                  net pay without triggering income tax.
                </p>
              </>
            }
          />
        </div>
      </ExpandableContent>
      <ExpandableContent title="EV company car">
        {syncedEVP11d.map((p11d, i) => (
          <TextInput
            key={i}
            label={
              numDirs > 1
                ? `Director ${i + 1} EV P11D value (${EV_BIK_RATE_PERCENTAGE}% BiK rate for ${taxYear})`
                : `EV company car P11D value (${EV_BIK_RATE_PERCENTAGE}% BiK rate for ${taxYear})`
            }
            tooltip={
              <Tooltip
                triggerLabel={
                  numDirs > 1
                    ? `Director ${i + 1} EV P11D value information`
                    : "EV company car P11D value information"
                }
                content={
                  <>
                    <p>
                      The P11D value is the list price of the car including
                      accessories and VAT, but excluding road tax and first
                      registration fee.
                    </p>
                    <p className="mt-1">
                      The taxable benefit (BiK) is {EV_BIK_RATE_PERCENTAGE}% of
                      this value for {taxYear}. Electric vehicles attract a much
                      lower BiK rate than petrol or diesel cars.
                    </p>
                    <p className="mt-1">
                      The company pays Class 1A NI on the BiK value; you pay
                      income tax on it personally.
                    </p>
                  </>
                }
              />
            }
            prepend="£"
            step="0.01"
            type="number"
            min={0}
            maxLength={10}
            name={`evP11d_${i}`}
            value={p11d}
            onChange={(e) => {
              const updated = [...syncedEVP11d];
              updated[i] = e.currentTarget.value;
              setDirectorEVP11d(updated);
            }}
          />
        ))}
      </ExpandableContent>
      {numDirs === 1 ? (
        <TextInput
          label={`Annual salary drawdown (${currencyFormat(
            MAX_TAX_EFFICIENT_SALARY_PENCE,
          )} is the most tax efficient)`}
          tooltip={
            <Tooltip
              triggerLabel="Annual salary drawdown information"
              content={
                <>
                  <p>
                    As a director you can pay yourself a salary from the
                    company. {currencyFormat(MAX_TAX_EFFICIENT_SALARY_PENCE)} is
                    the most tax-efficient amount — it sits just below the
                    employee NI primary threshold so you pay no employee NI.
                  </p>
                  <p className="mt-1">
                    Note: employer NI is still due on salary above £5,000 (the
                    employer secondary threshold), so the company pays some NI
                    regardless.
                  </p>
                  <p className="mt-1">
                    Salary is a tax-deductible business expense, reducing
                    corporation tax. Income above the personal allowance is
                    subject to income tax.
                  </p>
                </>
              }
            />
          }
          prepend="£"
          append={
            <Button
              disabled={
                MAX_TAX_EFFICIENT_SALARY_PENCE ===
                Math.floor(Number(salaryDrawdown) * 100)
              }
              onClick={() => {
                setValue(
                  "salaryDrawdown",
                  convertToPounds(MAX_TAX_EFFICIENT_SALARY_PENCE).toFixed(2),
                );
              }}
            >
              Efficient
            </Button>
          }
          type="number"
          step="0.01"
          min={0}
          max={convertToPounds(maximumSalaryPerDirectorPence)}
          maxLength={6}
          name="salaryDrawdown"
          value={salaryDrawdown}
          onChange={handleChange}
        />
      ) : (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100 flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Annual salary drawdown per director
            </span>
            <Tooltip
              triggerLabel="Annual salary drawdown information"
              content={
                <>
                  <p>
                    As a director you can pay yourself a salary from the
                    company. {currencyFormat(MAX_TAX_EFFICIENT_SALARY_PENCE)} is
                    the most tax-efficient amount — it sits just below the
                    employee NI primary threshold so you pay no employee NI.
                  </p>
                  <p className="mt-1">
                    Note: employer NI is still due on salary above £5,000 (the
                    employer secondary threshold), so the company pays some NI
                    regardless.
                  </p>
                  <p className="mt-1">
                    Salary is a tax-deductible business expense, reducing
                    corporation tax. Income above the personal allowance is
                    subject to income tax.
                  </p>
                </>
              }
            />
          </div>
          <div className="px-4 pt-3 pb-4">
            <div className="days-mode-toggle mb-3">
              <label
                className={`days-mode-option${salaryMode === "uniform" ? " days-mode-option-active" : ""}`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={salaryMode === "uniform"}
                  onChange={() => setSalaryMode("uniform")}
                />
                All directors
              </label>
              <label
                className={`days-mode-option${salaryMode === "per-director" ? " days-mode-option-active" : ""}`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={salaryMode === "per-director"}
                  onChange={() => setSalaryMode("per-director")}
                />
                Per director
              </label>
            </div>
            {salaryMode === "uniform" ? (
              <div className="text-input-wrapper">
                <div className="text-input-prepend">£</div>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={convertToPounds(maximumSalaryPerDirectorPence)}
                  aria-label="Annual salary drawdown per director"
                  name="salaryDrawdown"
                  value={salaryDrawdown}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-lg w-full h-10 p-2 pl-9 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
                <div className="text-input-append">
                  <Button
                    disabled={
                      MAX_TAX_EFFICIENT_SALARY_PENCE ===
                      Math.floor(Number(salaryDrawdown) * 100)
                    }
                    onClick={() => {
                      setValue(
                        "salaryDrawdown",
                        convertToPounds(MAX_TAX_EFFICIENT_SALARY_PENCE).toFixed(
                          2,
                        ),
                      );
                    }}
                  >
                    Efficient
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {syncedSalaries.map((salary, i) => (
                  <label key={i} className="block">
                    <div className="pb-1 text-xs text-slate-500">
                      Director {i + 1}
                    </div>
                    <div className="text-input-wrapper">
                      <div className="text-input-prepend">£</div>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={convertToPounds(directorMaxSalaryPence[i])}
                        aria-label={`Director ${i + 1} annual salary`}
                        value={salary}
                        onChange={(e) => {
                          const updated = [...directorSalaries];
                          updated[i] = e.currentTarget.value;
                          setDirectorSalaries(updated);
                        }}
                        className="border border-slate-300 rounded-lg w-full h-10 p-2 pl-9 bg-white text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                      <div className="text-input-append">
                        <Button
                          disabled={
                            MAX_TAX_EFFICIENT_SALARY_PENCE ===
                            Math.floor(Number(salary) * 100)
                          }
                          onClick={() => {
                            const updated = [...directorSalaries];
                            updated[i] = convertToPounds(
                              MAX_TAX_EFFICIENT_SALARY_PENCE,
                            ).toFixed(2);
                            setDirectorSalaries(updated);
                          }}
                        >
                          Efficient
                        </Button>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-1.5 text-xs text-slate-500">
              {currencyFormat(MAX_TAX_EFFICIENT_SALARY_PENCE)} is the most tax
              efficient
            </div>
          </div>
        </div>
      )}
      <TextInput
        label={`Annual dividend drawdown ${
          Number(numberOfDirectors) > 1 ? "per director" : ""
        } (Max tax-efficient: ${currencyFormat(maxTaxEfficientDividendPence)})`}
        tooltip={
          <Tooltip
            triggerLabel="Annual dividend drawdown information"
            content={
              <>
                <p>
                  Dividends are payments from the company&apos;s post-tax
                  profits to its shareholders. They are taxed at lower rates
                  than salary and attract no NI.
                </p>
                <p className="mt-1">
                  The first{" "}
                  {currencyFormat(taxes.DIVIDEND_TAX_FREE_ALLOWANCE_PENCE)} is
                  tax-free. Above that, dividend tax is charged at the basic,
                  higher, or additional rate depending on your total income.
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Efficient</span> sets the
                  amount to the highest figure that stays within the basic rate
                  band. <span className="font-semibold">All</span> draws the
                  maximum available from retained profits.
                </p>
              </>
            }
          />
        }
        prepend="£"
        appendDouble
        append={
          <div className="flex h-full">
            <Button
              disabled={
                maxTaxEfficientDividendPence ===
                Math.floor(Number(dividendDrawdown) * 100)
              }
              onClick={() => {
                setValue(
                  "dividendDrawdown",
                  convertToPounds(maxTaxEfficientDividendPence).toFixed(2),
                );
              }}
            >
              Efficient
            </Button>
            <Button
              disabled={
                maximumAllowableDividendDrawdown ===
                Math.floor(Number(dividendDrawdown) * 100)
              }
              onClick={() => {
                setValue(
                  "dividendDrawdown",
                  convertToPounds(maximumAllowableDividendDrawdown).toFixed(2),
                );
              }}
            >
              All
            </Button>
          </div>
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
      <ResultsSection
        totalRevenue={totalRevenue}
        generalExpenses={totalGeneralExpensesPence}
        pensionContributions={convertToPence(pensionContributions)}
        corporationTaxDue={corporationTaxDue}
        retainedProfits={retainedProfits - totalClass1aNI}
        totalTaxableIncome={totalTaxableIncome}
        directorTaxableIncome={directorTaxableIncome}
        TAX_FREE_PERSONAL_ALLOWANCE_PENCE={effectivePersonalAllowancePence}
        directorEffectivePersonalAllowancePence={
          directorEffectivePersonalAllowancePence
        }
        DIVIDEND_TAX_FREE_ALLOWANCE_PENCE={DIVIDEND_TAX_FREE_ALLOWANCE_PENCE}
        BASIC_DIVIDEND_TAX_RATE_PERCENTAGE={BASIC_DIVIDEND_TAX_RATE_PERCENTAGE}
        HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE={
          HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE
        }
        ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE={
          ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE
        }
        dividendTaxBreakdown={dividendTaxBreakdown}
        directorDividendTaxBreakdown={directorDividendTaxBreakdown}
        EV_BIK_RATE_PERCENTAGE={EV_BIK_RATE_PERCENTAGE}
        numDirs={numDirs}
        directorBiK={directorBiK}
        anyBiK={anyBiK}
        directorDividendTaxAdjustment={directorDividendTaxAdjustment}
        syncedLoanPlans={syncedLoanPlans}
        studentLoanRepayments={studentLoanRepayments}
        anyStudentLoan={anyStudentLoan}
        directorSalaryIncomeTax={directorSalaryIncomeTax}
        anySalaryIncomeTax={anySalaryIncomeTax}
        totalAfterTaxPay={adjustedTotalAfterTaxPay}
        directorAfterTaxPay={adjustedDirectorAfterTaxPay}
      />
      <p className="my-8 text-center">
        Want to compare against a permanent salary?{" "}
        <a
          href="https://www.thesalarycalculator.co.uk/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#3b82f6" }}
        >
          thesalarycalculator.co.uk
        </a>
      </p>
    </div>
  );
};
