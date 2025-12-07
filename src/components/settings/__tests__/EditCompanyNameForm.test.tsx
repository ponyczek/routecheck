import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditCompanyNameForm } from "../EditCompanyNameForm";
import type { CompanyDTO } from "@/types";

// Mock the custom hook
const mockOnSubmit = vi.fn();
const mockForm = {
  control: {} as any,
  handleSubmit: vi.fn((fn) => fn),
  formState: {
    isDirty: false,
    errors: {},
  },
  getValues: vi.fn(() => ({ name: "Test Company" })),
  reset: vi.fn(),
};

vi.mock("@/lib/settings/useCompanyNameForm", () => ({
  useCompanyNameForm: vi.fn(() => ({
    form: mockForm,
    onSubmit: mockOnSubmit,
    isPending: false,
  })),
}));

// Mock shadcn/ui components to simplify testing
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render, name }: any) => {
    const field = { value: "Test Company", onChange: vi.fn(), onBlur: vi.fn(), name, ref: vi.fn() };
    return render({ field });
  },
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormMessage: () => <span data-testid="form-message" />,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} data-testid="name-input" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props} data-testid="submit-button">
      {children}
    </button>
  ),
}));

describe("EditCompanyNameForm", () => {
  const mockCompany: CompanyDTO = {
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    name: "Test Transport Company",
    createdAt: "2024-01-15T10:30:00Z",
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    // Reset form state
    mockForm.formState.isDirty = false;
    mockForm.formState.errors = {};
  });

  describe("rendering", () => {
    it("renders form card with title", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      expect(screen.getByText("Edytuj nazwę firmy")).toBeInTheDocument();
    });

    it("renders form card with description", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      expect(screen.getByText("Zmień nazwę wyświetlaną w aplikacji")).toBeInTheDocument();
    });

    it("renders input field with label", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      expect(screen.getByText("Nazwa firmy")).toBeInTheDocument();
      expect(screen.getByTestId("name-input")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent("Zapisz");
    });
  });

  describe("button states", () => {
    it("disables button when form is not dirty", () => {
      mockForm.formState.isDirty = false;
      render(<EditCompanyNameForm company={mockCompany} />);

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeDisabled();
    });

    it("enables button when form is dirty", () => {
      mockForm.formState.isDirty = true;
      render(<EditCompanyNameForm company={mockCompany} />);

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).not.toBeDisabled();
    });

    it("shows normal text when not submitting", () => {
      mockForm.formState.isDirty = true;
      render(<EditCompanyNameForm company={mockCompany} />);

      expect(screen.getByText("Zapisz")).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("calls onSubmit when form is submitted", async () => {
      mockForm.formState.isDirty = true;
      render(<EditCompanyNameForm company={mockCompany} />);

      const form = screen.getByTestId("card-content").querySelector("form");
      expect(form).toBeInTheDocument();

      // Submit the form
      form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("calls onUpdate callback when provided and submission succeeds", async () => {
      const mockOnUpdate = vi.fn();
      mockForm.formState.isDirty = true;
      mockForm.formState.errors = {}; // No errors
      mockForm.getValues.mockReturnValue("Updated Company Name");

      render(<EditCompanyNameForm company={mockCompany} onUpdate={mockOnUpdate} />);

      const form = screen.getByTestId("card-content").querySelector("form");
      form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          ...mockCompany,
          name: "Updated Company Name",
        });
      });
    });

    it("does not call onUpdate when submission has errors", async () => {
      const mockOnUpdate = vi.fn();
      mockForm.formState.isDirty = true;
      mockForm.formState.errors = { name: { message: "Error" } };

      render(<EditCompanyNameForm company={mockCompany} onUpdate={mockOnUpdate} />);

      const form = screen.getByTestId("card-content").querySelector("form");
      form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(mockOnUpdate).not.toHaveBeenCalled();
      });
    });
  });

  describe("hook integration", () => {
    it("uses form from hook", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      // Form should be rendered with control from hook
      expect(screen.getByTestId("name-input")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has form element", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      const form = screen.getByTestId("card-content").querySelector("form");
      expect(form).toBeInTheDocument();
    });

    it("has proper button type", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("has label for input field", () => {
      render(<EditCompanyNameForm company={mockCompany} />);

      expect(screen.getByText("Nazwa firmy")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles missing onUpdate callback gracefully", async () => {
      mockForm.formState.isDirty = true;
      render(<EditCompanyNameForm company={mockCompany} />);

      const form = screen.getByTestId("card-content").querySelector("form");
      
      // Should not throw error
      expect(() => {
        form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }).not.toThrow();
    });

    it("handles company with minimal data", () => {
      const minimalCompany: CompanyDTO = {
        uuid: "123",
        name: "AB",
        createdAt: "2024-01-01T00:00:00Z",
      };

      render(<EditCompanyNameForm company={minimalCompany} />);

      expect(screen.getByTestId("name-input")).toBeInTheDocument();
    });
  });
});

