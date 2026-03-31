import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

async function setupOutsideIR35(
  user: ReturnType<typeof userEvent.setup>,
  {
    days,
    rate,
    dividends,
    expenses = "0",
    pension = "0",
    numDirectors = "1",
    studentLoanPlan,
    p11d,
    daysMode,
    weeks,
    daysPerWeek,
    taxYear,
  }: {
    days?: string;
    rate: string;
    dividends: string;
    expenses?: string;
    pension?: string;
    numDirectors?: string;
    studentLoanPlan?: "plan1" | "plan2" | "postgrad";
    p11d?: string;
    daysMode?: "weekly";
    weeks?: string;
    daysPerWeek?: string;
    taxYear: string;
  },
) {
  // Outside IR35 is the default tab — no tab click needed
  await user.selectOptions(
    screen.getByRole("combobox", { name: /tax year/i }),
    taxYear,
  );

  if (numDirectors !== "1") {
    const dirsInput = screen.getByRole("spinbutton", {
      name: /number of directors/i,
    });
    await user.clear(dirsInput);
    await user.type(dirsInput, numDirectors);
  }

  if (daysMode === "weekly") {
    await user.click(
      screen.getByRole("radio", { name: /weeks × days per week/i }),
    );
    const weeksInput = screen.getByRole("spinbutton", {
      name: /weeks per year/i,
    });
    await user.clear(weeksInput);
    await user.type(weeksInput, weeks!);
    const dpwInput = screen.getByRole("spinbutton", { name: /days per week/i });
    await user.clear(dpwInput);
    await user.type(dpwInput, daysPerWeek!);
  } else {
    const daysInput = screen.getByRole("spinbutton", {
      name: /days worked annually/i,
    });
    await user.clear(daysInput);
    await user.type(daysInput, days!);
  }

  const rateInput = screen.getByRole("spinbutton", { name: /daily rate/i });
  await user.clear(rateInput);
  await user.type(rateInput, rate);

  // Always open Expenses to clear the default £1,200 general expenses
  await user.click(screen.getByRole("button", { name: /^expenses$/i }));
  const expensesInput = screen.getByRole("spinbutton", {
    name: /annual expenses/i,
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

  const dividendInput = screen.getByRole("spinbutton", {
    name: /annual dividend drawdown/i,
  });
  await user.clear(dividendInput);
  await user.type(dividendInput, dividends);

  if (p11d) {
    await user.click(screen.getByRole("button", { name: /ev company car/i }));
    const p11dInput = screen.getByRole("spinbutton", {
      name: /ev company car p11d value/i,
    });
    await user.clear(p11dInput);
    await user.type(p11dInput, p11d);
  }

  if (studentLoanPlan) {
    await user.click(screen.getByRole("button", { name: /^student loan$/i }));
    const labelMap: Record<string, string> = {
      plan1: "Plan 1",
      plan2: "Plan 2",
      postgrad: "Postgrad Loan",
    };
    await user.click(
      screen.getByRole("checkbox", { name: labelMap[studentLoanPlan] }),
    );
  }
}

// 100 days × £500 = £50,000 gross revenue. Salary £12,564, dividends £25,000. All in basic rate band.
test("outside IR35: basic rate dividends only — 100 days at £500/day with £25,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "100",
    rate: "500",
    dividends: "25000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£50,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£7,112.84");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£5,323.16");

  expect(
    screen.getByRole("definition", { name: /taxable income/i }),
  ).toHaveTextContent("£37,064.00");
  expect(
    screen.getByRole("definition", { name: /personal allowance/i }),
  ).toHaveTextContent("£12,570.00");

  expect(
    screen.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£2,633.11");
  expect(
    screen.getByRole("definition", { name: /higher rate \(35\.75%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /additional rate \(39\.35%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£2,633.11");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£34,930.89",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Dividends £45,000 — basic + higher rate band.
test("outside IR35: higher rate dividends — 200 days at £500/day with £45,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "45000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£100,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£19,420.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£23,015.46");

  expect(
    screen.getByRole("definition", { name: /taxable income/i }),
  ).toHaveTextContent("£57,064.00");
  expect(
    screen.getByRole("definition", { name: /personal allowance/i }),
  ).toHaveTextContent("£12,570.00");

  expect(
    screen.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£3,999.00");
  expect(
    screen.getByRole("definition", { name: /higher rate \(35\.75%\)/i }),
  ).toHaveTextContent("£2,607.61");
  expect(
    screen.getByRole("definition", { name: /additional rate \(39\.35%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£6,606.60");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£50,957.39",
    ),
  ).toBeInTheDocument();
});

// 400 days × £500 = £200,000 gross revenue. Dividends £115,000 — all three bands, personal allowance fully tapered to zero.
test("outside IR35: additional rate with zero personal allowance — 400 days at £500/day with £115,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "400",
    rate: "500",
    dividends: "115000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£200,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£45,920.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£26,515.46");

  expect(
    screen.getByRole("definition", { name: /taxable income/i }),
  ).toHaveTextContent("£127,064.00");
  expect(
    screen.getByRole("definition", { name: /personal allowance/i }),
  ).toHaveTextContent("£0.00");

  expect(
    screen.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£3,999.64");
  expect(
    screen.getByRole("definition", { name: /higher rate \(35\.75%\)/i }),
  ).toHaveTextContent("£26,766.03");
  expect(
    screen.getByRole("definition", { name: /additional rate \(39\.35%\)/i }),
  ).toHaveTextContent("£953.84");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£31,719.51");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£95,844.49",
    ),
  ).toBeInTheDocument();
});

// 150 days × £600 = £90,000 gross revenue. Dividends £30,000, expenses £8,000 reduce taxable profit.
test("outside IR35: general expenses reduce corporation tax — 150 days at £600/day with £30,000 dividends and £8,000 expenses in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "150",
    rate: "600",
    dividends: "30000",
    expenses: "8000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£90,000.00");
  expect(
    screen.getByRole("definition", { name: /general expenses/i }),
  ).toHaveTextContent("£8,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£14,650.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£24,785.46");

  expect(
    screen.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£3,170.61");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£3,170.61");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£39,393.39",
    ),
  ).toBeInTheDocument();
});

// 150 days × £600 = £90,000 gross revenue. Dividends £30,000, pension £10,000 reduce taxable profit.
test("outside IR35: pension contributions reduce corporation tax — 150 days at £600/day with £30,000 dividends and £10,000 pension in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "150",
    rate: "600",
    dividends: "30000",
    pension: "10000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£90,000.00");
  expect(
    screen.getByRole("definition", { name: /pension contributions/i }),
  ).toHaveTextContent("£10,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£14,120.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£23,315.46");

  expect(
    screen.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£3,170.61");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£3,170.61");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£39,393.39",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Salary £12,564 + dividends £25,000 = £37,564 total income.
// Plan 1 threshold £25,000, repayment 9% of (£37,564 − £25,000) = £1,130.76.
test("outside IR35: student loan Plan 1 deducted from net pay — 200 days at £500/day with £25,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "25000",
    studentLoanPlan: "plan1",
    taxYear: "2026/27",
  });

  expect(screen.getByRole("definition", { name: /plan 1/i })).toHaveTextContent(
    "£1,130.76",
  );

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£33,800.14",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Salary £12,564 + dividends £25,000 = £37,564 total income.
// Plan 2 threshold £27,295, repayment 9% of (£37,564 − £27,295) = £924.21.
test("outside IR35: student loan Plan 2 deducted from net pay — 200 days at £500/day with £25,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "25000",
    studentLoanPlan: "plan2",
    taxYear: "2026/27",
  });

  expect(screen.getByRole("definition", { name: /plan 2/i })).toHaveTextContent(
    "£924.21",
  );

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£34,006.68",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. 2 directors, salary £12,564 each, dividends £20,000 each.
// Dividends split evenly — each director pays basic rate only. Net pay per director £30,468.40.
test("outside IR35: two directors split dividends evenly — 200 days at £500/day with £20,000 dividends per director in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "20000",
    numDirectors: "2",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£100,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£16,091.08");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£18,780.92");

  const dir1Tax = within(
    screen.getByRole("region", { name: /director 1 dividend tax/i }),
  );
  expect(
    dir1Tax.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£2,095.61");
  expect(
    dir1Tax.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£2,095.61");

  expect(
    within(
      screen.getByRole("region", { name: "Director 1 net pay" }),
    ).getByText("£30,468.40"),
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("region", { name: "Director 2 net pay" }),
    ).getByText("£30,468.40"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Combined net pay" })).getByText(
      "£60,936.79",
    ),
  ).toBeInTheDocument();
});

// 40 weeks × 5 days = 200 days × £500 = £100,000 gross revenue. Tests the weekly days-mode UI path.
test("outside IR35: weekly days mode — 40 weeks × 5 days at £500/day with £25,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    daysMode: "weekly",
    weeks: "40",
    daysPerWeek: "5",
    rate: "500",
    taxYear: "2026/27",
    dividends: "25000",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£100,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£19,420.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£43,015.46");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£34,930.89",
    ),
  ).toBeInTheDocument();
});

// 500 days × £600 = £300,000 gross revenue. Profit £287,436 — above £250,000 so flat 25% corporation tax applies.
test("outside IR35: corporation tax full rate — 500 days at £600/day with £25,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "500",
    rate: "600",
    dividends: "25000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£300,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£71,859.00");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£190,577.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£34,930.89",
    ),
  ).toBeInTheDocument();
});

// 130 days × £500 = £65,000 gross revenue. Profit £52,436 — just above the £50,000 small profits threshold,
// so marginal relief applies rather than the 19% flat rate.
test("outside IR35: corporation tax marginal relief boundary — 130 days at £500/day with £10,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "130",
    rate: "500",
    dividends: "10000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£65,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£10,145.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£32,290.46");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£21,543.40",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Dividends £20,000. P11D £20,000 → BiK value £800 (4%).
// Total income (£12,564 + £20,000 + £800 = £33,364) stays below the £50,270 higher rate threshold —
// income tax on BiK at basic rate only, no dividend tax adjustment.
test("outside IR35: EV BiK within basic rate band — 200 days at £500/day, £20,000 dividends, £20,000 P11D in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "20000",
    p11d: "20000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£19,420.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£47,895.46");

  expect(
    screen.getByRole("definition", { name: /bik value/i }),
  ).toHaveTextContent("£800.00");
  expect(
    screen.getByRole("definition", { name: /income tax on bik/i }),
  ).toHaveTextContent("£160.00");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£120.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£30,308.40",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Dividends £20,000. P11D £1,000,000 → BiK value £40,000 (4%).
// BiK spans from salary (£12,564) across both basic and higher rate bands.
// Total income + BiK exceeds £50,270 so dividends are pushed into the higher rate band,
// triggering an additional dividend tax adjustment.
test("outside IR35: EV BiK spanning higher rate with dividend tax adjustment — 200 days at £500/day, £20,000 dividends, £1,000,000 P11D in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "20000",
    p11d: "1000000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£19,420.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£42,015.46");

  expect(
    screen.getByRole("definition", { name: /bik value/i }),
  ).toHaveTextContent("£40,000.00");
  expect(
    screen.getByRole("definition", { name: /income tax on bik/i }),
  ).toHaveTextContent("£12,458.80");
  expect(
    screen.getByRole("definition", { name: /additional dividend tax/i }),
  ).toHaveTextContent("£4,875.65");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£6,000.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£13,133.95",
    ),
  ).toBeInTheDocument();
});

// 200 days × £700 = £140,000 gross revenue. Salary £12,564, dividends £90,000.
// Total income £102,564 — above £100,000 taper threshold — PA reduces from £12,570 to £11,288.
// Dividends span both basic and higher rate bands.
test("outside IR35: partial personal allowance taper — 200 days at £700/day with £90,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "700",
    dividends: "90000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£140,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£30,020.54");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£7,415.46");

  expect(
    screen.getByRole("definition", { name: /taxable income/i }),
  ).toHaveTextContent("£102,064.00");
  expect(
    screen.getByRole("definition", { name: /personal allowance/i }),
  ).toHaveTextContent("£11,288.00");

  expect(
    screen.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£3,999.64");
  expect(
    screen.getByRole("definition", { name: /higher rate \(35\.75%\)/i }),
  ).toHaveTextContent("£18,695.10");
  expect(
    screen.getByRole("definition", { name: /additional rate \(39\.35%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£22,694.75");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£79,869.25",
    ),
  ).toBeInTheDocument();
});

// 100 days × £500 = £50,000 gross revenue. Same scenario as the first test but in 2025/26.
// Dividend tax rates differ: 8.75% basic (vs 10.75%), 33.75% higher (vs 35.75%).
test("outside IR35: 2025/26 tax year applies lower dividend rates — 100 days at £500/day with £25,000 dividends", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "100",
    rate: "500",
    dividends: "25000",
    taxYear: "2025/26",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£50,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£7,112.84");

  expect(
    screen.getByRole("definition", { name: /basic rate \(8\.75%\)/i }),
  ).toHaveTextContent("£2,143.22");
  expect(
    screen.getByRole("definition", { name: /higher rate \(33\.75%\)/i }),
  ).toHaveTextContent("£0.00");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£2,143.22");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£35,420.78",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Two directors, dividends £25,000 each.
// Director 1 has Plan 1 (threshold £25,000), Director 2 has Plan 2 (threshold £27,295).
// Tests per-director student loan display and independent repayment calculation.
test("outside IR35: two directors with per-director student loan plans — 200 days at £500/day with £25,000 dividends each in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "25000",
    numDirectors: "2",
    taxYear: "2026/27",
  });

  await user.click(screen.getByRole("button", { name: /^student loan$/i }));
  // 3 checkboxes per director (Plan 1, Plan 2, Postgrad Loan), in order
  const allCheckboxes = screen.getAllByRole("checkbox");
  await user.click(allCheckboxes[0]); // Director 1 Plan 1
  await user.click(allCheckboxes[4]); // Director 2 Plan 2

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£100,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£16,091.08");

  expect(
    screen.getByRole("definition", { name: /director 1 \(plan 1\)/i }),
  ).toHaveTextContent("£1,130.76");
  expect(
    screen.getByRole("definition", { name: /director 2 \(plan 2\)/i }),
  ).toHaveTextContent("£924.21");

  expect(
    within(
      screen.getByRole("region", { name: "Director 1 net pay" }),
    ).getByText("£33,800.14"),
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("region", { name: "Director 2 net pay" }),
    ).getByText("£34,006.68"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Combined net pay" })).getByText(
      "£67,806.82",
    ),
  ).toBeInTheDocument();
});

// O-1: Switch from weekly mode to annual mode and back — annual days input reappears.
// 46 weeks × 5 days = 230 days, then switch back to annual to confirm the direct days input returns.
test("outside IR35: days mode toggle — switch to weekly then back to annual restores direct days input", async () => {
  const user = userEvent.setup();
  render(<Home />);

  // Switch to weekly mode
  await user.click(
    screen.getByRole("radio", { name: /weeks × days per week/i }),
  );

  // Weekly inputs are now visible, annual input is gone
  expect(
    screen.queryByRole("spinbutton", { name: /days worked annually/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("spinbutton", { name: /weeks per year/i }),
  ).toBeInTheDocument();

  // Switch back to annual mode
  await user.click(screen.getByRole("radio", { name: /annual days/i }));

  // Annual input is back, weekly inputs are gone
  expect(
    screen.getByRole("spinbutton", { name: /days worked annually/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("spinbutton", { name: /weeks per year/i }),
  ).not.toBeInTheDocument();
});

// O-2: "Max out" button sets salary to tax-efficient value £12,564.
// Start with a non-default salary, click Max out, confirm the field updates.
test("outside IR35: Max out button sets salary to tax-efficient value in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.selectOptions(
    screen.getByRole("combobox", { name: /tax year/i }),
    "2026/27",
  );

  const salaryInput = screen.getByRole("spinbutton", {
    name: /annual salary drawdown/i,
  });
  await user.clear(salaryInput);
  await user.type(salaryInput, "5000");

  await user.click(screen.getByRole("button", { name: /max out/i }));

  expect(salaryInput).toHaveValue(12564);
});

// O-3: "Efficient" dividend button sets dividend to the maximum within the basic rate band.
// With max salary (£12,564) in 2026/27: higher rate threshold = £12,570 + £37,700 = £50,270.
// Max efficient dividend = £50,270 − £12,564 = £37,706.
test("outside IR35: Efficient button sets dividend to basic rate ceiling in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.selectOptions(
    screen.getByRole("combobox", { name: /tax year/i }),
    "2026/27",
  );

  await user.click(screen.getByRole("button", { name: /efficient/i }));

  const dividendInput = screen.getByRole("spinbutton", {
    name: /annual dividend drawdown/i,
  });
  // Max efficient = (£12,570 + £37,700 − £12,564) = £37,706
  expect(dividendInput).toHaveValue(37706);
});

// O-4: "All" dividend button draws all available profit as dividends.
// 200 days × £500 = £100k gross. Profit after salary £12,564 = £87,436.
// Corp tax (marginal relief) ≈ £19,420.54. Max dividend = £87,436 − £19,421 ≈ £68,015.46.
// The field value should match the displayed maximum.
test("outside IR35: All button sets dividend to maximum available in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.selectOptions(
    screen.getByRole("combobox", { name: /tax year/i }),
    "2026/27",
  );

  const daysInput = screen.getByRole("spinbutton", {
    name: /days worked annually/i,
  });
  await user.clear(daysInput);
  await user.type(daysInput, "200");

  const rateInput = screen.getByRole("spinbutton", { name: /daily rate/i });
  await user.clear(rateInput);
  await user.type(rateInput, "500");

  await user.click(screen.getByRole("button", { name: /^expenses$/i }));
  const expensesInput = screen.getByRole("spinbutton", {
    name: /annual expenses/i,
  });
  await user.clear(expensesInput);
  await user.type(expensesInput, "0");

  await user.click(screen.getByRole("button", { name: /^all$/i }));

  const dividendInput = screen.getByRole("spinbutton", {
    name: /annual dividend drawdown/i,
  });
  // After clicking All, dividend should equal the displayed maximum (£68,015.46)
  expect(dividendInput).toHaveValue(68015.46);
});

// O-6: 2022/23 uses flat 19% corporation tax for all profits (no marginal relief).
// 200 days × £500 = £100,000. Profit after salary £12,564 = £87,436. Corp tax: 19% × £87,436 = £16,612.84.
// In 2026/27 the same scenario attracts marginal relief (£19,420.54), so the year selection matters.
// Using 2 directors to also cover the StatCard non-accent variant (numDirs > 1 path).
test("outside IR35: 2022/23 flat 19% corporation tax — 200 days at £500/day with £25,000 dividends", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "25000",
    taxYear: "2022/23",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£100,000.00");
  // Flat 19%: profit = £100,000 − £12,564 = £87,436. Corp tax = £87,436 × 0.19 = £16,612.84
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£16,612.84");

  // Basic dividend rate for 2022/23 is 8.75%; dividend-free allowance is £2,000 (vs £500 in later years)
  expect(
    screen.getByRole("definition", { name: /basic rate \(8\.75%\)/i }),
  ).toHaveTextContent("£2,011.97");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£2,011.97");
});

// 200 days × £500 = £100,000 gross revenue. Two directors, dividends £20,000 each.
// Director 1 has P11D £50,000 → BiK value £2,000 (4%). Director 2 has no company car.
// Tests per-director BiK rendering (only Director 1's section appears in the EV BiK card).
// BiK stays below the higher rate threshold so no dividend tax adjustment is triggered.
test("outside IR35: two directors — one with EV BiK, one without — 200 days at £500/day with £20,000 dividends each in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "20000",
    numDirectors: "2",
    taxYear: "2026/27",
  });

  await user.click(screen.getByRole("button", { name: /ev company car/i }));
  const p11dDir1 = screen.getByRole("spinbutton", {
    name: /director 1 ev p11d value/i,
  });
  await user.clear(p11dDir1);
  await user.type(p11dDir1, "50000");

  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£16,091.08");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£18,480.92");

  expect(
    screen.getByRole("definition", { name: /bik value/i }),
  ).toHaveTextContent("£2,000.00");
  expect(
    screen.getByRole("definition", { name: /income tax on bik/i }),
  ).toHaveTextContent("£400.00");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£300.00");

  expect(
    within(
      screen.getByRole("region", { name: "Director 1 net pay" }),
    ).getByText("£30,068.40"),
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("region", { name: "Director 2 net pay" }),
    ).getByText("£30,468.40"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Combined net pay" })).getByText(
      "£60,536.79",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Dividends £25,000. P11D £3,000,000 → BiK value £120,000 (4%).
// BiK spans across all three income tax bands (basic, higher, additional above £125,140).
// The income tax on BiK alone (£47,080.00) exceeds take-home pay, producing a negative net pay figure.
test("outside IR35: EV BiK spanning into additional rate band — 200 days at £500/day, £25,000 dividends, £3,000,000 P11D in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "25000",
    p11d: "3000000",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /bik value/i }),
  ).toHaveTextContent("£120,000.00");
  expect(
    screen.getByRole("definition", { name: /income tax on bik/i }),
  ).toHaveTextContent("£47,080.00");
  expect(
    screen.getByRole("definition", { name: /additional dividend tax/i }),
  ).toHaveTextContent("£7,007.65");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£18,000.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£-19,156.75",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Two directors, dividends £20,000 each.
// Director 1 P11D £1,000,000 → BiK value £40,000 (4%). Total income + BiK crosses higher rate
// threshold, triggering an additional dividend tax adjustment row for Director 1.
// Covers the multi-director BiK adjustment branch in ResultsSection.
test("outside IR35: two directors — Director 1 BiK triggers dividend tax adjustment — 200 days at £500/day with £20,000 dividends each in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "20000",
    numDirectors: "2",
    taxYear: "2026/27",
  });

  await user.click(screen.getByRole("button", { name: /ev company car/i }));
  const p11dDir1 = screen.getByRole("spinbutton", {
    name: /director 1 ev p11d value/i,
  });
  await user.clear(p11dDir1);
  await user.type(p11dDir1, "1000000");

  expect(
    screen.getByRole("definition", { name: /bik value/i }),
  ).toHaveTextContent("£40,000.00");
  expect(
    screen.getByRole("definition", { name: /additional dividend tax/i }),
  ).toBeInTheDocument();
});

// 100 days × £500 = £50,000 gross revenue. WFH allowance = £6 × 52 weeks = £312 (1 director).
// Profit = £50,000 − £12,564 − £312 = £37,124. Corp tax at flat 19% = £7,053.56
// (below £50k small profits threshold). Without WFH corp tax = £7,112.84.
// Net pay = salary + dividends − dividend tax + WFH allowance = £35,242.89.
test("outside IR35: WFH allowance checkbox adds £312 expenses, reduces corporation tax, and increases net pay — 100 days at £500/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "100",
    rate: "500",
    dividends: "25000",
    taxYear: "2026/27",
  });

  await user.click(
    screen.getByRole("checkbox", { name: /work from home allowance/i }),
  );

  expect(
    screen.getByRole("definition", { name: /general expenses/i }),
  ).toHaveTextContent("£312.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£7,053.56");
  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£35,242.89",
    ),
  ).toBeInTheDocument();
});

// Per-director salary mode: 2 directors, Director 1 £12,564, Director 2 £8,000.
// 200 days × £500 = £100,000 revenue. Total salary £20,564 reduces corp tax base.
// Director 1 uses full PA so more dividends taxed at 0%; Director 2 has less PA headroom.
// Net pays should differ even though dividends are the same.
test("outside IR35: per-director salary mode — two directors with different salaries produce different net pays — 200 days at £500/day in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "25000",
    numDirectors: "2",
    taxYear: "2026/27",
  });

  // Switch to per-director salary mode
  await user.click(screen.getByRole("radio", { name: /per director/i }));

  const salary1 = screen.getByRole("spinbutton", {
    name: /director 1 annual salary/i,
  });
  await user.clear(salary1);
  await user.type(salary1, "12564");

  const salary2 = screen.getByRole("spinbutton", {
    name: /director 2 annual salary/i,
  });
  await user.clear(salary2);
  await user.type(salary2, "8000");

  // Corp tax: total salary = £20,564, profit = £100,000 - £20,564 = £79,436 (marginal relief)
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£17,300.54");

  // Taxable income differs per director: salary + dividends - dividend allowance
  // Dir 1: £12,564 + £25,000 - £500 = £37,064
  // Dir 2: £8,000 + £25,000 - £500 = £32,500
  expect(
    screen.getByRole("definition", { name: /director 1 taxable income/i }),
  ).toHaveTextContent("£37,064.00");
  expect(
    screen.getByRole("definition", { name: /director 2 taxable income/i }),
  ).toHaveTextContent("£32,500.00");

  // Director 2 has lower salary so more dividend income is above personal allowance → more dividend tax → lower net pay
  const dir1NetPay = within(
    screen.getByRole("region", { name: "Director 1 net pay" }),
  );
  const dir2NetPay = within(
    screen.getByRole("region", { name: "Director 2 net pay" }),
  );
  // Director 1 net pay should be higher (full PA used by salary, more dividends tax-free)
  expect(dir1NetPay.getByText("£34,930.89")).toBeInTheDocument();
  // Director 2 net pay lower (only £8,000 of PA used, more dividends fall above PA → more dividend tax)
  expect(dir2NetPay.getByText("£30,857.53")).toBeInTheDocument();
});

// BiK uses the salary of the director the car is assigned to.
// Director 2 has salary £8,000 (vs £12,564 for Director 1) — BiK value starts within a different
// income tax band, producing a different income tax charge than if Director 1 had the same car.
test("outside IR35: per-director salary — BiK income tax uses assigned director's salary — Director 2 (£8,000 salary) with £500,000 P11D in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "25000",
    numDirectors: "2",
    taxYear: "2026/27",
  });

  // Switch to per-director salary mode
  await user.click(screen.getByRole("radio", { name: /per director/i }));

  const salary2 = screen.getByRole("spinbutton", {
    name: /director 2 annual salary/i,
  });
  await user.clear(salary2);
  await user.type(salary2, "8000");

  // Assign car to Director 2 via the EV company car accordion
  await user.click(screen.getByRole("button", { name: /ev company car/i }));
  const p11dDir2 = screen.getByRole("spinbutton", {
    name: /director 2 ev p11d value/i,
  });
  await user.clear(p11dDir2);
  await user.type(p11dDir2, "500000");

  // BiK value = £500,000 × 4% = £20,000
  expect(
    screen.getByRole("definition", { name: /bik value/i }),
  ).toHaveTextContent("£20,000.00");

  // Director 2 salary £8,000 + dividends £25,000 = total income £33,000 before BiK.
  // BiK £20,000 stacks above total income: bikStart £33,000, bikEnd £53,000.
  // bikInBasic = min(53000, 50270) - 33000 = 17270; bikInHigher = 53000 - 50270 = 2730
  // Income tax on BiK = £17,270 × 20% + £2,730 × 40% = £3,454 + £1,092 = £4,546
  expect(
    screen.getByRole("definition", { name: /income tax on bik/i }),
  ).toHaveTextContent("£4,546.00");
});

// Bug: salary below PA with dividends — BiK income tax was zero because bikStart only used salary,
// not salary + dividends. Total income = £9,326 + £37,706 + BiK £3,240 = £50,272.
// BiK stacks above salary+dividends (£47,032), spanning basic (£3,238) and higher (£2) bands.
// Income tax on BiK = £3,238 × 20% + £2 × 40% = £648.40.
test("outside IR35: BiK income tax accounts for dividends filling basic rate band — salary £9,326, dividends £37,706, P11D £81,000 in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "500",
    dividends: "37706",
    taxYear: "2026/27",
  });

  // Set salary to £9,326
  const salaryInput = screen.getByRole("spinbutton", {
    name: /annual salary drawdown/i,
  });
  await user.clear(salaryInput);
  await user.type(salaryInput, "9326");

  await user.click(screen.getByRole("button", { name: /ev company car/i }));
  const p11dInput = screen.getByRole("spinbutton", {
    name: /ev company car p11d value/i,
  });
  await user.clear(p11dInput);
  await user.type(p11dInput, "81000");

  // BiK value = £81,000 × 4% = £3,240
  expect(
    screen.getByRole("definition", { name: /bik value/i }),
  ).toHaveTextContent("£3,240.00");

  // BiK stacks above salary+dividends (£47,032) — should NOT be zero
  expect(
    screen.getByRole("definition", { name: /income tax on bik/i }),
  ).toHaveTextContent("£648.40");
});

// Per-director salary mode: Director 1 £9,000, Director 2 £12,564.
// Max tax-efficient dividend hint should reflect the director with the highest salary (Dir2 £12,564).
// Higher salary → less room below the higher rate threshold → lower max efficient dividend.
// Dir2: £50,270 − £12,564 = £37,706 (not Dir1's £41,270).
// The hint on the dividend input label should display £37,706.
test("outside IR35: max tax-efficient dividend hint uses highest salary director — Dir1 £9,000, Dir2 £12,564 in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "400",
    rate: "1000",
    dividends: "0",
    numDirectors: "2",
    taxYear: "2026/27",
  });

  // Switch to per-director salary mode
  await user.click(screen.getByRole("radio", { name: /per director/i }));

  const salary1 = screen.getByRole("spinbutton", {
    name: /director 1 annual salary/i,
  });
  await user.clear(salary1);
  await user.type(salary1, "9000");

  // Director 2 keeps default £12,564

  // The Efficient button sets dividend to maxTaxEfficientDividendPence.
  // It should reflect Dir2 (highest salary £12,564): £50,270 − £12,564 = £37,706
  // NOT Dir1's £41,270.
  await user.click(screen.getByRole("button", { name: /efficient/i }));
  expect(
    screen.getByRole("spinbutton", { name: /annual dividend drawdown/i }),
  ).toHaveValue(37706);
});

// Expenses tooltip: opening the Expenses accordion and focusing the tooltip trigger
// should reveal the tooltip panel with role="tooltip".
test("outside IR35: Annual expenses tooltip is shown when trigger is focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: /^expenses$/i }));
  await user.click(
    screen.getByRole("button", { name: "Annual expenses information" }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: Work from home allowance tooltip is shown when trigger is focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: /^expenses$/i }));
  await user.click(
    screen.getByRole("button", {
      name: "Work from home allowance information",
    }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: Annual pension contributions tooltip is shown when trigger is focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: /^expenses$/i }));
  await user.click(
    screen.getByRole("button", {
      name: "Annual pension contributions information",
    }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: taxable income section tooltips are shown when triggers are focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "100",
    rate: "500",
    dividends: "25000",
    taxYear: "2026/27",
  });

  for (const name of [
    "Taxable income information",
    "Personal allowance information",
  ]) {
    await user.click(screen.getByRole("button", { name }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.keyboard("{Escape}");
  }
});

test("outside IR35: company overview tooltips are shown when triggers are focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "100",
    rate: "500",
    dividends: "25000",
    expenses: "1200",
    pension: "500",
    taxYear: "2026/27",
  });

  for (const name of [
    "Gross revenue information",
    "General expenses information",
    "Pension contributions information",
    "Corporation tax information",
    "Retained profits information",
  ]) {
    await user.click(screen.getByRole("button", { name }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.keyboard("{Escape}");
  }
});

test("outside IR35: dividend drawdown tooltip is shown when trigger is focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(
    screen.getByRole("button", {
      name: "Annual dividend drawdown information",
    }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: salary drawdown tooltip is shown when trigger is focused (single director)", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.selectOptions(
    screen.getByRole("combobox", { name: /tax year/i }),
    "2026/27",
  );
  await user.click(
    screen.getByRole("button", { name: "Annual salary drawdown information" }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: Student loan plan tooltip is shown when trigger is focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: /^student loan$/i }));
  await user.click(
    screen.getByRole("button", { name: "Student loan plan information" }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: EV company car P11D tooltip is shown when trigger is focused", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: /^ev company car$/i }));
  await user.click(
    screen.getByRole("button", {
      name: "EV company car P11D value information",
    }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: daily rate tooltip is shown when trigger is clicked", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(
    screen.getByRole("button", { name: "Daily rate information" }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: number of directors tooltip is shown when trigger is clicked", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(
    screen.getByRole("button", { name: "Number of directors information" }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: total dividend tax tooltip is shown when trigger is clicked", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "200",
    rate: "600",
    dividends: "30000",
    taxYear: "2026/27",
  });
  await user.click(
    screen.getByRole("button", { name: "Total dividend tax information" }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: EV BiK results tooltips are shown when triggers are clicked", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: /^ev company car$/i }));
  const p11dInput = screen.getByRole("spinbutton", {
    name: /ev company car p11d value/i,
  });
  await user.clear(p11dInput);
  await user.type(p11dInput, "35000");
  for (const name of [
    "BiK value information",
    "Income tax on BiK information",
    "Class 1A NI information",
  ]) {
    await user.click(screen.getByRole("button", { name }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.keyboard("{Escape}");
  }
});

test("outside IR35: student loan repayment tooltip is shown when trigger is clicked", async () => {
  const user = userEvent.setup();
  render(<Home />);
  // salary £12,564 + dividends £30,000 = £42,564 — above Plan 1 threshold of £25,000
  await setupOutsideIR35(user, {
    days: "200",
    rate: "600",
    dividends: "30000",
    taxYear: "2026/27",
    studentLoanPlan: "plan1",
  });
  await user.click(
    screen.getByRole("button", { name: "Student loan repayment information" }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("outside IR35: net pay tooltip is shown when trigger is clicked", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await user.click(screen.getByRole("button", { name: "Net pay information" }));
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

// 100 days × £500 = £50,000 gross revenue. Salary £12,564, no dividends drawn.
// Only income is salary — dividend tax section shows £0.00, net pay equals salary alone.
test("outside IR35: no dividend drawdown — 100 days at £500/day with £0 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "100",
    rate: "500",
    dividends: "0",
    taxYear: "2026/27",
  });

  expect(
    screen.getByRole("definition", { name: /gross revenue/i }),
  ).toHaveTextContent("£50,000.00");
  expect(
    screen.getByRole("definition", { name: /corporation tax/i }),
  ).toHaveTextContent("£7,112.84");
  expect(
    screen.getByRole("definition", { name: /retained profits/i }),
  ).toHaveTextContent("£30,323.16");

  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
  ).toHaveTextContent("£0.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£12,564.00",
    ),
  ).toBeInTheDocument();
});

// salary £12,564 + dividends £30,000 = £42,564 total income.
// Postgrad threshold £21,000. Above = £21,564. 6% = £1,293.84.
test("outside IR35: postgrad loan deducted from net pay — 180 days at £450/day with £30,000 dividends in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);
  await setupOutsideIR35(user, {
    days: "180",
    rate: "450",
    dividends: "30000",
    taxYear: "2026/27",
    studentLoanPlan: "postgrad",
  });

  expect(
    screen.getByRole("definition", { name: /postgrad loan/i }),
  ).toHaveTextContent("£1,293.84");
});
