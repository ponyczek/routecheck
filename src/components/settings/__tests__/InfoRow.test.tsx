import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoRow } from "../InfoRow";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("InfoRow", () => {
  describe("rendering", () => {
    it("renders label and value", () => {
      render(<InfoRow label="Nazwa" value="Test Company" />);

      expect(screen.getByText("Nazwa")).toBeInTheDocument();
      expect(screen.getByText("Test Company")).toBeInTheDocument();
    });

    it("renders without copy button when copyable is false", () => {
      render(<InfoRow label="Nazwa" value="Test Company" copyable={false} />);

      const copyButton = screen.queryByRole("button");
      expect(copyButton).not.toBeInTheDocument();
    });

    it("renders without copy button when copyable is undefined", () => {
      render(<InfoRow label="Nazwa" value="Test Company" />);

      const copyButton = screen.queryByRole("button");
      expect(copyButton).not.toBeInTheDocument();
    });

    it("renders with copy button when copyable is true", () => {
      render(<InfoRow label="UUID" value="123-456-789" copyable />);

      const copyButton = screen.getByRole("button");
      expect(copyButton).toBeInTheDocument();
    });

    it("renders copy button with accessible label", () => {
      render(<InfoRow label="UUID" value="123-456-789" copyable />);

      const copyButton = screen.getByRole("button", { name: /kopiuj uuid/i });
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies correct border styles", () => {
      const { container } = render(<InfoRow label="Test" value="Value" />);

      const row = container.firstChild as HTMLElement;
      expect(row).toHaveClass("border-b");
      expect(row).toHaveClass("last:border-0");
    });

    it("applies flexbox layout", () => {
      const { container } = render(<InfoRow label="Test" value="Value" />);

      const row = container.firstChild as HTMLElement;
      expect(row).toHaveClass("flex");
      expect(row).toHaveClass("justify-between");
      expect(row).toHaveClass("items-center");
    });
  });

  describe("copy functionality", () => {
    let user: ReturnType<typeof userEvent.setup>;
    let clipboardWriteTextSpy: any;

    beforeEach(() => {
      user = userEvent.setup();
      // Mock clipboard API
      clipboardWriteTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        writable: true,
        value: {
          writeText: clipboardWriteTextSpy,
        },
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("copies value to clipboard when copy button is clicked", async () => {
      render(<InfoRow label="UUID" value="123-456-789" copyable />);

      const copyButton = screen.getByRole("button");
      await user.click(copyButton);

      expect(clipboardWriteTextSpy).toHaveBeenCalledWith("123-456-789");
      expect(clipboardWriteTextSpy).toHaveBeenCalledTimes(1);
    });

    it("shows success toast after successful copy", async () => {
      const { toast } = await import("sonner");
      render(<InfoRow label="UUID" value="test-uuid-123" copyable />);

      const copyButton = screen.getByRole("button");
      await user.click(copyButton);

      expect(toast.success).toHaveBeenCalledWith("Skopiowano do schowka", {
        description: "test-uuid-123",
      });
    });

    it("shows error toast when copy fails", async () => {
      const { toast } = await import("sonner");
      clipboardWriteTextSpy.mockRejectedValueOnce(new Error("Clipboard error"));

      render(<InfoRow label="UUID" value="123-456-789" copyable />);

      const copyButton = screen.getByRole("button");
      await user.click(copyButton);

      expect(toast.error).toHaveBeenCalledWith("Nie udało się skopiować");
    });

    it("handles multiple copy clicks", async () => {
      render(<InfoRow label="UUID" value="123-456-789" copyable />);

      const copyButton = screen.getByRole("button");
      await user.click(copyButton);
      await user.click(copyButton);
      await user.click(copyButton);

      expect(clipboardWriteTextSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("edge cases", () => {
    it("handles empty value", () => {
      render(<InfoRow label="Test" value="" />);

      expect(screen.getByText("Test")).toBeInTheDocument();
      // Empty value should still render (as empty text node)
      const value = screen.getByText((content, element) => {
        return element?.className?.includes("font-semibold") && content === "";
      });
      expect(value).toBeInTheDocument();
    });

    it("handles very long value", () => {
      const longValue = "a".repeat(200);
      render(<InfoRow label="Long" value={longValue} />);

      expect(screen.getByText("Long")).toBeInTheDocument();
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it("handles special characters in value", () => {
      const specialValue = "Test & <Company> \"Quotes\" 'Single'";
      render(<InfoRow label="Special" value={specialValue} />);

      expect(screen.getByText(specialValue)).toBeInTheDocument();
    });

    it("handles unicode characters", () => {
      const unicodeValue = "Śląsk Żywiec Łódź 日本語";
      render(<InfoRow label="Unicode" value={unicodeValue} />);

      expect(screen.getByText(unicodeValue)).toBeInTheDocument();
    });
  });
});
