import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusSwitch } from "../StatusSwitch";
import userEvent from "@testing-library/user-event";

describe("StatusSwitch", () => {
  it("should render both options", () => {
    render(<StatusSwitch value={false} onChange={vi.fn()} />);

    expect(screen.getByText("Wszystko OK")).toBeInTheDocument();
    expect(screen.getByText("Mam problem")).toBeInTheDocument();
  });

  it("should highlight happy path when value is false", () => {
    render(<StatusSwitch value={false} onChange={vi.fn()} />);

    const happyButton = screen.getByRole("radio", { name: /wszystko ok/i });
    const problemButton = screen.getByRole("radio", { name: /mam problem/i });

    expect(happyButton).toHaveAttribute("aria-checked", "true");
    expect(problemButton).toHaveAttribute("aria-checked", "false");
  });

  it("should highlight problem path when value is true", () => {
    render(<StatusSwitch value={true} onChange={vi.fn()} />);

    const happyButton = screen.getByRole("radio", { name: /wszystko ok/i });
    const problemButton = screen.getByRole("radio", { name: /mam problem/i });

    expect(happyButton).toHaveAttribute("aria-checked", "false");
    expect(problemButton).toHaveAttribute("aria-checked", "true");
  });

  it("should call onChange with false when clicking happy path", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<StatusSwitch value={true} onChange={handleChange} />);

    const happyButton = screen.getByRole("radio", { name: /wszystko ok/i });
    await user.click(happyButton);

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("should call onChange with true when clicking problem path", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<StatusSwitch value={false} onChange={handleChange} />);

    const problemButton = screen.getByRole("radio", { name: /mam problem/i });
    await user.click(problemButton);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("should be keyboard accessible", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<StatusSwitch value={false} onChange={handleChange} />);

    const problemButton = screen.getByRole("radio", { name: /mam problem/i });

    // Focus and press Enter
    problemButton.focus();
    await user.keyboard("{Enter}");

    expect(handleChange).toHaveBeenCalledWith(true);
  });
});
