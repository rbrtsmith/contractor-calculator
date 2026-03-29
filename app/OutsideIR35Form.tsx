"use client";

import { useState } from "react";
import { useForm } from "../hooks";
import {
  TextInput,
  SelectInput,
  Button,
  ExpandableContent,
  ResultsSection,
} from "../components";
import {
  currencyFormat,
  convertToPounds,
  convertToPence,
  computeOutsideIR35,
} from "../utils";
import { TAXES, TAX_YEARS, asTaxYear } from "../constants";

export const OutsideIR35Form = ({ hidden }: { hidden: boolean }) => {
  const [directorLoanPlans, setDirectorLoanPlans] = useState<string[]>([
    "none",
  ]);
  const [directorEVP11d, setDirectorEVP11d] = useState<string[]>(["0"]);
  const [daysMode, setDaysMode] = useState<"annual" | "weekly">("annual");
  const [wfhAllowance, setWfhAllowance] = useState(false);

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
  const syncedLoanPlans = Array.from(
    { length: numDirs },
    (_, i) => directorLoanPlans[i] ?? "none",
  );
  const syncedEVP11d = Array.from(
    { length: numDirs },
    (_, i) => directorEVP11d[i] ?? "0",
  );

  const taxes = TAXES[asTaxYear(taxYear)];
  const totalGeneralExpensesPence =
    convertToPence(generalExpenses) + (wfhAllowance ? 31200 * numDirs : 0);

  const {
    MAX_TAX_EFFICIENT_SALARY_PENCE,
    BASIC_DIVIDEND_TAX_RATE_PERCENTAGE,
    HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE,
    ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE,
    DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
    EV_BIK_RATE_PERCENTAGE,
  } = taxes;

  const {
    totalRevenue,
    corporationTaxDue,
    maximumAllowableDividendDrawdown,
    totalTaxableIncome,
    dividendTaxBreakdown,
    retainedProfits,
    totalAfterTaxPay,
    studentLoanRepayments,
    anyStudentLoan,
    effectivePersonalAllowancePence,
    maxTaxEfficientDividendPence,
    directorBiK,
    anyBiK,
    totalClass1aNI,
    directorDividendTaxAdjustment,
  } = computeOutsideIR35({
    numberOfDaysWorked: Number(effectiveDaysWorked),
    dailyRate: convertToPence(dailyRate),
    salaryDrawdown: convertToPence(salaryDrawdown),
    numberOfDirectors: numDirs,
    generalExpenses: totalGeneralExpensesPence,
    pensionContributions: convertToPence(pensionContributions),
    dividendDrawdown: convertToPence(dividendDrawdown),
    directorEVP11dPence: syncedEVP11d.map((p11d) => convertToPence(p11d)),
    directorLoanPlans: syncedLoanPlans,
    taxes,
  });

  const wfhAllowancePencePerDirector = wfhAllowance ? 31200 : 0;
  const adjustedTotalAfterTaxPay =
    totalAfterTaxPay + wfhAllowancePencePerDirector * numDirs;

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
      />
      <ExpandableContent title="Student loan">
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
      </ExpandableContent>
      <ExpandableContent title="Expenses">
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
        <label className="mb-2 flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={wfhAllowance}
            onChange={(e) => setWfhAllowance(e.currentTarget.checked)}
            aria-label="Work from home allowance (£6/week × 52 weeks = £312/year)"
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">
            Work from home allowance (£6/week × 52 weeks ={" "}
            <span className="font-semibold">£312/year</span>)
          </span>
        </label>
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
              setValue(
                "salaryDrawdown",
                convertToPounds(MAX_TAX_EFFICIENT_SALARY_PENCE).toFixed(2),
              );
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
        } (Max tax-efficient: ${currencyFormat(maxTaxEfficientDividendPence)})`}
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
        TAX_FREE_PERSONAL_ALLOWANCE_PENCE={effectivePersonalAllowancePence}
        DIVIDEND_TAX_FREE_ALLOWANCE_PENCE={DIVIDEND_TAX_FREE_ALLOWANCE_PENCE}
        BASIC_DIVIDEND_TAX_RATE_PERCENTAGE={BASIC_DIVIDEND_TAX_RATE_PERCENTAGE}
        HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE={
          HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE
        }
        ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE={
          ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE
        }
        dividendTaxBreakdown={dividendTaxBreakdown}
        EV_BIK_RATE_PERCENTAGE={EV_BIK_RATE_PERCENTAGE}
        numDirs={numDirs}
        directorBiK={directorBiK}
        anyBiK={anyBiK}
        directorDividendTaxAdjustment={directorDividendTaxAdjustment}
        syncedLoanPlans={syncedLoanPlans}
        studentLoanRepayments={studentLoanRepayments}
        anyStudentLoan={anyStudentLoan}
        totalAfterTaxPay={adjustedTotalAfterTaxPay}
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
