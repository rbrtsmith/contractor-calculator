import { currencyFormat } from "../utils";

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
  TAX_FREE_PERSONAL_ALLOWANCE_PENCE: number;
  DIVIDEND_TAX_FREE_ALLOWANCE_PENCE: number;
  BASIC_DIVIDEND_TAX_RATE_PERCENTAGE: number;
  HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE: number;
  ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE: number;
  dividendTaxBreakdown: DividendTaxBreakdown;
  EV_BIK_RATE_PERCENTAGE: number;
  numDirs: number;
  directorBiK: DirectorBiK[];
  anyBiK: boolean;
  directorDividendTaxAdjustment: number[];
  syncedLoanPlans: string[];
  studentLoanRepayments: number[];
  anyStudentLoan: boolean;
  totalAfterTaxPay: number;
}

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
  <div
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
  </div>
);

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-3">
    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </span>
    </div>
    <div className="px-4 py-1">{children}</div>
  </div>
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
}) => (
  <div className="results-row flex justify-between items-center py-2.5 text-sm">
    <span className={muted ? "text-slate-500" : "text-slate-700"}>{label}</span>
    <span
      className={`tabular-nums ${
        bold ? "font-bold text-slate-900" : muted ? "text-slate-500" : "text-slate-800"
      }`}
    >
      {value}
    </span>
  </div>
);

export const ResultsSection = ({
  totalRevenue,
  generalExpenses,
  pensionContributions,
  corporationTaxDue,
  retainedProfits,
  totalTaxableIncome,
  TAX_FREE_PERSONAL_ALLOWANCE_PENCE,
  DIVIDEND_TAX_FREE_ALLOWANCE_PENCE,
  BASIC_DIVIDEND_TAX_RATE_PERCENTAGE,
  HIGHER_DIVIDEND_TAX_RATE_PERCENTAGE,
  ADDITIONAL_DIVIDEND_TAX_RATE_PERCENTAGE,
  dividendTaxBreakdown,
  EV_BIK_RATE_PERCENTAGE,
  numDirs,
  directorBiK,
  anyBiK,
  directorDividendTaxAdjustment,
  syncedLoanPlans,
  studentLoanRepayments,
  anyStudentLoan,
  totalAfterTaxPay,
}: Props) => {
  const netPayPerDirector = (i: number) =>
    totalAfterTaxPay -
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
        <Row label="Gross revenue" value={currencyFormat(totalRevenue)} bold />
        {generalExpenses > 0 && (
          <Row label="General expenses" value={`− ${currencyFormat(generalExpenses)}`} muted />
        )}
        {pensionContributions > 0 && (
          <Row label="Pension contributions" value={`− ${currencyFormat(pensionContributions)}`} muted />
        )}
        <Row label="Corporation tax" value={`− ${currencyFormat(corporationTaxDue)}`} muted />
        <Row label="Retained profits" value={currencyFormat(retainedProfits)} bold />
      </SectionCard>

      {/* Taxable income */}
      <SectionCard
        title={
          numDirs > 1 ? "Taxable income per director" : "Taxable income"
        }
      >
        <Row
          label="Taxable income"
          value={currencyFormat(totalTaxableIncome)}
          bold
        />
        <Row
          label={`Personal allowance`}
          value={currencyFormat(TAX_FREE_PERSONAL_ALLOWANCE_PENCE)}
          muted
        />
      </SectionCard>

      {/* Dividend tax */}
      <SectionCard
        title={
          numDirs > 1
            ? `Dividend tax per director (first ${currencyFormat(DIVIDEND_TAX_FREE_ALLOWANCE_PENCE)} tax-free)`
            : `Dividend tax (first ${currencyFormat(DIVIDEND_TAX_FREE_ALLOWANCE_PENCE)} tax-free)`
        }
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
        />
      </SectionCard>

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
              />
              <Row
                label="Income tax on BiK"
                value={currencyFormat(directorBiK[0].incomeTaxOnBik)}
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
                    />
                    <Row
                      label="Income tax on BiK"
                      value={currencyFormat(bik.incomeTaxOnBik)}
                    />
                    {directorDividendTaxAdjustment[i] > 0 && (
                      <Row
                        label="Additional dividend tax (BiK pushes into higher rate)"
                        value={currencyFormat(directorDividendTaxAdjustment[i])}
                      />
                    )}
                    <Row
                      label="Class 1A NI (company cost)"
                      value={currencyFormat(bik.class1aNI)}
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
              label={
                syncedLoanPlans[0] === "plan1" ? "Plan 1" : "Plan 2"
              }
              value={currencyFormat(studentLoanRepayments[0])}
              bold
            />
          ) : (
            syncedLoanPlans.map((plan, i) =>
              plan !== "none" ? (
                <Row
                  key={i}
                  label={`Director ${i + 1} (${plan === "plan1" ? "Plan 1" : "Plan 2"})`}
                  value={currencyFormat(studentLoanRepayments[i])}
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
        />
      )}
    </div>
  );
};
