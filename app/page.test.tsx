import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

test("renders the page", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /contractor income calculator/i })).toBeInTheDocument();
});

test("inside IR35 calculates correct net pay for 240 days at £650/day with no expenses in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);

  await user.click(screen.getByRole("button", { name: /inside ir35/i }));

  await user.selectOptions(screen.getByRole("combobox", { name: /tax year/i }), "2026/27");

  const daysInput = screen.getByRole("spinbutton", { name: /days worked annually/i });
  await user.clear(daysInput);
  await user.type(daysInput, "240");

  const dailyRateInput = screen.getByRole("spinbutton", { name: /daily rate/i });
  await user.clear(dailyRateInput);
  await user.type(dailyRateInput, "650");

  await user.click(screen.getByRole("button", { name: /expenses/i }));
  const expensesInput = screen.getByRole("spinbutton", { name: /annual allowable expenses/i });
  await user.clear(expensesInput);
  await user.type(expensesInput, "0");

  expect(within(screen.getByRole("region", { name: /company overview/i })).getByText("£136,304.35")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: /net take-home pay/i })).getByText("£86,541.70")).toBeInTheDocument();
});
