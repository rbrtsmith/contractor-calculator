import { useId, useState } from "react";
import { useForm } from "../hooks";
import { TextInput } from "./TextInput";
import { SelectInput } from "./SelectInput";
import { ExpandableContent } from "./ExpandableContent";
import {
  currencyFormat,
  convertToPence,
  getStudentLoanRepayment,
  computeInsideIR35,
} from "../utils";
import { TAXES, TAX_YEARS, asTaxYear } from "../constants";

const loanPlanOptions = [
  { label: "None", value: "none" },
  { label: "Plan 1", value: "plan1" },
  { label: "Plan 2", value: "plan2" },
];

const StatCard = ({
  label,
  value,
  subtext,
  accent = false,
  center = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
  center?: boolean;
}) => (
  <section
    aria-label={label}
    className={`rounded-xl p-4 flex flex-col gap-1 ${center ? "items-center text-center" : ""} ${
      accent
        ? "bg-gradient-to-br from-green-400 to-blue-500 text-white"
        : "bg-white border border-slate-200 shadow-sm"
    }`}
  >
    <span
      className={`text-xs font-semibold uppercase tracking-wider ${
        accent ? "text-white/70" : "text-slate-500"
      }`}
    >
      {label}
    </span>
    <span
      className={`text-2xl font-bold leading-tight ${
        accent ? "text-white" : "text-slate-900"
      }`}
    >
      {value}
    </span>
    {subtext && (
      <span
        className={`text-sm mt-0.5 ${accent ? "text-white/80" : "text-slate-600"}`}
      >
        {subtext}
      </span>
    )}
  </section>
);

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section
    aria-label={title}
    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-3"
  >
    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
    </div>
    <dl className="px-4 py-1">{children}</dl>
  </section>
);

const Row = ({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) => {
  const id = useId();
  return (
    <div className="results-row flex justify-between items-center py-2.5 text-sm">
      <dt id={id} className={muted ? "text-slate-500" : "text-slate-700"}>
        {label}
      </dt>
      <dd
        aria-labelledby={id}
        className={`tabular-nums ${
          bold
            ? "font-bold text-slate-900"
            : muted
              ? "text-slate-500"
              : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
};

export const InsideIR35Form = ({ hidden }: { hidden: boolean }) => {
  const [studentLoanPlan, setStudentLoanPlan] = useState("none");
  const [daysMode, setDaysMode] = useState<"annual" | "weekly">("annual");

  const [values, { handleChange }] = useForm({
    numberOfDaysWorked: "230",
    weeksPerYear: "46",
    daysPerWeek: "5",
    dailyRate: "600.00",
    expenses: "1200.00",
    pensionContributions: "0.00",
    taxYear: TAX_YEARS[TAX_YEARS.length - 1],
  });

  const {
    numberOfDaysWorked,
    weeksPerYear,
    daysPerWeek,
    dailyRate,
    expenses,
    pensionContributions,
    taxYear,
  } = values;

  const effectiveDaysWorked =
    daysMode === "weekly"
      ? String(Number(weeksPerYear) * Number(daysPerWeek))
      : numberOfDaysWorked;

  const taxes = TAXES[asTaxYear(taxYear)];
  const result = computeInsideIR35({
    numberOfDaysWorked: Number(effectiveDaysWorked),
    dailyRate: convertToPence(dailyRate),
    expenses: convertToPence(expenses),
    pensionContributions: convertToPence(pensionContributions),
    taxes,
  });

  const studentLoanRepayment = getStudentLoanRepayment({
    plan: studentLoanPlan,
    incomePence: result.grossSalary,
    taxes,
  });

  const netPayAfterStudentLoan = result.netPay - studentLoanRepayment;

  return (
    <div style={{ display: hidden ? "none" : undefined }}>
      <div className="w-full pt-6 max-w-xl text-left mx-auto">
        <SelectInput
          label="Tax year"
          name="taxYear"
          value={taxYear}
          onChange={handleChange}
          options={TAX_YEARS.map((year) => ({ label: year, value: year }))}
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
                  <div className="pb-1 text-xs text-slate-500">
                    Days per week
                  </div>
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
          name="dailyRate"
          value={dailyRate}
          onChange={handleChange}
        />
        <ExpandableContent title="Student loan">
          <SelectInput
            label="Student loan plan"
            name="studentLoanPlan"
            value={studentLoanPlan}
            onChange={(e) => setStudentLoanPlan(e.currentTarget.value)}
            options={loanPlanOptions}
          />
        </ExpandableContent>
        <ExpandableContent title="Expenses">
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
            label="Annual pension contributions"
            prepend="£"
            step="0.01"
            type="number"
            min={0}
            name="pensionContributions"
            value={pensionContributions}
            onChange={handleChange}
          />
        </ExpandableContent>

        <div className="mt-8">
          <h2 className="text-2xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            Financial summary
          </h2>
          <SectionCard title="Company overview">
            <Row
              label="Gross contract value"
              value={currencyFormat(result.grossContractValue)}
              bold
            />
            {convertToPence(expenses) > 0 && (
              <Row
                label="Allowable expenses"
                value={`− ${currencyFormat(convertToPence(expenses))}`}
                muted
              />
            )}
            {convertToPence(pensionContributions) > 0 && (
              <Row
                label="Pension contributions"
                value={`− ${currencyFormat(convertToPence(pensionContributions))}`}
                muted
              />
            )}
            <Row
              label="Employer NI"
              value={`− ${currencyFormat(result.employerNI)}`}
              muted
            />
            <Row
              label="Gross PAYE salary"
              value={currencyFormat(result.grossSalary)}
              bold
            />
          </SectionCard>

          <SectionCard title="Income tax">
            <Row
              label="Basic (20%)"
              value={currencyFormat(result.incomeTaxBreakdown.basic)}
            />
            <Row
              label="Higher (40%)"
              value={currencyFormat(result.incomeTaxBreakdown.higher)}
            />
            <Row
              label="Additional (45%)"
              value={currencyFormat(result.incomeTaxBreakdown.additional)}
            />
            <Row
              label="Total income tax"
              value={currencyFormat(result.incomeTax)}
              bold
            />
          </SectionCard>

          <SectionCard
            title={`Employee NI (${taxes.EMPLOYEE_NI_BASIC_RATE_PERCENTAGE}% up to ${currencyFormat(taxes.EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE)}, 2% above)`}
          >
            <Row
              label="Employee NI"
              value={currencyFormat(result.employeeNI)}
              bold
            />
          </SectionCard>

          {studentLoanRepayment > 0 && (
            <SectionCard title="Student loan repayment">
              <Row
                label={studentLoanPlan === "plan1" ? "Plan 1" : "Plan 2"}
                value={currencyFormat(studentLoanRepayment)}
                bold
              />
            </SectionCard>
          )}

          <StatCard
            label="Net take-home pay"
            value={currencyFormat(netPayAfterStudentLoan)}
            subtext={`Monthly: ${currencyFormat(netPayAfterStudentLoan / 12)}`}
            accent
            center
          />
        </div>

        <p className="my-8 text-center">
          Want to compare against a permanent salary?{" "}
          <a
            href="https://www.thesalarycalculator.co.uk/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#3b82f6" }}
          >
            The Salary Calculator
          </a>
        </p>
      </div>
    </div>
  );
};
