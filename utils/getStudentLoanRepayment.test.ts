import { getStudentLoanRepayment } from "./getStudentLoanRepayment";
import { TAXES } from "../constants";

const taxes = TAXES["2026/27"];

describe("getStudentLoanRepayment", () => {
  it("returns 0 for plan none", () => {
    expect(
      getStudentLoanRepayment({ plan: "none", incomePence: 5000000, taxes }),
    ).toBe(0);
  });

  it("returns 0 for plan1 when income is below threshold", () => {
    expect(
      getStudentLoanRepayment({
        plan: "plan1",
        incomePence: taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE - 1,
        taxes,
      }),
    ).toBe(0);
  });

  it("returns 0 for plan2 when income is below threshold", () => {
    expect(
      getStudentLoanRepayment({
        plan: "plan2",
        incomePence: taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE - 1,
        taxes,
      }),
    ).toBe(0);
  });

  it("returns 9% of income above plan1 threshold", () => {
    const incomePence = taxes.STUDENT_LOAN_PLAN1_THRESHOLD_PENCE + 100000;
    expect(getStudentLoanRepayment({ plan: "plan1", incomePence, taxes })).toBe(
      100000 * 0.09,
    );
  });

  it("returns 9% of income above plan2 threshold", () => {
    const incomePence = taxes.STUDENT_LOAN_PLAN2_THRESHOLD_PENCE + 200000;
    expect(getStudentLoanRepayment({ plan: "plan2", incomePence, taxes })).toBe(
      200000 * 0.09,
    );
  });
});
