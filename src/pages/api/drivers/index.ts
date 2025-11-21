import type { APIRoute } from "astro";
import type { DriversListResponseDTO, DriverDTO } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/drivers
 * 
 * Lists drivers (MOCK DATA for now)
 * TODO: Implement real logic according to api-plan.md
 */
export const GET: APIRoute = async () => {
  // Mock data for development
  const mockDrivers: DriverDTO[] = [
    {
      uuid: "driver-1",
      name: "Jan Kowalski",
      email: "jan.kowalski@example.com",
      timezone: "Europe/Warsaw",
      isActive: true,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      uuid: "driver-2",
      name: "Anna Nowak",
      email: "anna.nowak@example.com",
      timezone: "Europe/Warsaw",
      isActive: true,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      uuid: "driver-3",
      name: "Piotr Wiśniewski",
      email: "piotr.wisniewski@example.com",
      timezone: "Europe/Warsaw",
      isActive: true,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      uuid: "driver-4",
      name: "Maria Wojciechowska",
      email: "maria.wojciechowska@example.com",
      timezone: "Europe/Warsaw",
      isActive: true,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      uuid: "driver-5",
      name: "Tomasz Kamiński",
      email: "tomasz.kaminski@example.com",
      timezone: "Europe/Warsaw",
      isActive: true,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  const response: DriversListResponseDTO = {
    items: mockDrivers,
    nextCursor: null,
  };

  return jsonResponse(response, 200);
};

