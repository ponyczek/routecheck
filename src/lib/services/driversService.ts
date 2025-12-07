import type { DriverDTO, CreateDriverCommand, UpdateDriverCommand, DriversListResponseDTO } from "@/types";
import type { DriversQueryParams } from "../drivers/types";

/**
 * Serwis do komunikacji z API kierowców
 */
export const driversService = {
  /**
   * GET /api/drivers
   * Lista kierowców z filtrowaniem, sortowaniem i paginacją
   */
  async list(params: DriversQueryParams): Promise<DriversListResponseDTO> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.set("q", params.q);
    if (params.isActive !== undefined) queryParams.set("isActive", String(params.isActive));
    if (params.includeDeleted) queryParams.set("includeDeleted", "true");
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.cursor) queryParams.set("cursor", params.cursor);
    if (params.sortBy) queryParams.set("sortBy", params.sortBy);
    if (params.sortDir) queryParams.set("sortDir", params.sortDir);

    const response = await fetch(`/api/drivers?${queryParams.toString()}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    }

    return response.json();
  },

  /**
   * POST /api/drivers
   * Utworzenie nowego kierowcy
   */
  async create(data: CreateDriverCommand): Promise<DriverDTO> {
    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    }

    return response.json();
  },

  /**
   * GET /api/drivers/{uuid}
   * Szczegóły pojedynczego kierowcy
   */
  async get(uuid: string): Promise<DriverDTO> {
    const response = await fetch(`/api/drivers/${uuid}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    }

    return response.json();
  },

  /**
   * PATCH /api/drivers/{uuid}
   * Aktualizacja kierowcy
   */
  async update(uuid: string, data: UpdateDriverCommand): Promise<DriverDTO> {
    const response = await fetch(`/api/drivers/${uuid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    }

    return response.json();
  },

  /**
   * DELETE /api/drivers/{uuid}
   * Soft delete kierowcy
   */
  async delete(uuid: string): Promise<void> {
    const response = await fetch(`/api/drivers/${uuid}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    }
  },
};
