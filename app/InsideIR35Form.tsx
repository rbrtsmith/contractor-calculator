import { useState } from "react";
import { useForm } from "../hooks";
import {
  TextInput,
  SelectInput,
  ExpandableContent,
  StatCard,
  SectionCard,
  Row,
  Tooltip,
} from "../components";
import {
  currencyFormat,
  convertToPence,
  getStudentLoanRepayment,
  computeInsideIR35,
} from "../utils";
import { TAXES, TAX_YEARS, asTaxYear } from "../constants";

const LOAN_PLAN_OPTIONS = [
  { label: "Plan 1", value: "plan1" },
  { label: "Plan 2", value: "plan2" },
  { label: "Postgrad Loan", value: "postgrad" },
];

export const InsideIR35Form = ({ hidden }: { hidden: boolean }) => {
  const [studentLoanPlans, setStudentLoanPlans] = useState<string[]>([]);
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
    plans: studentLoanPlans,
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
          tooltip={
            <Tooltip
              triggerLabel="Daily rate information"
              content="Your day rate charged to the client. Multiply by days worked to get your gross contract value."
            />
          }
        />
        <ExpandableContent title="Student loan">
          <div className="mb-2">
            <div className="pb-1.5 flex items-center gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                Student loan plans
              </span>
              <Tooltip
                triggerLabel="Student loan plan information"
                content={
                  <>
                    <p className="font-semibold mb-1">Repayment thresholds:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>
                        Plan 1: 9% above £
                        {(
                          taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE / 100
                        ).toLocaleString()}
                      </li>
                      <li>
                        Plan 2: 9% above £
                        {(
                          taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE / 100
                        ).toLocaleString()}
                        . If you hold Plan 1 &amp; Plan 2, only 9% from the
                        lower threshold is charged.
                      </li>
                      <li>
                        Postgrad Loan: 6% above £
                        {(
                          taxes.STUDENT_LOAN_POSTGRAD_THRESHOLD_PENCE / 100
                        ).toLocaleString()}
                        . Calculated independently of undergraduate loans.
                      </li>
                    </ul>
                    <p className="mt-1">
                      Repayments are deducted from your net take-home pay.
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
                    checked={studentLoanPlans.includes(value)}
                    onChange={(e) => {
                      setStudentLoanPlans(
                        e.currentTarget.checked
                          ? [...studentLoanPlans, value]
                          : studentLoanPlans.filter((p) => p !== value),
                      );
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
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
            tooltip={
              <Tooltip
                triggerLabel="Annual allowable expenses information"
                content={
                  <>
                    <p className="font-semibold mb-1">What to include:</p>
                    <ul className="list-disc list-inside space-y-0.5 mb-2">
                      <li>Travel &amp; accommodation</li>
                      <li>Professional subscriptions</li>
                      <li>Equipment &amp; tools</li>
                    </ul>
                    <p>
                      Inside IR35, allowable expenses are deducted from your
                      gross contract value before employer NI and PAYE are
                      calculated.
                    </p>
                  </>
                }
              />
            }
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
            tooltip={
              <Tooltip
                triggerLabel="Annual pension contributions information"
                content="Employer pension contributions deducted from your gross contract value before PAYE is calculated, reducing the salary on which income tax and NI are charged."
              />
            }
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
              tooltip={
                <Tooltip
                  triggerLabel="Gross contract value information"
                  content="Your total income before any deductions — days worked multiplied by your daily rate. Inside IR35 this is treated as employment income, not company revenue."
                />
              }
            />
            {convertToPence(expenses) > 0 && (
              <Row
                label="Allowable expenses"
                value={`− ${currencyFormat(convertToPence(expenses))}`}
                muted
                tooltip={
                  <Tooltip
                    triggerLabel="Allowable expenses information"
                    content="Legitimate business expenses deducted from your gross contract value before employer NI and PAYE are calculated."
                  />
                }
              />
            )}
            {convertToPence(pensionContributions) > 0 && (
              <Row
                label="Pension contributions"
                value={`− ${currencyFormat(convertToPence(pensionContributions))}`}
                muted
                tooltip={
                  <Tooltip
                    triggerLabel="Pension contributions information"
                    content="Employer pension contributions deducted before PAYE is calculated, reducing the salary on which income tax and NI are charged."
                  />
                }
              />
            )}
            <Row
              label="Employer NI"
              value={`− ${currencyFormat(result.employerNI)}`}
              muted
              tooltip={
                <Tooltip
                  triggerLabel="Employer NI information"
                  content={
                    <>
                      <p>
                        National Insurance paid by the fee-payer (your client or
                        agency) on your deemed salary. Inside IR35, this is
                        deducted from your gross contract value before your PAYE
                        salary is calculated.
                      </p>
                      <p className="mt-1">
                        Rate: {taxes.EMPLOYER_NI_RATE_PERCENTAGE}% above the £
                        {(
                          taxes.EMPLOYER_NI_SECONDARY_THRESHOLD_PENCE / 100
                        ).toLocaleString()}{" "}
                        secondary threshold.
                      </p>
                    </>
                  }
                />
              }
            />
            <Row
              label="Gross PAYE salary"
              value={currencyFormat(result.grossSalary)}
              bold
              tooltip={
                <Tooltip
                  triggerLabel="Gross PAYE salary information"
                  content="Your gross contract value minus allowable expenses, pension contributions, and employer NI. This is the deemed employment income on which income tax and employee NI are calculated."
                />
              }
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
              tooltip={
                <Tooltip
                  triggerLabel="Total income tax information"
                  content="Income tax calculated on your gross PAYE salary above the personal allowance. The rate depends on how much of your salary falls into each band — basic (20%), higher (40%), and additional (45%)."
                />
              }
            />
          </SectionCard>

          <SectionCard
            title={`Employee NI (${taxes.EMPLOYEE_NI_BASIC_RATE_PERCENTAGE}% up to ${currencyFormat(taxes.EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE)}, 2% above)`}
          >
            <Row
              label="Employee NI"
              value={currencyFormat(result.employeeNI)}
              bold
              tooltip={
                <Tooltip
                  triggerLabel="Employee NI information"
                  content={`National Insurance deducted from your PAYE salary. You pay ${taxes.EMPLOYEE_NI_BASIC_RATE_PERCENTAGE}% on earnings between £${(taxes.EMPLOYEE_NI_PRIMARY_THRESHOLD_PENCE / 100).toLocaleString()} and ${currencyFormat(taxes.EMPLOYEE_NI_UPPER_EARNINGS_LIMIT_PENCE)}, then 2% above that.`}
                />
              }
            />
          </SectionCard>

          {studentLoanRepayment > 0 && (
            <SectionCard title="Student loan repayment">
              <Row
                label={LOAN_PLAN_OPTIONS.filter((o) =>
                  studentLoanPlans.includes(o.value),
                )
                  .map((o) => o.label)
                  .join(" + ")}
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
