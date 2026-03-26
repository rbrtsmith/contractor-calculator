import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

async function setupInsideIR35(
  user: ReturnType<typeof userEvent.setup>,
  {
    days,
    rate,
    expenses = "0",
    pension = "0",
    studentLoanPlan,
  }: {
    days: string;
    rate: string;
    expenses?: string;
    pension?: string;
    studentLoanPlan?: "plan1" | "plan2";
  },
) {
  await user.click(screen.getByRole("button", { name: /inside ir35/i }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: /tax year/i }),
    "2026/27",
  );

  const daysInput = screen.getByRole("spinbutton", {
    name: /days worked annually/i,
  });
  await user.clear(daysInput);
  await user.type(daysInput, days);

  const rateInput = screen.getByRole("spinbutton", { name: /daily rate/i });
  await user.clear(rateInput);
  await user.type(rateInput, rate);

  await user.click(screen.getByRole("button", { name: /expenses/i }));

  const expensesInput = screen.getByRole("spinbutton", {
    name: /annual allowable expenses/i,
  });
  await user.clear(expensesInput);
  await user.type(expensesInput, expenses);

  if (pension !== "0") {
    const pensionInput = screen.getByRole("spinbutton", {
      name: /annual pension contributions/i,
    });
    await user.clear(pensionInput);
    await user.type(pensionInput, pension);
  }

  if (studentLoanPlan) {
    await user.click(screen.getByRole("button", { name: /student loan/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /student loan plan/i }),
      studentLoanPlan,
    );
  }
}

// 100 days × £250 = £25,000 gross. Gross salary £22,391.30 — basic rate band only.
test("inside IR35: basic rate only — 100 days at £250/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, { days: "100", rate: "250" });

  expect(
    screen.getByRole("definition", { name: /gross contract value/i }),
  ).toHaveTextContent("£25,000.00");
  expect(
    screen.getByRole("definition", { name: /employer ni/i }),
  ).toHaveTextContent("£2,608.70");
  expect(
    screen.getByRole("definition", { name: /gross paye salary/i }),
  ).toHaveTextContent("£22,391.30");

  expect(
    screen.getByRole("definition", { name: /basic \(20%\)/i }),
  ).toHaveTextContent("£1,964.26");
  expect(
    screen.getByRole("definition", { name: /higher \(40%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /additional \(45%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /total income tax/i }),
  ).toHaveTextContent("£1,964.26");

  expect(
    screen.getByRole("definition", { name: /employee ni/i }),
  ).toHaveTextContent("£785.70");

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£19,641.34"),
  ).toBeInTheDocument();
});

// 180 days × £450 = £81,000 gross. Gross salary £71,086.96 — basic + higher rate, full personal allowance.
test("inside IR35: higher rate with full personal allowance — 180 days at £450/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, { days: "180", rate: "450" });

  expect(
    screen.getByRole("definition", { name: /gross contract value/i }),
  ).toHaveTextContent("£81,000.00");
  expect(
    screen.getByRole("definition", { name: /employer ni/i }),
  ).toHaveTextContent("£9,913.04");
  expect(
    screen.getByRole("definition", { name: /gross paye salary/i }),
  ).toHaveTextContent("£71,086.96");

  expect(
    screen.getByRole("definition", { name: /basic \(20%\)/i }),
  ).toHaveTextContent("£7,540.00");
  expect(
    screen.getByRole("definition", { name: /higher \(40%\)/i }),
  ).toHaveTextContent("£8,326.78");
  expect(
    screen.getByRole("definition", { name: /additional \(45%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /total income tax/i }),
  ).toHaveTextContent("£15,866.78");

  expect(
    screen.getByRole("definition", { name: /employee ni/i }),
  ).toHaveTextContent("£3,432.34");

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£51,787.83"),
  ).toBeInTheDocument();
});

// 200 days × £600 = £120,000 gross. Gross salary £105,000 — higher rate, personal allowance tapered from £12,570 to £10,070.
test("inside IR35: higher rate with tapered personal allowance — 200 days at £600/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, { days: "200", rate: "600" });

  expect(
    screen.getByRole("definition", { name: /gross contract value/i }),
  ).toHaveTextContent("£120,000.00");
  expect(
    screen.getByRole("definition", { name: /employer ni/i }),
  ).toHaveTextContent("£15,000.00");
  expect(
    screen.getByRole("definition", { name: /gross paye salary/i }),
  ).toHaveTextContent("£105,000.00");

  expect(
    screen.getByRole("definition", { name: /basic \(20%\)/i }),
  ).toHaveTextContent("£8,040.00");
  expect(
    screen.getByRole("definition", { name: /higher \(40%\)/i }),
  ).toHaveTextContent("£21,892.00");
  expect(
    screen.getByRole("definition", { name: /additional \(45%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /total income tax/i }),
  ).toHaveTextContent("£29,932.00");

  expect(
    screen.getByRole("definition", { name: /employee ni/i }),
  ).toHaveTextContent("£4,110.60");

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£70,957.40"),
  ).toBeInTheDocument();
});

// 240 days × £650 = £156,000 gross. Gross salary £136,304.35 — all three rate bands, personal allowance fully tapered to zero.
test("inside IR35: additional rate with zero personal allowance — 240 days at £650/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, { days: "240", rate: "650" });

  expect(
    screen.getByRole("definition", { name: /gross contract value/i }),
  ).toHaveTextContent("£156,000.00");
  expect(
    screen.getByRole("definition", { name: /employer ni/i }),
  ).toHaveTextContent("£19,695.65");
  expect(
    screen.getByRole("definition", { name: /gross paye salary/i }),
  ).toHaveTextContent("£136,304.35");

  expect(
    screen.getByRole("definition", { name: /basic \(20%\)/i }),
  ).toHaveTextContent("£10,054.00");
  expect(
    screen.getByRole("definition", { name: /higher \(40%\)/i }),
  ).toHaveTextContent("£29,948.00");
  expect(
    screen.getByRole("definition", { name: /additional \(45%\)/i }),
  ).toHaveTextContent("£5,023.96");
  expect(
    screen.getByRole("definition", { name: /total income tax/i }),
  ).toHaveTextContent("£45,025.96");

  expect(
    screen.getByRole("definition", { name: /employee ni/i }),
  ).toHaveTextContent("£4,736.69");

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£86,541.70"),
  ).toBeInTheDocument();
});

// 150 days × £400 = £60,000 gross with £5,000 allowable expenses. Net after deductions £55,000.
test("inside IR35: allowable expenses reduce gross contract value — 150 days at £400/day with £5,000 expenses in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, { days: "150", rate: "400", expenses: "5000" });

  expect(
    screen.getByRole("definition", { name: /gross contract value/i }),
  ).toHaveTextContent("£60,000.00");
  expect(
    screen.getByRole("definition", { name: /allowable expenses/i }),
  ).toHaveTextContent("£5,000.00");
  expect(
    screen.getByRole("definition", { name: /employer ni/i }),
  ).toHaveTextContent("£6,521.74");
  expect(
    screen.getByRole("definition", { name: /gross paye salary/i }),
  ).toHaveTextContent("£48,478.26");

  expect(
    screen.getByRole("definition", { name: /total income tax/i }),
  ).toHaveTextContent("£7,181.65");
  expect(
    screen.getByRole("definition", { name: /employee ni/i }),
  ).toHaveTextContent("£2,872.66");

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£38,423.95"),
  ).toBeInTheDocument();
});

// 180 days × £450 = £81,000 gross with £10,000 pension. Net after deductions £71,000.
test("inside IR35: pension contributions reduce gross contract value — 180 days at £450/day with £10,000 pension in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, { days: "180", rate: "450", pension: "10000" });

  expect(
    screen.getByRole("definition", { name: /gross contract value/i }),
  ).toHaveTextContent("£81,000.00");
  expect(
    screen.getByRole("definition", { name: /pension contributions/i }),
  ).toHaveTextContent("£10,000.00");
  expect(
    screen.getByRole("definition", { name: /employer ni/i }),
  ).toHaveTextContent("£8,608.70");
  expect(
    screen.getByRole("definition", { name: /gross paye salary/i }),
  ).toHaveTextContent("£62,391.30");

  expect(
    screen.getByRole("definition", { name: /total income tax/i }),
  ).toHaveTextContent("£12,388.52");
  expect(
    screen.getByRole("definition", { name: /employee ni/i }),
  ).toHaveTextContent("£3,258.43");

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£46,744.36"),
  ).toBeInTheDocument();
});

// 180 days × £450 = £81,000 gross. Gross salary £71,086.96, Plan 1 threshold £25,000, repayment 9% of excess.
test("inside IR35: student loan Plan 1 deducted from net pay — 180 days at £450/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, {
    days: "180",
    rate: "450",
    studentLoanPlan: "plan1",
  });

  expect(screen.getByRole("definition", { name: /plan 1/i })).toHaveTextContent(
    "£4,147.83",
  );

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£47,640.01"),
  ).toBeInTheDocument();
});

// 180 days × £450 = £81,000 gross. Gross salary £71,086.96, Plan 2 threshold £27,295, repayment 9% of excess.
test("inside IR35: student loan Plan 2 deducted from net pay — 180 days at £450/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupInsideIR35(user, {
    days: "180",
    rate: "450",
    studentLoanPlan: "plan2",
  });

  expect(screen.getByRole("definition", { name: /plan 2/i })).toHaveTextContent(
    "£3,941.28",
  );

  expect(
    within(
      screen.getByRole("region", { name: /net take-home pay/i }),
    ).getByText("£47,846.56"),
  ).toBeInTheDocument();
});
