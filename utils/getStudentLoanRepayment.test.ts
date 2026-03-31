import { getStudentLoanRepayment } from "./getStudentLoanRepayment";
import { TAXES } from "../constants";

const taxes = TAXES["2026/27"];

describe("getStudentLoanRepayment", () => {
  it("returns 0 for empty plans", () => {
    expect(
      getStudentLoanRepayment({ plans: [], incomePence: 5000000, taxes }),
    ).toBe(0);
  });

  it("returns 0 for plan1 when income is below threshold", () => {
    expect(
      getStudentLoanRepayment({
        plans: ["plan1"],
        incomePence: taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE - 1,
        taxes,
      }),
    ).toBe(0);
  });

  it("returns 0 for plan2 when income is below threshold", () => {
    expect(
      getStudentLoanRepayment({
        plans: ["plan2"],
        incomePence: taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE - 1,
        taxes,
      }),
    ).toBe(0);
  });

  it("returns 9% of income above plan1 threshold", () => {
    const incomePence = taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE + 100000;
    expect(
      getStudentLoanRepayment({ plans: ["plan1"], incomePence, taxes }),
    ).toBe(100000 * 0.09);
  });

  it("returns 9% of income above plan2 threshold", () => {
    const incomePence = taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE + 200000;
    expect(
      getStudentLoanRepayment({ plans: ["plan2"], incomePence, taxes }),
    ).toBe(200000 * 0.09);
  });

  it("returns 0 for postgrad when income is below threshold", () => {
    expect(
      getStudentLoanRepayment({
        plans: ["postgrad"],
        incomePence: taxes.STUDENT_LOAN_POSTGRAD_THRESHOLD_PENCE - 1,
        taxes,
      }),
    ).toBe(0);
  });

  it("returns 6% of income above postgrad threshold", () => {
    const incomePence = taxes.STUDENT_LOAN_POSTGRAD_THRESHOLD_PENCE + 500000;
    expect(
      getStudentLoanRepayment({ plans: ["postgrad"], incomePence, taxes }),
    ).toBe(500000 * 0.06);
  });

  it("with plan1 and plan2: uses plan1 threshold (lowest) for 9% undergrad repayment", () => {
    // Income above plan1 but below plan2 threshold — still repays because plan1 is lower
    const incomePence = taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE + 100000;
    expect(
      getStudentLoanRepayment({
        plans: ["plan1", "plan2"],
        incomePence,
        taxes,
      }),
    ).toBe(100000 * 0.09);
  });

  it("with plan1 and plan2: does NOT double-charge — only 9% once from lowest threshold", () => {
    const incomePence = taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE + 100000;
    // Same result as plan1 alone — not plan1 + plan2 stacked
    const plan1Only = getStudentLoanRepayment({
      plans: ["plan1"],
      incomePence,
      taxes,
    });
    const bothPlans = getStudentLoanRepayment({
      plans: ["plan1", "plan2"],
      incomePence,
      taxes,
    });
    expect(bothPlans).toBe(plan1Only);
  });

  it("with postgrad and plan1: sums undergraduate (9%) and postgrad (6%) independently", () => {
    const incomePence = taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE + 500000;
    const undergradAbove =
      incomePence - taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE;
    const postgradAbove =
      incomePence - taxes.STUDENT_LOAN_POSTGRAD_THRESHOLD_PENCE;
    expect(
      getStudentLoanRepayment({
        plans: ["plan1", "postgrad"],
        incomePence,
        taxes,
      }),
    ).toBe(undergradAbove * 0.09 + postgradAbove * 0.06);
  });

  it("with all three plans: undergraduate uses plan1 threshold, postgrad added independently", () => {
    const incomePence = taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE + 200000;
    const undergradAbove =
      incomePence - taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE;
    const postgradAbove =
      incomePence - taxes.STUDENT_LOAN_POSTGRAD_THRESHOLD_PENCE;
    expect(
      getStudentLoanRepayment({
        plans: ["plan1", "plan2", "postgrad"],
        incomePence,
        taxes,
      }),
    ).toBe(undergradAbove * 0.09 + postgradAbove * 0.06);
  });
});
