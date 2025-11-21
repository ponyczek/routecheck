import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthIndicator } from "../PasswordStrengthIndicator";

describe("PasswordStrengthIndicator", () => {
  describe("rendering", () => {
    it("renders nothing for empty password", () => {
      const { container } = render(<PasswordStrengthIndicator password="" />);
      
      expect(container.firstChild).toBeNull();
    });

    it("renders strength indicator for non-empty password", () => {
      render(<PasswordStrengthIndicator password="test" />);
      
      expect(screen.getByText("Siła hasła:")).toBeInTheDocument();
    });
  });

  describe("weak password display", () => {
    it("displays 'Słabe' for weak password", () => {
      render(<PasswordStrengthIndicator password="abc" />);
      
      expect(screen.getByText("Słabe")).toBeInTheDocument();
    });

    it("applies red color class for weak password", () => {
      render(<PasswordStrengthIndicator password="abc" />);
      
      const feedback = screen.getByText("Słabe");
      expect(feedback).toHaveClass("text-red-600");
    });

    it("displays progress bar with red background for weak password", () => {
      const { container } = render(<PasswordStrengthIndicator password="abc" />);
      
      const progressBar = container.querySelector(".bg-red-500");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("medium password display", () => {
    it("displays 'Średnie' for medium password", () => {
      render(<PasswordStrengthIndicator password="Password1" />);
      
      expect(screen.getByText("Średnie")).toBeInTheDocument();
    });

    it("applies yellow color class for medium password", () => {
      render(<PasswordStrengthIndicator password="Password1" />);
      
      const feedback = screen.getByText("Średnie");
      expect(feedback).toHaveClass("text-yellow-600");
    });

    it("displays progress bar with yellow background for medium password", () => {
      const { container } = render(<PasswordStrengthIndicator password="Password1" />);
      
      const progressBar = container.querySelector(".bg-yellow-500");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("strong password display", () => {
    it("displays 'Mocne' for strong password", () => {
      render(<PasswordStrengthIndicator password="SecurePass123!" />);
      
      expect(screen.getByText("Mocne")).toBeInTheDocument();
    });

    it("applies green color class for strong password", () => {
      render(<PasswordStrengthIndicator password="SecurePass123!" />);
      
      const feedback = screen.getByText("Mocne");
      expect(feedback).toHaveClass("text-green-600");
    });

    it("displays progress bar with green background for strong password", () => {
      const { container } = render(<PasswordStrengthIndicator password="SecurePass123!" />);
      
      const progressBar = container.querySelector(".bg-green-500");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA role", () => {
      const { container } = render(<PasswordStrengthIndicator password="test" />);
      
      const indicator = container.querySelector('[role="status"]');
      expect(indicator).toBeInTheDocument();
    });

    it("has aria-live='polite' attribute", () => {
      const { container } = render(<PasswordStrengthIndicator password="test" />);
      
      const indicator = container.querySelector('[aria-live="polite"]');
      expect(indicator).toBeInTheDocument();
    });

    it("hides progress bar from screen readers", () => {
      const { container } = render(<PasswordStrengthIndicator password="test" />);
      
      const progressBar = container.querySelector('[aria-hidden="true"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("dynamic updates", () => {
    it("updates from weak to strong when password changes", () => {
      const { rerender } = render(<PasswordStrengthIndicator password="weak" />);
      
      expect(screen.getByText("Słabe")).toBeInTheDocument();
      
      rerender(<PasswordStrengthIndicator password="SecurePassword123!" />);
      
      expect(screen.queryByText("Słabe")).not.toBeInTheDocument();
      expect(screen.getByText("Mocne")).toBeInTheDocument();
    });

    it("hides indicator when password is cleared", () => {
      const { rerender, container } = render(<PasswordStrengthIndicator password="Password1" />);
      
      expect(screen.getByText("Średnie")).toBeInTheDocument();
      
      rerender(<PasswordStrengthIndicator password="" />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe("progress bar width", () => {
    it("sets appropriate width based on score", () => {
      const { container } = render(<PasswordStrengthIndicator password="Password123" />);
      
      const progressBar = container.querySelector(".transition-all") as HTMLElement;
      const widthStyle = progressBar?.style.width;
      
      expect(widthStyle).toMatch(/^\d+%$/);
    });

    it("has transition class for smooth animation", () => {
      const { container } = render(<PasswordStrengthIndicator password="test" />);
      
      const progressBar = container.querySelector(".transition-all");
      expect(progressBar).toHaveClass("transition-all", "duration-300");
    });
  });

  describe("edge cases", () => {
    it("handles very long password", () => {
      const longPassword = "Aa1!" + "a".repeat(120);
      render(<PasswordStrengthIndicator password={longPassword} />);
      
      expect(screen.getByText(/Słabe|Średnie|Mocne/)).toBeInTheDocument();
    });

    it("handles password with only special characters", () => {
      render(<PasswordStrengthIndicator password="!@#$%^&*" />);
      
      expect(screen.getByText("Słabe")).toBeInTheDocument();
    });

    it("handles password with unicode characters", () => {
      render(<PasswordStrengthIndicator password="Pąśsw0rd123" />);
      
      expect(screen.getByText(/Słabe|Średnie|Mocne/)).toBeInTheDocument();
    });
  });
});

