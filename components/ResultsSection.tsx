import { useId } from "react";
import { currencyFormat } from "../utils";
import { Tooltip } from "./Tooltip";

interface DirectorBiK {
  p11dPence: number;
  bikValue: number;
  incomeTaxOnBik: number;
  class1aNI: number;
}

interface DividendTaxBreakdown {
  basic: number;
  higher: number;
  additional: number;
  total: number;
}

interface Props {
  totalRevenue: number;
  generalExpenses: number;
  pensionContributions: number;
  corporationTaxDue: number;
  retainedProfits: number;
  totalTaxableIncome: number;
  directorTaxableIncome: number[];
  TAX_FREE_PERSONAL_ALLOWANCE_PENCE: number;
  directorEffectivePersonalAllowancePence: number[];
  DIVIDEND_TAX_FREE_ALLOWANCE_PENCE: number;
  BASIC_DIVIDEND_TAX_RATE_PERCENTAGE: number;
  HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE: number;
  ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE: number;
  dividendTaxBreakdown: DividendTaxBreakdown;
  directorDividendTaxBreakdown: DividendTaxBreakdown[];
  EV_BIK_RATE_PERCENTAGE: number;
  numDirs: number;
  directorBiK: DirectorBiK[];
  anyBiK: boolean;
  directorDividendTaxAdjustment: number[];
  syncedLoanPlans: string[][];
  studentLoanRepayments: number[];
  anyStudentLoan: boolean;
  directorSalaryIncomeTax: number[];
  anySalaryIncomeTax: boolean;
  totalAfterTaxPay: number;
  directorAfterTaxPay: number[];
}

const PLAN_LABELS: Record<string, string> = {
  plan1: "Plan 1",
  plan2: "Plan 2",
  postgrad: "Postgrad Loan",
};

const plansLabel = (plans: string[]): string =>
  plans.map((p) => PLAN_LABELS[p] ?? p).join(" + ") || "None";

const repaymentTooltip = (plans: string[]): string => {
  const hasPostgrad = plans.includes("postgrad");
  const hasUndergrad = plans.some((p) => p === "plan1" || p === "plan2");
  if (hasPostgrad && hasUndergrad)
    return "Undergraduate: 9% above the lowest threshold from your selected plans. Postgrad Loan: 6% above £21,000. Both calculated independently and summed.";
  if (hasPostgrad)
    return "6% of income above the £21,000 Postgraduate Loan threshold. Deducted from your net pay.";
  return "9% of income above your plan's repayment threshold. Deducted from your net pay.";
};

const StatCard = ({
  label,
  value,
  subtext,
  tooltip,
  accent = false,
  center = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  tooltip?: React.ReactNode;
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
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${
        accent ? "text-white/70" : "text-slate-500"
      }`}
    >
      {label}
      {tooltip}
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
    className="bg-white rounded-xl border border-slate-200 shadow-sm mb-3"
  >
    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100 rounded-t-xl">
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
  tooltip,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  tooltip?: React.ReactNode;
}) => {
  const id = useId();
  return (
    <div className="results-row flex justify-between items-center py-2.5 text-sm">
      <dt
        id={id}
        className={`flex items-center gap-1 ${muted ? "text-slate-500" : "text-slate-700"}`}
      >
        {label}
        {tooltip}
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

export const ResultsSection = ({
  totalRevenue,
  generalExpenses,
  pensionContributions,
  corporationTaxDue,
  retainedProfits,
  totalTaxableIncome,
  directorTaxableIncome,
  TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
  directorEffectivePersonalAllowancePence,
  DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
  BASIC_DIVIDEND_TAX_RATE_PERCENTAGE,
  HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE,
  ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE,
  dividendTaxBreakdown,
  directorDividendTaxBreakdown,
  EV_BIK_RATE_PERCENTAGE,
  numDirs,
  directorBiK,
  anyBiK,
  directorDividendTaxAdjustment,
  syncedLoanPlans,
  studentLoanRepayments,
  anyStudentLoan,
  directorSalaryIncomeTax,
  anySalaryIncomeTax,
  totalAfterTaxPay,
  directorAfterTaxPay,
}: Props) => {
  const netPayPerDirector = (i: number) =>
    directorAfterTaxPay[i] -
    studentLoanRepayments[i] -
    directorBiK[i].incomeTaxOnBik -
    directorDividendTaxAdjustment[i];

  const combinedNetPay = Array.from({ length: numDirs }, (_, i) =>
    netPayPerDirector(i),
  ).reduce((sum, v) => sum + v, 0);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
        Financial summary
      </h2>
      {/* Company overview */}
      <SectionCard title="Company overview">
        <Row
          label="Gross revenue"
          value={currencyFormat(totalRevenue)}
          bold
          tooltip={
            <Tooltip
              triggerLabel="Gross revenue information"
              content="The company's total income before any deductions — calculated as days worked multiplied by the daily rate."
            />
          }
        />
        {generalExpenses > 0 && (
          <Row
            label="General expenses"
            value={`− ${currencyFormat(generalExpenses)}`}
            muted
            tooltip={
              <Tooltip
                triggerLabel="General expenses information"
                content="Allowable business expenses claimed by the company. These are deducted before corporation tax is calculated, reducing your tax liability."
              />
            }
          />
        )}
        {pensionContributions > 0 && (
          <Row
            label="Pension contributions"
            value={`− ${currencyFormat(pensionContributions)}`}
            muted
            tooltip={
              <Tooltip
                triggerLabel="Pension contributions information"
                content="Employer pension contributions paid by the company on behalf of directors. These are a tax-deductible expense, reducing the corporation tax bill."
              />
            }
          />
        )}
        <Row
          label="Corporation tax"
          value={`− ${currencyFormat(corporationTaxDue)}`}
          muted
          tooltip={
            <Tooltip
              triggerLabel="Corporation tax information"
              content={
                <>
                  <p>
                    Tax paid by the company on its profits. The rate depends on
                    your profit level — small profits (under £50,000) are taxed
                    at 19%, profits over £250,000 at 25%, with marginal relief
                    applied in between.
                  </p>
                  <p className="mt-1">
                    Salary, expenses, and pension contributions all reduce
                    taxable profit before this is calculated.
                  </p>
                </>
              }
            />
          }
        />
        <Row
          label="Retained profits"
          value={currencyFormat(retainedProfits)}
          bold
          tooltip={
            <Tooltip
              triggerLabel="Retained profits information"
              content="What remains in the company after corporation tax, salary, expenses, pension contributions, and dividend drawdowns have all been deducted. This money stays in the business and can be drawn in future years."
            />
          }
        />
      </SectionCard>

      {/* Taxable income */}
      {numDirs > 1 ? (
        Array.from({ length: numDirs }, (_, i) => (
          <SectionCard key={i} title={`Director ${i + 1} taxable income`}>
            <Row
              label={`Director ${i + 1} taxable income`}
              value={currencyFormat(directorTaxableIncome[i])}
              bold
              tooltip={
                <Tooltip
                  triggerLabel="Taxable income information"
                  content="Salary plus dividends received, minus the dividend tax-free allowance. This is the amount on which income and dividend taxes are calculated."
                />
              }
            />
            <Row
              label="Personal allowance"
              value={currencyFormat(directorEffectivePersonalAllowancePence[i])}
              muted
              tooltip={
                <Tooltip
                  triggerLabel="Personal allowance information"
                  content="The amount of income you can earn before paying income tax. It tapers down by £1 for every £2 of income above £100,000, reaching zero at £125,140."
                />
              }
            />
          </SectionCard>
        ))
      ) : (
        <SectionCard title="Taxable income">
          <Row
            label="Taxable income"
            value={currencyFormat(totalTaxableIncome)}
            bold
            tooltip={
              <Tooltip
                triggerLabel="Taxable income information"
                content="Salary plus dividends received, minus the dividend tax-free allowance. This is the amount on which income and dividend taxes are calculated."
              />
            }
          />
          <Row
            label="Personal allowance"
            value={currencyFormat(TAX_FREE_PERSONAL_ALLOWANCE_PENCE)}
            muted
            tooltip={
              <Tooltip
                triggerLabel="Personal allowance information"
                content="The amount of income you can earn before paying income tax. It tapers down by £1 for every £2 of income above £100,000, reaching zero at £125,140."
              />
            }
          />
        </SectionCard>
      )}

      {/* Dividend tax */}
      {numDirs > 1 ? (
        Array.from({ length: numDirs }, (_, i) => (
          <SectionCard
            key={i}
            title={`Director ${i + 1} dividend tax (first ${currencyFormat(DIVIDEND_TAX_FREE_ALLOWANCE_PENCE)} tax-free)`}
          >
            <Row
              label={`Basic rate (${BASIC_DIVIDEND_TAX_RATE_PERCENTAGE}%)`}
              value={currencyFormat(directorDividendTaxBreakdown[i].basic)}
            />
            <Row
              label={`Higher rate (${HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE}%)`}
              value={currencyFormat(directorDividendTaxBreakdown[i].higher)}
            />
            <Row
              label={`Additional rate (${ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE}%)`}
              value={currencyFormat(directorDividendTaxBreakdown[i].additional)}
            />
            <Row
              label="Total dividend tax"
              value={currencyFormat(directorDividendTaxBreakdown[i].total)}
              bold
              tooltip={
                <Tooltip
                  triggerLabel="Total dividend tax information"
                  content="Dividend tax owed after the tax-free allowance. Charged at the basic, higher, or additional rate depending on which income tax band the dividends fall into."
                />
              }
            />
          </SectionCard>
        ))
      ) : (
        <SectionCard
          title={`Dividend tax (first ${currencyFormat(DIVIDEND_TAX_FREE_ALLOWANCE_PENCE)} tax-free)`}
        >
          <Row
            label={`Basic rate (${BASIC_DIVIDEND_TAX_RATE_PERCENTAGE}%)`}
            value={currencyFormat(dividendTaxBreakdown.basic)}
          />
          <Row
            label={`Higher rate (${HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE}%)`}
            value={currencyFormat(dividendTaxBreakdown.higher)}
          />
          <Row
            label={`Additional rate (${ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE}%)`}
            value={currencyFormat(dividendTaxBreakdown.additional)}
          />
          <Row
            label="Total dividend tax"
            value={currencyFormat(dividendTaxBreakdown.total)}
            bold
            tooltip={
              <Tooltip
                triggerLabel="Total dividend tax information"
                content="Dividend tax owed after the tax-free allowance. Charged at the basic, higher, or additional rate depending on which income tax band the dividends fall into."
              />
            }
          />
        </SectionCard>
      )}

      {/* Salary income tax */}
      {anySalaryIncomeTax && (
        <SectionCard title="Salary income tax">
          {numDirs === 1 ? (
            <Row
              label="Salary income tax"
              value={currencyFormat(directorSalaryIncomeTax[0])}
              bold
              tooltip={
                <Tooltip
                  triggerLabel="Salary income tax information"
                  content="Income tax you pay personally on salary above your personal allowance. Charged at 20% (basic), 40% (higher), or 45% (additional) depending on how much salary falls into each band."
                />
              }
            />
          ) : (
            directorSalaryIncomeTax.map((tax, i) =>
              tax > 0 ? (
                <Row
                  key={i}
                  label={`Director ${i + 1} salary income tax`}
                  value={currencyFormat(tax)}
                  tooltip={
                    <Tooltip
                      triggerLabel={`Director ${i + 1} salary income tax information`}
                      content="Income tax paid personally on salary above the personal allowance."
                    />
                  }
                />
              ) : null,
            )
          )}
        </SectionCard>
      )}

      {/* EV BiK */}
      {anyBiK && (
        <SectionCard
          title={`EV company car BiK (${EV_BIK_RATE_PERCENTAGE}% of P11D)`}
        >
          {numDirs === 1 ? (
            <>
              <Row
                label="BiK value"
                value={currencyFormat(directorBiK[0].bikValue)}
                tooltip={
                  <Tooltip
                    triggerLabel="BiK value information"
                    content={`The taxable Benefit in Kind — ${EV_BIK_RATE_PERCENTAGE}% of the car's P11D value. This is the amount on which income tax and Class 1A NI are calculated.`}
                  />
                }
              />
              <Row
                label="Income tax on BiK"
                value={currencyFormat(directorBiK[0].incomeTaxOnBik)}
                tooltip={
                  <Tooltip
                    triggerLabel="Income tax on BiK information"
                    content="Income tax you pay personally on the BiK value, charged at your marginal income tax rate."
                  />
                }
              />
              {directorDividendTaxAdjustment[0] > 0 && (
                <Row
                  label="Additional dividend tax (BiK pushes into higher rate)"
                  value={currencyFormat(directorDividendTaxAdjustment[0])}
                />
              )}
              <Row
                label="Class 1A NI (company cost)"
                value={currencyFormat(directorBiK[0].class1aNI)}
                tooltip={
                  <Tooltip
                    triggerLabel="Class 1A NI information"
                    content="Employer National Insurance the company pays on the BiK value. This is a company cost, not deducted from your personal pay."
                  />
                }
              />
            </>
          ) : (
            directorBiK.map((bik, i) =>
              bik.p11dPence > 0 ? (
                <div key={i}>
                  <div className="results-row py-2.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Director {i + 1}
                    </span>
                  </div>
                  <div className="pl-3 border-l-2 border-slate-100 mb-1">
                    <Row
                      label="BiK value"
                      value={currencyFormat(bik.bikValue)}
                      tooltip={
                        <Tooltip
                          triggerLabel="BiK value information"
                          content={`The taxable Benefit in Kind — ${EV_BIK_RATE_PERCENTAGE}% of the car's P11D value. This is the amount on which income tax and Class 1A NI are calculated.`}
                        />
                      }
                    />
                    <Row
                      label="Income tax on BiK"
                      value={currencyFormat(bik.incomeTaxOnBik)}
                      tooltip={
                        <Tooltip
                          triggerLabel="Income tax on BiK information"
                          content="Income tax you pay personally on the BiK value, charged at your marginal income tax rate."
                        />
                      }
                    />
                    {directorDividendTaxAdjustment[i] > 0 && (
                      /* v8 ignore next */ <Row
                        label="Additional dividend tax (BiK pushes into higher rate)"
                        value={currencyFormat(directorDividendTaxAdjustment[i])}
                      />
                    )}
                    <Row
                      label="Class 1A NI (company cost)"
                      value={currencyFormat(bik.class1aNI)}
                      tooltip={
                        <Tooltip
                          triggerLabel="Class 1A NI information"
                          content="Employer National Insurance the company pays on the BiK value. This is a company cost, not deducted from your personal pay."
                        />
                      }
                    />
                  </div>
                </div>
              ) : null,
            )
          )}
        </SectionCard>
      )}

      {/* Student loan */}
      {anyStudentLoan && (
        <SectionCard title="Student loan repayment">
          {numDirs === 1 ? (
            <Row
              label={plansLabel(syncedLoanPlans[0])}
              value={currencyFormat(studentLoanRepayments[0])}
              bold
              tooltip={
                <Tooltip
                  triggerLabel="Student loan repayment information"
                  content={repaymentTooltip(syncedLoanPlans[0])}
                />
              }
            />
          ) : (
            syncedLoanPlans.map((plans, i) =>
              plans.length > 0 ? (
                <Row
                  key={i}
                  label={`Director ${i + 1} (${plansLabel(plans)})`}
                  value={currencyFormat(studentLoanRepayments[i])}
                  tooltip={
                    <Tooltip
                      triggerLabel="Student loan repayment information"
                      content={repaymentTooltip(plans)}
                    />
                  }
                />
              ) : null,
            )
          )}
        </SectionCard>
      )}

      {/* Net pay */}
      {numDirs > 1 ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {Array.from({ length: numDirs }, (_, i) => (
              <StatCard
                key={i}
                label={`Director ${i + 1} net pay`}
                value={currencyFormat(netPayPerDirector(i))}
                subtext={`Monthly: ${currencyFormat(netPayPerDirector(i) / 12)}`}
              />
            ))}
          </div>
          <StatCard
            label="Combined net pay"
            value={currencyFormat(combinedNetPay)}
            subtext={`Monthly: ${currencyFormat(combinedNetPay / 12)}`}
            accent
            center
          />
        </>
      ) : (
        <StatCard
          label="Net pay"
          value={currencyFormat(netPayPerDirector(0))}
          subtext={`Monthly: ${currencyFormat(netPayPerDirector(0) / 12)}`}
          accent
          center
          tooltip={
            <Tooltip
              triggerLabel="Net pay information"
              content="Your total take-home pay after salary, dividends, income tax, dividend tax, student loan repayments, and any BiK tax adjustments."
            />
          }
        />
      )}
    </div>
  );
};
