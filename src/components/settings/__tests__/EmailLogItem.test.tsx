import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailLogItem } from "../EmailLogItem";
import type { EmailLogDTO } from "@/types";

// Mock date-fns to have consistent date formatting in tests
vi.mock("date-fns", async () => {
  const actual = await vi.importActual("date-fns");
  return {
    ...actual,
    formatDistanceToNow: vi.fn(() => "5 minut temu"),
  };
});

describe("EmailLogItem", () => {
  let mockLog: EmailLogDTO;

  beforeEach(() => {
    mockLog = {
      uuid: "log-1",
      recipient: "driver@example.com",
      subject: "Alert: Brakujący raport dzienny - 2025-11-22",
      status: "SENT",
      sentAt: "2025-11-22T10:30:00Z",
      errorMessage: null,
      companyUuid: "company-1",
    };
  });

  describe("rendering", () => {
    it("renders log subject", () => {
      render(<EmailLogItem log={mockLog} />);

      expect(
        screen.getByText("Alert: Brakujący raport dzienny - 2025-11-22")
      ).toBeInTheDocument();
    });

    it("renders log recipient", () => {
      render(<EmailLogItem log={mockLog} />);

      expect(screen.getByText("driver@example.com")).toBeInTheDocument();
    });

    it("renders SENT status badge", () => {
      render(<EmailLogItem log={mockLog} />);

      expect(screen.getByText("Wysłano")).toBeInTheDocument();
    });

    it("renders FAILED status badge", () => {
      const failedLog = { ...mockLog, status: "FAILED" as const };
      render(<EmailLogItem log={failedLog} />);

      expect(screen.getByText("Błąd")).toBeInTheDocument();
    });

    it("renders formatted date", () => {
      render(<EmailLogItem log={mockLog} />);

      expect(screen.getByText("5 minut temu")).toBeInTheDocument();
    });

    it("renders error message when present", () => {
      const failedLog: EmailLogDTO = {
        ...mockLog,
        status: "FAILED",
        errorMessage: "SMTP connection timeout",
      };
      render(<EmailLogItem log={failedLog} />);

      expect(screen.getByText("SMTP connection timeout")).toBeInTheDocument();
    });

    it("does not render error message when null", () => {
      render(<EmailLogItem log={mockLog} />);

      const errorText = screen.queryByText(/timeout|error|failed/i);
      expect(errorText).not.toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies correct variant for SENT status", () => {
      const { container } = render(<EmailLogItem log={mockLog} />);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it("applies destructive variant for FAILED status", () => {
      const failedLog = { ...mockLog, status: "FAILED" as const };
      const { container } = render(<EmailLogItem log={failedLog} />);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it("applies border styles to list item", () => {
      const { container } = render(<EmailLogItem log={mockLog} />);

      const listItem = container.firstChild as HTMLElement;
      expect(listItem.tagName).toBe("LI");
      expect(listItem).toHaveClass("border-b");
      expect(listItem).toHaveClass("last:border-0");
    });

    it("applies truncate class to subject", () => {
      render(<EmailLogItem log={mockLog} />);

      const subject = screen.getByText(
        "Alert: Brakujący raport dzienny - 2025-11-22"
      );
      expect(subject).toHaveClass("truncate");
    });

    it("applies truncate class to recipient", () => {
      render(<EmailLogItem log={mockLog} />);

      const recipient = screen.getByText("driver@example.com");
      expect(recipient).toHaveClass("truncate");
    });
  });

  describe("edge cases", () => {
    it("handles very long subject", () => {
      const longSubject = "Very Long Subject ".repeat(20);
      const logWithLongSubject = { ...mockLog, subject: longSubject };
      render(<EmailLogItem log={logWithLongSubject} />);

      expect(screen.getByText(/Very Long Subject/)).toBeInTheDocument();
    });

    it("handles very long email address", () => {
      const longEmail = "very.long.email.address@example-company-domain.com";
      const logWithLongEmail = { ...mockLog, recipient: longEmail };
      render(<EmailLogItem log={logWithLongEmail} />);

      expect(screen.getByText(longEmail)).toBeInTheDocument();
    });

    it("handles very long error message", () => {
      const longError = "Error message ".repeat(50);
      const logWithLongError: EmailLogDTO = {
        ...mockLog,
        status: "FAILED",
        errorMessage: longError,
      };
      render(<EmailLogItem log={logWithLongError} />);

      expect(screen.getByText(/Error message/)).toBeInTheDocument();
    });

    it("handles special characters in subject", () => {
      const specialSubject = "Alert & <Special> \"Chars\" 'Test'";
      const logWithSpecial = { ...mockLog, subject: specialSubject };
      render(<EmailLogItem log={logWithSpecial} />);

      expect(screen.getByText(specialSubject)).toBeInTheDocument();
    });

    it("handles unicode characters in subject", () => {
      const unicodeSubject = "Alert: Kierowca Śląsk Łódź Żywiec";
      const logWithUnicode = { ...mockLog, subject: unicodeSubject };
      render(<EmailLogItem log={logWithUnicode} />);

      expect(screen.getByText(unicodeSubject)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("renders as list item", () => {
      const { container } = render(<EmailLogItem log={mockLog} />);

      const listItem = container.firstChild;
      expect(listItem).toHaveProperty("tagName", "LI");
    });

    it("has title attribute for error message", () => {
      const failedLog: EmailLogDTO = {
        ...mockLog,
        status: "FAILED",
        errorMessage: "Connection timeout",
      };
      render(<EmailLogItem log={failedLog} />);

      const errorElement = screen.getByText("Connection timeout");
      expect(errorElement).toHaveAttribute("title", "Connection timeout");
    });
  });
});


