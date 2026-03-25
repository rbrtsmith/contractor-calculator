import { render, screen } from "@testing-library/react";
import Home from "./index";

test("renders the page", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /contractor income calculator/i })).toBeInTheDocument();
});
