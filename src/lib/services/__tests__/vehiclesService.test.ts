import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { vehiclesService } from "../vehiclesService";
import type { CreateVehicleCommand, UpdateVehicleCommand } from "@/types";

// Mock fetch globally
global.fetch = vi.fn();

describe("vehiclesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list", () => {
    it("should fetch vehicles list with query params", async () => {
      const mockResponse = {
        items: [
          {
            uuid: "123",
            registrationNumber: "ABC1234",
            vin: "1HGBH41JXMN109186",
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            deletedAt: null,
          },
        ],
        nextCursor: "cursor-1",
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await vehiclesService.list({
        q: "ABC",
        isActive: true,
        includeDeleted: false,
        limit: 20,
        cursor: "cursor-0",
        sortBy: "registrationNumber",
        sortDir: "asc",
      });

      expect(fetch).toHaveBeenCalledWith(
        "/api/vehicles?q=ABC&isActive=true&limit=20&cursor=cursor-0&sortBy=registrationNumber&sortDir=asc",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it("should handle empty query params", async () => {
      const mockResponse = { items: [], nextCursor: null };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await vehiclesService.list({});

      expect(fetch).toHaveBeenCalledWith("/api/vehicles?", {
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should throw error on failed request", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ message: "Server error" }),
      } as Response);

      await expect(vehiclesService.list({})).rejects.toMatchObject({
        response: {
          status: 500,
          statusText: "Internal Server Error",
        },
      });
    });
  });

  describe("create", () => {
    it("should create vehicle", async () => {
      const command: CreateVehicleCommand = {
        registrationNumber: "ABC1234",
        vin: "1HGBH41JXMN109186",
        isActive: true,
      };

      const mockResponse = {
        uuid: "123",
        ...command,
        createdAt: "2024-01-01T00:00:00Z",
        deletedAt: null,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await vehiclesService.create(command);

      expect(fetch).toHaveBeenCalledWith("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      expect(result).toEqual(mockResponse);
    });

    it("should handle 409 conflict error", async () => {
      const command: CreateVehicleCommand = {
        registrationNumber: "ABC1234",
        vin: null,
        isActive: true,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: async () => ({ code: "duplicate_registration_number" }),
      } as Response);

      await expect(vehiclesService.create(command)).rejects.toMatchObject({
        response: {
          status: 409,
        },
      });
    });
  });

  describe("get", () => {
    it("should fetch single vehicle", async () => {
      const mockResponse = {
        uuid: "123",
        registrationNumber: "ABC1234",
        vin: "1HGBH41JXMN109186",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        deletedAt: null,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await vehiclesService.get("123");

      expect(fetch).toHaveBeenCalledWith("/api/vehicles/123");
      expect(result).toEqual(mockResponse);
    });

    it("should handle 404 not found", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Vehicle not found" }),
      } as Response);

      await expect(vehiclesService.get("invalid")).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });

  describe("update", () => {
    it("should update vehicle", async () => {
      const command: UpdateVehicleCommand = {
        registrationNumber: "XYZ9876",
        isActive: false,
      };

      const mockResponse = {
        uuid: "123",
        registrationNumber: "XYZ9876",
        vin: "1HGBH41JXMN109186",
        isActive: false,
        createdAt: "2024-01-01T00:00:00Z",
        deletedAt: null,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await vehiclesService.update("123", command);

      expect(fetch).toHaveBeenCalledWith("/api/vehicles/123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("delete", () => {
    it("should delete vehicle", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      await vehiclesService.delete("123");

      expect(fetch).toHaveBeenCalledWith("/api/vehicles/123", {
        method: "DELETE",
      });
    });

    it("should handle delete error", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Vehicle not found" }),
      } as Response);

      await expect(vehiclesService.delete("invalid")).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });
});
