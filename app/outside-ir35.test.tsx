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
    studentLoanPlan?: "plan1" | "plan2";
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
  await user.click(screen.getByRole("button", { name: /expenses/i }));
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
    await user.click(screen.getByRole("button", { name: /student loan/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /student loan plan/i }),
      studentLoanPlan,
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

  expect(
    screen.getByRole("definition", { name: /basic rate \(10\.75%\)/i }),
  ).toHaveTextContent("£2,095.61");
  expect(
    screen.getByRole("definition", { name: /total dividend tax/i }),
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
  ).toHaveTextContent("£158.80");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£120.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£30,309.60",
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
  ).toHaveTextContent("£8,457.60");
  expect(
    screen.getByRole("definition", { name: /additional dividend tax/i }),
  ).toHaveTextContent("£4,875.65");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£6,000.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£17,135.15",
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

  await user.click(screen.getByRole("button", { name: /student loan/i }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: /director 1 student loan plan/i }),
    "plan1",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: /director 2 student loan plan/i }),
    "plan2",
  );

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
  ).toHaveTextContent("£398.80");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£300.00");

  expect(
    within(
      screen.getByRole("region", { name: "Director 1 net pay" }),
    ).getByText("£30,069.60"),
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("region", { name: "Director 2 net pay" }),
    ).getByText("£30,468.40"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Combined net pay" })).getByText(
      "£60,537.99",
    ),
  ).toBeInTheDocument();
});

// 200 days × £500 = £100,000 gross revenue. Dividends £25,000. P11D £3,000,000 → BiK value £120,000 (4%).
// BiK spans across all three income tax bands (basic, higher, additional above £125,140).
// The income tax on BiK alone (£40,828.80) exceeds take-home pay, producing a negative net pay figure.
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
  ).toHaveTextContent("£40,828.80");
  expect(
    screen.getByRole("definition", { name: /additional dividend tax/i }),
  ).toHaveTextContent("£7,007.65");
  expect(
    screen.getByRole("definition", { name: /class 1a ni/i }),
  ).toHaveTextContent("£18,000.00");

  expect(
    within(screen.getByRole("region", { name: "Net pay" })).getByText(
      "£-12,905.55",
    ),
  ).toBeInTheDocument();
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
