import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignInFooterLinks } from "../SignInFooterLinks";

describe("SignInFooterLinks", () => {
  it("should render password reset link", () => {
    render(<SignInFooterLinks supportEmail="support@example.com" />);
    
    const resetLink = screen.getByRole("link", { name: /nie pamiętasz hasła/i });
    expect(resetLink).toBeInTheDocument();
    expect(resetLink).toHaveAttribute("href", "/auth/reset");
  });

  it("should render support email link", () => {
    render(<SignInFooterLinks supportEmail="support@example.com" />);
    
    const supportLink = screen.getByRole("link", { name: /skontaktuj się z nami/i });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute("href", "mailto:support@example.com");
  });

  it("should render session expiry notice", () => {
    render(<SignInFooterLinks supportEmail="support@example.com" />);
    
    expect(screen.getByText(/sesja wygasa po 24 godzinach/i)).toBeInTheDocument();
  });

  it("should use provided support email", () => {
    render(<SignInFooterLinks supportEmail="custom@example.com" />);
    
    const supportLink = screen.getByRole("link", { name: /skontaktuj się z nami/i });
    expect(supportLink).toHaveAttribute("href", "mailto:custom@example.com");
  });
});

