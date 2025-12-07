import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailLogsList } from "../EmailLogsList";
import type { EmailLogDTO } from "@/types";

// Mock EmailLogItem to simplify testing
vi.mock("../EmailLogItem", () => ({
  EmailLogItem: ({ log }: { log: EmailLogDTO }) => (
    <li data-testid={`log-${log.uuid}`}>{log.subject}</li>
  ),
}));

describe("EmailLogsList", () => {
  const mockLogs: EmailLogDTO[] = [
    {
      uuid: "log-1",
      recipient: "driver1@example.com",
      subject: "Alert 1",
      status: "SENT",
      sentAt: "2025-11-22T10:00:00Z",
      errorMessage: null,
      companyUuid: "company-1",
    },
    {
      uuid: "log-2",
      recipient: "driver2@example.com",
      subject: "Alert 2",
      status: "SENT",
      sentAt: "2025-11-22T11:00:00Z",
      errorMessage: null,
      companyUuid: "company-1",
    },
    {
      uuid: "log-3",
      recipient: "driver3@example.com",
      subject: "Alert 3",
      status: "FAILED",
      sentAt: "2025-11-22T12:00:00Z",
      errorMessage: "Timeout",
      companyUuid: "company-1",
    },
  ];

  describe("rendering", () => {
    it("renders list of logs", () => {
      render(<EmailLogsList logs={mockLogs} />);

      expect(screen.getByText("Alert 1")).toBeInTheDocument();
      expect(screen.getByText("Alert 2")).toBeInTheDocument();
      expect(screen.getByText("Alert 3")).toBeInTheDocument();
    });

    it("renders correct number of log items", () => {
      render(<EmailLogsList logs={mockLogs} />);

      const logItems = screen.getAllByTestId(/log-/);
      expect(logItems).toHaveLength(3);
    });

    it("renders each log with unique key", () => {
      render(<EmailLogsList logs={mockLogs} />);

      expect(screen.getByTestId("log-log-1")).toBeInTheDocument();
      expect(screen.getByTestId("log-log-2")).toBeInTheDocument();
      expect(screen.getByTestId("log-log-3")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("displays empty state message when no logs", () => {
      render(<EmailLogsList logs={[]} />);

      expect(
        screen.getByText("Brak logów e-mail do wyświetlenia")
      ).toBeInTheDocument();
    });

    it("does not render list when no logs", () => {
      const { container } = render(<EmailLogsList logs={[]} />);

      const list = container.querySelector("ul");
      expect(list).not.toBeInTheDocument();
    });

    it("renders centered empty state", () => {
      render(<EmailLogsList logs={[]} />);

      const emptyState = screen.getByText(
        "Brak logów e-mail do wyświetlenia"
      ).parentElement;
      expect(emptyState).toHaveClass("text-center");
      expect(emptyState).toHaveClass("text-muted-foreground");
    });
  });

  describe("styling", () => {
    it("renders as unordered list", () => {
      const { container } = render(<EmailLogsList logs={mockLogs} />);

      const list = container.querySelector("ul");
      expect(list).toBeInTheDocument();
    });

    it("applies spacing styles to list", () => {
      const { container } = render(<EmailLogsList logs={mockLogs} />);

      const list = container.querySelector("ul");
      expect(list).toHaveClass("space-y-0");
    });
  });

  describe("edge cases", () => {
    it("handles single log", () => {
      render(<EmailLogsList logs={[mockLogs[0]]} />);

      expect(screen.getByText("Alert 1")).toBeInTheDocument();
      const logItems = screen.getAllByTestId(/log-/);
      expect(logItems).toHaveLength(1);
    });

    it("handles large number of logs", () => {
      const manyLogs: EmailLogDTO[] = Array.from({ length: 100 }, (_, i) => ({
        uuid: `log-${i}`,
        recipient: `driver${i}@example.com`,
        subject: `Alert ${i}`,
        status: "SENT" as const,
        sentAt: "2025-11-22T10:00:00Z",
        errorMessage: null,
        companyUuid: "company-1",
      }));

      render(<EmailLogsList logs={manyLogs} />);

      const logItems = screen.getAllByTestId(/log-/);
      expect(logItems).toHaveLength(100);
    });

    it("handles logs with duplicate subjects", () => {
      const duplicateLogs: EmailLogDTO[] = [
        { ...mockLogs[0], uuid: "log-a" },
        { ...mockLogs[0], uuid: "log-b", subject: "Alert 1" },
      ];
      render(<EmailLogsList logs={duplicateLogs} />);

      const alerts = screen.getAllByText("Alert 1");
      expect(alerts).toHaveLength(2);
    });

    it("handles logs with empty subject", () => {
      const logsWithEmpty: EmailLogDTO[] = [
        { ...mockLogs[0], subject: "" },
      ];
      render(<EmailLogsList logs={logsWithEmpty} />);

      expect(screen.getByTestId("log-log-1")).toBeInTheDocument();
    });

    it("handles logs with special characters", () => {
      const specialLogs: EmailLogDTO[] = [
        { ...mockLogs[0], subject: "Alert & <Special> \"Chars\"" },
      ];
      render(<EmailLogsList logs={specialLogs} />);

      expect(screen.getByText("Alert & <Special> \"Chars\"")).toBeInTheDocument();
    });
  });

  describe("combinations", () => {
    it("renders mix of SENT and FAILED logs", () => {
      render(<EmailLogsList logs={mockLogs} />);

      // Should render all logs regardless of status
      const logItems = screen.getAllByTestId(/log-/);
      expect(logItems).toHaveLength(3);
    });

    it("renders logs with and without error messages", () => {
      render(<EmailLogsList logs={mockLogs} />);

      // Should render all logs
      expect(screen.getByTestId("log-log-1")).toBeInTheDocument(); // no error
      expect(screen.getByTestId("log-log-3")).toBeInTheDocument(); // with error
    });
  });
});


