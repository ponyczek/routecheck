import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthErrorAlert } from "../AuthErrorAlert";
import type { AuthErrorState } from "@/lib/auth/types";

describe("AuthErrorAlert", () => {
  it("should not render when error is null", () => {
    const { container } = render(<AuthErrorAlert error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render error message", () => {
    const error: AuthErrorState = {
      code: "invalid_credentials",
      message: "Nieprawidłowy email lub hasło",
    };

    render(<AuthErrorAlert error={error} />);

    expect(screen.getByText("Błąd logowania")).toBeInTheDocument();
    expect(screen.getByText("Nieprawidłowy email lub hasło")).toBeInTheDocument();
  });

  it("should render retry button when onRetry is provided", () => {
    const error: AuthErrorState = {
      code: "network",
      message: "Błąd sieci",
    };
    const onRetry = vi.fn();

    render(<AuthErrorAlert error={error} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /spróbuj ponownie/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const error: AuthErrorState = {
      code: "network",
      message: "Błąd sieci",
    };
    const onRetry = vi.fn();

    render(<AuthErrorAlert error={error} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /spróbuj ponownie/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry button when onRetry is not provided", () => {
    const error: AuthErrorState = {
      code: "invalid_credentials",
      message: "Nieprawidłowy email lub hasło",
    };

    render(<AuthErrorAlert error={error} />);

    const retryButton = screen.queryByRole("button", { name: /spróbuj ponownie/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it("should have aria-live assertive for accessibility", () => {
    const error: AuthErrorState = {
      code: "invalid_credentials",
      message: "Test error",
    };

    const { container } = render(<AuthErrorAlert error={error} />);
    const alert = container.querySelector('[aria-live="assertive"]');

    expect(alert).toBeInTheDocument();
  });
});
