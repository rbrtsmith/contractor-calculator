import { Taxes } from "../constants";

const STUDENT_LOAN_REPAYMENT_RATE = 0.09;

export const getStudentLoanRepayment = ({
  plan,
  incomePence,
  taxes,
}: {
  plan: string;
  incomePence: number;
  taxes: Taxes;
}): number => {
  if (plan === "none") return 0;
  const threshold =
    plan === "plan1"
      ? taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE
      : taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE;
  const above = incomePence - threshold;
  return above > 0 ? above * STUDENT_LOAN_REPAYMENT_RATE : 0;
};
