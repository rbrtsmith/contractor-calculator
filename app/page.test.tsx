import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

test("renders the page", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /contractor income calculator/i })).toBeInTheDocument();
});

test("inside IR35 calculates correct net pay for 230 days at £600/day with no expenses in 2026/27", async () => {
  const user = userEvent.setup();
  render(<Home />);

  await user.click(screen.getByRole("button", { name: /inside ir35/i }));

  // Clear the default £1,200 expenses
  await user.click(screen.getByRole("button", { name: /expenses/i }));
  await user.clear(screen.getByLabelText(/annual allowable expenses/i));
  await user.type(screen.getByLabelText(/annual allowable expenses/i), "0");

  expect(screen.getByText("£120,652.17")).toBeInTheDocument(); // gross PAYE salary
  expect(screen.getByText("£78,470.44")).toBeInTheDocument();  // net take-home pay
});
