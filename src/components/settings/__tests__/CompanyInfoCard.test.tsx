import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyInfoCard } from "../CompanyInfoCard";
import type { CompanyDTO } from "@/types";

// Mock InfoRow component
vi.mock("../InfoRow", () => ({
  InfoRow: ({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) => (
    <div data-testid={`info-row-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
      {copyable && <button>Copy</button>}
    </div>
  ),
}));

// Mock HelpLink component
vi.mock("../HelpLink", () => ({
  HelpLink: ({ href }: { href: string }) => (
    <a href={href} data-testid="help-link">
      Potrzebujesz pomocy?
    </a>
  ),
}));

// Mock date formatter
vi.mock("@/lib/utils/date", () => ({
  formatLongDate: (date: string) => {
    return new Date(date).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },
}));

describe("CompanyInfoCard", () => {
  const mockCompany: CompanyDTO = {
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    name: "Test Transport Company",
    createdAt: "2024-01-15T10:30:00Z",
  };

  describe("rendering", () => {
    it("renders card title", () => {
      render(<CompanyInfoCard company={mockCompany} />);

      expect(screen.getByText("Dane firmy")).toBeInTheDocument();
    });

    it("renders company name row", () => {
      render(<CompanyInfoCard company={mockCompany} />);

      const nameRow = screen.getByTestId("info-row-Nazwa");
      expect(nameRow).toBeInTheDocument();
      expect(nameRow).toHaveTextContent("Test Transport Company");
    });

    it("renders UUID row with copyable flag", () => {
      render(<CompanyInfoCard company={mockCompany} />);

      const uuidRow = screen.getByTestId("info-row-Identyfikator");
      expect(uuidRow).toBeInTheDocument();
      expect(uuidRow).toHaveTextContent(mockCompany.uuid);
      // Check if copy button exists (via mock)
      expect(uuidRow.querySelector("button")).toBeInTheDocument();
    });

    it("renders creation date row with formatted date", () => {
      render(<CompanyInfoCard company={mockCompany} />);

      const dateRow = screen.getByTestId("info-row-Data utworzenia");
      expect(dateRow).toBeInTheDocument();
      // Date should be formatted
      expect(dateRow).toHaveTextContent(/\d{1,2}\s\w+\s\d{4}/);
    });

    it("renders help link", () => {
      render(<CompanyInfoCard company={mockCompany} />);

      const helpLink = screen.getByTestId("help-link");
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute("href", "/help");
    });
  });

  describe("data display", () => {
    it("displays short company name correctly", () => {
      const shortCompany: CompanyDTO = {
        ...mockCompany,
        name: "AB",
      };
      render(<CompanyInfoCard company={shortCompany} />);

      expect(screen.getByText("AB")).toBeInTheDocument();
    });

    it("displays long company name correctly", () => {
      const longCompany: CompanyDTO = {
        ...mockCompany,
        name: "Very Long Company Name That Goes On And On".repeat(2),
      };
      render(<CompanyInfoCard company={longCompany} />);

      expect(screen.getByText(longCompany.name)).toBeInTheDocument();
    });

    it("displays company name with special characters", () => {
      const specialCompany: CompanyDTO = {
        ...mockCompany,
        name: "Firma & Transport Śląsk Sp. z o.o.",
      };
      render(<CompanyInfoCard company={specialCompany} />);

      expect(screen.getByText(specialCompany.name)).toBeInTheDocument();
    });

    it("displays different UUID formats", () => {
      const customCompany: CompanyDTO = {
        ...mockCompany,
        uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      };
      render(<CompanyInfoCard company={customCompany} />);

      expect(screen.getByText(customCompany.uuid)).toBeInTheDocument();
    });
  });

  describe("date formatting", () => {
    it("formats recent date", () => {
      const recentCompany: CompanyDTO = {
        ...mockCompany,
        createdAt: "2024-11-20T15:45:00Z",
      };
      render(<CompanyInfoCard company={recentCompany} />);

      const dateRow = screen.getByTestId("info-row-Data utworzenia");
      expect(dateRow).toHaveTextContent(/listopad.*2024/i);
    });

    it("formats older date", () => {
      const oldCompany: CompanyDTO = {
        ...mockCompany,
        createdAt: "2020-03-10T08:00:00Z",
      };
      render(<CompanyInfoCard company={oldCompany} />);

      const dateRow = screen.getByTestId("info-row-Data utworzenia");
      // Check for partial match (polish months can vary)
      expect(dateRow).toHaveTextContent(/2020/);
      expect(dateRow).toHaveTextContent(/10/);
    });
  });

  describe("structure", () => {
    it("renders all three info rows", () => {
      render(<CompanyInfoCard company={mockCompany} />);

      expect(screen.getByTestId("info-row-Nazwa")).toBeInTheDocument();
      expect(screen.getByTestId("info-row-Identyfikator")).toBeInTheDocument();
      expect(screen.getByTestId("info-row-Data utworzenia")).toBeInTheDocument();
    });

    it("renders rows in correct order", () => {
      const { container } = render(<CompanyInfoCard company={mockCompany} />);

      const rows = container.querySelectorAll('[data-testid^="info-row"]');
      expect(rows[0]).toHaveAttribute("data-testid", "info-row-Nazwa");
      expect(rows[1]).toHaveAttribute("data-testid", "info-row-Identyfikator");
      expect(rows[2]).toHaveAttribute("data-testid", "info-row-Data utworzenia");
    });
  });

  describe("accessibility", () => {
    it("has semantic card structure", () => {
      render(<CompanyInfoCard company={mockCompany} />);

      // Check that card title is rendered (this is a good accessibility check)
      expect(screen.getByText("Dane firmy")).toBeInTheDocument();

      // Check that info rows are accessible
      expect(screen.getByTestId("info-row-Nazwa")).toBeInTheDocument();
      expect(screen.getByTestId("info-row-Identyfikator")).toBeInTheDocument();
      expect(screen.getByTestId("info-row-Data utworzenia")).toBeInTheDocument();
    });
  });
});
