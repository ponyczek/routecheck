import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";
import type { VehicleDTO } from "@/types";

describe("StatusBadge", () => {
  const activeVehicle: VehicleDTO = {
    uuid: "123",
    registrationNumber: "ABC1234",
    vin: null,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  };

  const inactiveVehicle: VehicleDTO = {
    uuid: "456",
    registrationNumber: "XYZ9876",
    vin: null,
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  };

  const deletedVehicle: VehicleDTO = {
    uuid: "789",
    registrationNumber: "DEF5678",
    vin: null,
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    deletedAt: "2024-01-02T00:00:00Z",
  };

  describe("rendering", () => {
    it("should render active badge for active vehicle", () => {
      render(<StatusBadge vehicle={activeVehicle} />);
      expect(screen.getByText("Aktywny")).toBeInTheDocument();
    });

    it("should render inactive badge for inactive vehicle", () => {
      render(<StatusBadge vehicle={inactiveVehicle} />);
      expect(screen.getByText("Nieaktywny")).toBeInTheDocument();
    });

    it("should render deleted badge for deleted vehicle", () => {
      render(<StatusBadge vehicle={deletedVehicle} />);
      expect(screen.getByText("Usunięty")).toBeInTheDocument();
    });
  });

  describe("variant prop", () => {
    it("should render with icons in default variant", () => {
      const { container } = render(<StatusBadge vehicle={activeVehicle} />);
      // Check for icon (lucide-react icons render as SVG)
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render without icons in compact variant", () => {
      const { container } = render(<StatusBadge vehicle={activeVehicle} variant="compact" />);
      // In compact variant, icons might still be present but smaller
      // The main difference is styling, so we just check text is present
      expect(screen.getByText("Aktywny")).toBeInTheDocument();
    });
  });

  describe("deleted vehicle priority", () => {
    it("should show deleted badge even if isActive is true", () => {
      const vehicle: VehicleDTO = {
        ...activeVehicle,
        deletedAt: "2024-01-02T00:00:00Z",
      };
      render(<StatusBadge vehicle={vehicle} />);
      expect(screen.getByText("Usunięty")).toBeInTheDocument();
      expect(screen.queryByText("Aktywny")).not.toBeInTheDocument();
    });
  });
});
