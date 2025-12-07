import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormFooter } from "../FormFooter";

describe("FormFooter", () => {
  const defaultProps = {
    editableUntil: "2025-12-01T21:10:00Z",
  };

  it("should render edit window info", () => {
    render(<FormFooter {...defaultProps} />);

    expect(screen.getByText(/10 minut/i)).toBeInTheDocument();
    expect(screen.getByText(/edytować ten raport/i)).toBeInTheDocument();
  });

  it("should render editable until timestamp", () => {
    render(<FormFooter {...defaultProps} />);

    expect(screen.getByText(/Edycja dostępna do:/i)).toBeInTheDocument();

    const timeElement = screen.getByText(/Edycja dostępna do:/i).parentElement?.querySelector("time");
    expect(timeElement).toHaveAttribute("dateTime", defaultProps.editableUntil);
  });

  it("should render privacy notice", () => {
    render(<FormFooter {...defaultProps} />);

    expect(screen.getByText(/dane są chronione/i)).toBeInTheDocument();
  });

  it("should have proper visual styling", () => {
    const { container } = render(<FormFooter {...defaultProps} />);

    // Should have blue info box
    const infoBox = container.querySelector(".bg-blue-50");
    expect(infoBox).toBeInTheDocument();
  });
});
