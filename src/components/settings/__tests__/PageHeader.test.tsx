import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  describe("rendering", () => {
    it("renders title", () => {
      render(<PageHeader title="Test Title" />);

      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("renders title in h1 element", () => {
      render(<PageHeader title="Test Title" />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Test Title");
    });

    it("renders description when provided", () => {
      render(<PageHeader title="Title" description="Test description" />);

      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("does not render description when not provided", () => {
      render(<PageHeader title="Title" />);

      const description = screen.queryByText("Test description");
      expect(description).not.toBeInTheDocument();
    });

    it("renders description when provided as empty string", () => {
      const { container } = render(<PageHeader title="Title" description="" />);

      // Description element should not render for empty string
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBe(0);
    });
  });

  describe("styling", () => {
    it("applies correct spacing class to container", () => {
      const { container } = render(<PageHeader title="Title" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("space-y-1");
    });

    it("applies correct text styles to title", () => {
      render(<PageHeader title="Title" />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveClass("text-3xl");
      expect(heading).toHaveClass("font-bold");
      expect(heading).toHaveClass("tracking-tight");
    });

    it("applies muted foreground to description", () => {
      render(<PageHeader title="Title" description="Description" />);

      const description = screen.getByText("Description");
      expect(description).toHaveClass("text-muted-foreground");
    });
  });

  describe("edge cases", () => {
    it("handles very long title", () => {
      const longTitle = "Very Long Title ".repeat(20);
      render(<PageHeader title={longTitle} />);

      // Use getByRole to find title instead of exact text match
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(/Very Long Title/);
    });

    it("handles very long description", () => {
      const longDescription = "Very Long Description ".repeat(50);
      render(<PageHeader title="Title" description={longDescription} />);

      // Check if text exists in the document without exact match
      const description = screen.getByText(/Very Long Description/);
      expect(description).toBeInTheDocument();
    });

    it("handles special characters in title", () => {
      const specialTitle = "Title & <Special> \"Chars\" 'Test'";
      render(<PageHeader title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it("handles unicode characters in title", () => {
      const unicodeTitle = "Profil firmy - Śląsk Łódź Żywiec";
      render(<PageHeader title={unicodeTitle} />);

      expect(screen.getByText(unicodeTitle)).toBeInTheDocument();
    });

    it("handles multiline description", () => {
      const multilineDesc = "Line 1\nLine 2\nLine 3";
      render(<PageHeader title="Title" description={multilineDesc} />);

      // Check for part of the text
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has only one h1 heading", () => {
      render(<PageHeader title="Title" description="Description" />);

      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
    });

    it("heading has accessible name", () => {
      render(<PageHeader title="Profil firmy" />);

      const heading = screen.getByRole("heading", { name: "Profil firmy" });
      expect(heading).toBeInTheDocument();
    });

    it("description is in a paragraph element", () => {
      render(<PageHeader title="Title" description="Description text" />);

      const description = screen.getByText("Description text");
      expect(description.tagName).toBe("P");
    });
  });

  describe("combinations", () => {
    it("renders title without description correctly", () => {
      render(<PageHeader title="Just Title" />);

      expect(screen.getByText("Just Title")).toBeInTheDocument();
      const paragraphs = document.querySelectorAll("p");
      expect(paragraphs.length).toBe(0);
    });

    it("renders both title and description", () => {
      render(<PageHeader title="Title" description="Description" />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("renders correctly with undefined description", () => {
      render(<PageHeader title="Title" description={undefined} />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      const paragraphs = document.querySelectorAll("p");
      expect(paragraphs.length).toBe(0);
    });
  });
});
