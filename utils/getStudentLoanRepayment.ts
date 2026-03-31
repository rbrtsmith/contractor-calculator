import { Taxes } from "../constants";

const UNDERGRAD_PLANS = ["plan1", "plan2"];
const POSTGRAD_PLAN = "postgrad";

const undergradThreshold = (plans: string[], taxes: Taxes): number | null => {
  const thresholds = plans
    .filter((p) => UNDERGRAD_PLANS.includes(p))
    .map((p) =>
      p === "plan1"
        ? taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE
        : taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE,
    );
  return thresholds.length > 0 ? Math.min(...thresholds) : null;
};

export const getStudentLoanRepayment = ({
  plans,
  incomePence,
  taxes,
}: {
  plans: string[];
  incomePence: number;
  taxes: Taxes;
}): number => {
  const undergradThresholdPence = undergradThreshold(plans, taxes);
  const undergradAbove =
    undergradThresholdPence !== null
      ? Math.max(0, incomePence - undergradThresholdPence)
      : 0;

  const hasPostgrad = plans.includes(POSTGRAD_PLAN);
  const postgradAbove = hasPostgrad
    ? Math.max(0, incomePence - taxes.STUDENT_LOAN_POSTGRAD_THRESHOLD_PENCE)
    : 0;

  return undergradAbove * 0.09 + postgradAbove * 0.06;
};
