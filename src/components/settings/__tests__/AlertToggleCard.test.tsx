import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertToggleCard } from "../AlertToggleCard";

describe("AlertToggleCard", () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe("rendering", () => {
    it("renders card title", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText("Alerty o brakujących raportach")).toBeInTheDocument();
    });

    it("renders card description", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText("Automatyczne powiadomienia e-mail wysyłane do kierowców")).toBeInTheDocument();
    });

    it("renders info banner", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText(/Alert jest wysyłany raz na brakujący raport/)).toBeInTheDocument();
    });

    it("renders recipient email", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="test@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("renders email label", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText("Adres e-mail administratora")).toBeInTheDocument();
    });

    it("renders toggle switch", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeInTheDocument();
    });

    it("renders toggle label", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText("Włącz alerty")).toBeInTheDocument();
    });
  });

  describe("toggle state", () => {
    it("renders checked switch when alerts enabled", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("data-state", "checked");
    });

    it("renders unchecked switch when alerts disabled", () => {
      render(
        <AlertToggleCard
          alertsEnabled={false}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("data-state", "unchecked");
    });

    it("displays enabled status message when alerts enabled", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText("Alerty są obecnie włączone")).toBeInTheDocument();
    });

    it("displays disabled status message when alerts disabled", () => {
      render(
        <AlertToggleCard
          alertsEnabled={false}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      expect(screen.getByText("Alerty są obecnie wyłączone")).toBeInTheDocument();
    });
  });

  describe("toggle interaction", () => {
    it("calls onToggle with true when switching from off to on", async () => {
      const user = userEvent.setup();

      render(
        <AlertToggleCard
          alertsEnabled={false}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      await user.click(toggle);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith(true);
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
      });
    });

    it("calls onToggle with false when switching from on to off", async () => {
      const user = userEvent.setup();

      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      await user.click(toggle);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith(false);
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
      });
    });

    it("disables toggle when isPending is true", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={true}
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeDisabled();
    });

    it("enables toggle when isPending is false", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeDisabled();
    });

    it("does not call onToggle when disabled and clicked", async () => {
      const user = userEvent.setup();

      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={true}
        />
      );

      const toggle = screen.getByRole("switch");
      await user.click(toggle);

      // Toggle should not be called when disabled
      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("associates label with toggle", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("id", "alerts-toggle");

      const label = screen.getByText("Włącz alerty");
      expect(label).toHaveAttribute("for", "alerts-toggle");
    });

    it("has role switch", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeInTheDocument();
    });

    it("has alert role for info banner", () => {
      render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles very long email address", () => {
      const longEmail = "very.long.email.address.test@example-company-domain.com";
      render(
        <AlertToggleCard alertsEnabled={true} recipientEmail={longEmail} onToggle={mockOnToggle} isPending={false} />
      );

      expect(screen.getByText(longEmail)).toBeInTheDocument();
    });

    it("handles special characters in email", () => {
      const specialEmail = "test+filter@example.com";
      render(
        <AlertToggleCard alertsEnabled={true} recipientEmail={specialEmail} onToggle={mockOnToggle} isPending={false} />
      );

      expect(screen.getByText(specialEmail)).toBeInTheDocument();
    });

    it("handles rapid toggle clicks", async () => {
      const user = userEvent.setup();

      render(
        <AlertToggleCard
          alertsEnabled={false}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);

      // Should be called for each click
      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledTimes(3);
      });
    });

    it("handles async onToggle function", async () => {
      const asyncOnToggle = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <AlertToggleCard
          alertsEnabled={false}
          recipientEmail="admin@example.com"
          onToggle={asyncOnToggle}
          isPending={false}
        />
      );

      const toggle = screen.getByRole("switch");
      await user.click(toggle);

      await waitFor(() => {
        expect(asyncOnToggle).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("styling", () => {
    it("renders as card component", () => {
      const { container } = render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it("applies responsive layout classes", () => {
      const { container } = render(
        <AlertToggleCard
          alertsEnabled={true}
          recipientEmail="admin@example.com"
          onToggle={mockOnToggle}
          isPending={false}
        />
      );

      // Check for responsive flex layout
      const toggleContainer = container.querySelector(".sm\\:flex-row");
      expect(toggleContainer).toBeInTheDocument();
    });
  });
});
