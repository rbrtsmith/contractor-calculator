import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "./Tooltip";

const defaultProps = {
  triggerLabel: "Annual expenses information",
  content: "This is the tooltip content",
};

test("tooltip panel is hidden initially", () => {
  render(<Tooltip {...defaultProps} />);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

test("tooltip panel is shown when trigger receives focus", async () => {
  const user = userEvent.setup();
  render(<Tooltip {...defaultProps} />);
  await user.tab();
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
  expect(screen.getByRole("tooltip")).toHaveTextContent(
    "This is the tooltip content",
  );
});

test("tooltip panel is shown when trigger is hovered", async () => {
  const user = userEvent.setup();
  render(<Tooltip {...defaultProps} />);
  await user.hover(
    screen.getByRole("button", { name: /annual expenses information/i }),
  );
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("tooltip panel is hidden when Escape is pressed while trigger is focused", async () => {
  const user = userEvent.setup();
  render(<Tooltip {...defaultProps} />);
  await user.tab();
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

test("tooltip panel is hidden when trigger loses focus (blur)", async () => {
  const user = userEvent.setup();
  render(
    <div>
      <Tooltip {...defaultProps} />
      <button>other</button>
    </div>,
  );
  await user.tab();
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
  await user.tab();
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

test("tooltip panel is hidden when mouse leaves the trigger", async () => {
  const user = userEvent.setup();
  render(<Tooltip {...defaultProps} />);
  const trigger = screen.getByRole("button", {
    name: /annual expenses information/i,
  });
  await user.hover(trigger);
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
  await user.unhover(trigger);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

test("trigger button has the provided accessible name", () => {
  render(<Tooltip {...defaultProps} />);
  expect(
    screen.getByRole("button", { name: "Annual expenses information" }),
  ).toBeInTheDocument();
});

test("tooltip panel has role=tooltip", async () => {
  const user = userEvent.setup();
  render(<Tooltip {...defaultProps} />);
  await user.tab();
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("trigger button has aria-describedby pointing to tooltip id when visible", async () => {
  const user = userEvent.setup();
  render(<Tooltip {...defaultProps} />);
  const trigger = screen.getByRole("button", {
    name: /annual expenses information/i,
  });
  await user.tab();
  const panel = screen.getByRole("tooltip");
  expect(panel).toHaveAttribute("id");
  expect(trigger).toHaveAttribute("aria-describedby", panel.getAttribute("id"));
});

test("trigger button does not have aria-describedby when tooltip is hidden", () => {
  render(<Tooltip {...defaultProps} />);
  const trigger = screen.getByRole("button", {
    name: /annual expenses information/i,
  });
  expect(trigger).not.toHaveAttribute("aria-describedby");
});
