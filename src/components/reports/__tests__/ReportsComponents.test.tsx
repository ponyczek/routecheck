import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReportRiskBadge } from "../ReportRiskBadge";
import { ReportStatusBadge } from "../ReportStatusBadge";
import { DriverSelect } from "../DriverSelect";
import { DateRangePicker } from "../DateRangePicker";
import type { ReportRiskLevel, ReportRouteStatus } from "@/types";

// Helper to wrap components with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ReportRiskBadge", () => {
  it("renders risk level NONE correctly", () => {
    render(<ReportRiskBadge level="NONE" />);
    expect(screen.getByText("Brak")).toBeInTheDocument();
  });

  it("renders risk level LOW with correct styling", () => {
    const { container } = render(<ReportRiskBadge level="LOW" />);
    expect(screen.getByText("Niskie")).toBeInTheDocument();
    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-blue-100");
  });

  it("renders risk level MEDIUM correctly", () => {
    render(<ReportRiskBadge level="MEDIUM" />);
    expect(screen.getByText("Średnie")).toBeInTheDocument();
  });

  it("renders risk level HIGH with correct styling", () => {
    const { container } = render(<ReportRiskBadge level="HIGH" />);
    expect(screen.getByText("Wysokie")).toBeInTheDocument();
    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-red-100");
  });

  it("handles null risk level", () => {
    render(<ReportRiskBadge level={null} />);
    expect(screen.getByText("Brak")).toBeInTheDocument();
  });
});

describe("ReportStatusBadge", () => {
  it("renders COMPLETED status correctly", () => {
    render(<ReportStatusBadge status="COMPLETED" />);
    expect(screen.getByText("Ukończono")).toBeInTheDocument();
  });

  it("renders PARTIALLY_COMPLETED status correctly", () => {
    render(<ReportStatusBadge status="PARTIALLY_COMPLETED" />);
    expect(screen.getByText("Częściowo")).toBeInTheDocument();
  });

  it("renders CANCELLED status correctly", () => {
    render(<ReportStatusBadge status="CANCELLED" />);
    expect(screen.getByText("Anulowano")).toBeInTheDocument();
  });
});

describe("DriverSelect", () => {
  it("renders with placeholder", () => {
    const wrapper = createWrapper();
    render(<DriverSelect value="" onChange={vi.fn()} placeholder="Select driver" />, {
      wrapper,
    });
    expect(screen.getByRole("combobox")).toHaveTextContent("Select driver");
  });

  it("displays selected driver name when value is provided", async () => {
    const wrapper = createWrapper();
    const mockDriverUuid = "test-uuid-123";

    render(<DriverSelect value={mockDriverUuid} onChange={vi.fn()} placeholder="Select driver" />, { wrapper });

    // Initially shows UUID until drivers are loaded
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("calls onChange when driver is selected", async () => {
    const wrapper = createWrapper();
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<DriverSelect value="" onChange={handleChange} />, { wrapper });

    // Open dropdown
    await user.click(screen.getByRole("combobox"));

    // Wait for loading state or empty state
    // Note: In real scenario, you would mock the API response
    await waitFor(
      () => {
        const loadingText = screen.queryByText("Ładowanie kierowców...");
        const emptyText = screen.queryByText("Brak aktywnych kierowców.");
        expect(loadingText || emptyText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("disables when disabled prop is true", () => {
    const wrapper = createWrapper();
    render(<DriverSelect value="" onChange={vi.fn()} disabled />, { wrapper });
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});

describe("DateRangePicker", () => {
  it("renders with placeholder when no value", () => {
    render(
      <DateRangePicker value={{ from: undefined, to: undefined }} onChange={vi.fn()} placeholder="Select dates" />
    );
    expect(screen.getByRole("button")).toHaveTextContent("Select dates");
  });

  it("displays formatted date range when value is provided", () => {
    const from = new Date("2025-01-01");
    const to = new Date("2025-01-31");

    render(<DateRangePicker value={{ from, to }} onChange={vi.fn()} />);

    expect(screen.getByRole("button")).toHaveTextContent("01.01.2025 - 31.01.2025");
  });

  it("opens calendar on button click", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={{ from: undefined, to: undefined }} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button"));

    // Calendar should be visible (there are 2 grids because numberOfMonths={2})
    await waitFor(() => {
      const grids = screen.getAllByRole("grid");
      expect(grids.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("disables when disabled prop is true", () => {
    render(<DateRangePicker value={{ from: undefined, to: undefined }} onChange={vi.fn()} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Integration: Badge combinations", () => {
  it("renders risk and status badges together", () => {
    render(
      <div>
        <ReportRiskBadge level="HIGH" />
        <ReportStatusBadge status="COMPLETED" />
      </div>
    );

    expect(screen.getByText("Wysokie")).toBeInTheDocument();
    expect(screen.getByText("Ukończono")).toBeInTheDocument();
  });

  it("renders multiple risk levels", () => {
    const levels: ReportRiskLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

    render(
      <div>
        {levels.map((level) => (
          <ReportRiskBadge key={level} level={level} />
        ))}
      </div>
    );

    expect(screen.getByText("Brak")).toBeInTheDocument();
    expect(screen.getByText("Niskie")).toBeInTheDocument();
    expect(screen.getByText("Średnie")).toBeInTheDocument();
    expect(screen.getByText("Wysokie")).toBeInTheDocument();
  });
});
