import type {
  VehicleDTO,
  CreateVehicleCommand,
  UpdateVehicleCommand,
  VehiclesListResponseDTO,
} from '@/types';
import type { VehiclesQueryParams } from '../vehicles/types';

/**
 * Serwis do komunikacji z API pojazdów
 */
export const vehiclesService = {
  /**
   * GET /api/vehicles
   * Lista pojazdów z filtrowaniem, sortowaniem i paginacją
   */
  async list(params: VehiclesQueryParams): Promise<VehiclesListResponseDTO> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.set('q', params.q);
    if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
    if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.cursor) queryParams.set('cursor', params.cursor);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortDir) queryParams.set('sortDir', params.sortDir);

    const response = await fetch(`/api/vehicles?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
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
   * POST /api/vehicles
   * Utworzenie nowego pojazdu
   */
  async create(data: CreateVehicleCommand): Promise<VehicleDTO> {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
   * GET /api/vehicles/{uuid}
   * Szczegóły pojedynczego pojazdu
   */
  async get(uuid: string): Promise<VehicleDTO> {
    const response = await fetch(`/api/vehicles/${uuid}`);

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
   * PATCH /api/vehicles/{uuid}
   * Aktualizacja pojazdu
   */
  async update(uuid: string, data: UpdateVehicleCommand): Promise<VehicleDTO> {
    const response = await fetch(`/api/vehicles/${uuid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
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
   * DELETE /api/vehicles/{uuid}
   * Soft delete pojazdu
   */
  async delete(uuid: string): Promise<void> {
    const response = await fetch(`/api/vehicles/${uuid}`, {
      method: 'DELETE',
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


