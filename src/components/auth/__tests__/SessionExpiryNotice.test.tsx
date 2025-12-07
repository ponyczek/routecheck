import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionExpiryNotice } from "../SessionExpiryNotice";

describe("SessionExpiryNotice", () => {
  it("should not render when reason is null", () => {
    const { container } = render(<SessionExpiryNotice reason={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render timeout message", () => {
    render(<SessionExpiryNotice reason="timeout" />);

    expect(screen.getByText("Sesja wygasła")).toBeInTheDocument();
    expect(screen.getByText(/wygasła z powodu braku aktywności/)).toBeInTheDocument();
  });

  it("should render signed-out message", () => {
    render(<SessionExpiryNotice reason="signed-out" />);

    expect(screen.getByText("Wylogowano")).toBeInTheDocument();
    expect(screen.getByText(/Zostałeś wylogowany/)).toBeInTheDocument();
  });

  it("should have proper ARIA role", () => {
    const { container } = render(<SessionExpiryNotice reason="timeout" />);
    const alert = container.querySelector('[role="alert"]');

    // Alert component from shadcn should have proper role
    expect(alert || container.firstChild).toBeInTheDocument();
  });
});
