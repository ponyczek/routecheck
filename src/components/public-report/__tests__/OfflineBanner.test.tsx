import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "../OfflineBanner";

describe("OfflineBanner", () => {
  it("should not render when online", () => {
    const { container } = render(<OfflineBanner isOnline={true} />);

    expect(container.firstChild).toBeNull();
  });

  it("should render when offline", () => {
    const { container } = render(<OfflineBanner isOnline={false} />);

    // Alert component renders with nested role="alert"
    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it("should display offline message", () => {
    render(<OfflineBanner isOnline={false} />);

    expect(screen.getByText(/Brak połączenia/i)).toBeInTheDocument();
    expect(screen.getByText(/wysłany automatycznie/i)).toBeInTheDocument();
  });

  it("should have aria-live polite for accessibility", () => {
    const { container } = render(<OfflineBanner isOnline={false} />);

    // Get the wrapper div with aria-live
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("should show info icon", () => {
    const { container } = render(<OfflineBanner isOnline={false} />);

    // Icon should be present
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});
