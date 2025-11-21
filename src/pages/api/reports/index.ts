import type { APIRoute } from "astro";
import type { ReportsListResponseDTO, ReportListItemDTO } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/reports
 * 
 * Lists reports with filtering (MOCK DATA for now)
 * TODO: Implement real logic according to api-plan.md
 */
export const GET: APIRoute = async () => {
  // Mock data for development
  const mockReports: ReportListItemDTO[] = [
    {
      uuid: "report-1",
      companyUuid: "company-1",
      driverUuid: "Jan Kowalski",
      reportDate: new Date().toISOString().split('T')[0],
      timezone: "Europe/Warsaw",
      occurredAt: new Date().toISOString(),
      routeStatus: "COMPLETED",
      delayMinutes: 0,
      delayReason: null,
      cargoDamageDescription: null,
      vehicleDamageDescription: null,
      nextDayBlockers: null,
      isProblem: false,
      riskLevel: "NONE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ai: {
        reportUuid: "report-1",
        reportDate: new Date().toISOString().split('T')[0],
        aiSummary: "Trasa przebiegła zgodnie z planem, bez opóźnień.",
        riskLevel: "NONE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      uuid: "report-2",
      companyUuid: "company-1",
      driverUuid: "Anna Nowak",
      reportDate: new Date().toISOString().split('T')[0],
      timezone: "Europe/Warsaw",
      occurredAt: new Date().toISOString(),
      routeStatus: "COMPLETED",
      delayMinutes: 15,
      delayReason: "Korek na autostradzie A1",
      cargoDamageDescription: null,
      vehicleDamageDescription: null,
      nextDayBlockers: null,
      isProblem: true,
      riskLevel: "LOW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ai: {
        reportUuid: "report-2",
        reportDate: new Date().toISOString().split('T')[0],
        aiSummary: "Niewielkie opóźnienie z powodu korku, bez większych konsekwencji.",
        riskLevel: "LOW",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      uuid: "report-3",
      companyUuid: "company-1",
      driverUuid: "Piotr Wiśniewski",
      reportDate: new Date().toISOString().split('T')[0],
      timezone: "Europe/Warsaw",
      occurredAt: new Date().toISOString(),
      routeStatus: "PARTIALLY_COMPLETED",
      delayMinutes: 120,
      delayReason: "Awaria samochodu",
      cargoDamageDescription: null,
      vehicleDamageDescription: "Uszkodzony pas klinowy",
      nextDayBlockers: "Samochód w warsztacie, potrzebna zastępcza",
      isProblem: true,
      riskLevel: "HIGH",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ai: {
        reportUuid: "report-3",
        reportDate: new Date().toISOString().split('T')[0],
        aiSummary: "Poważna awaria pojazdu wymagająca interwencji warsztatu. Trasa nie została ukończona.",
        riskLevel: "HIGH",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ];

  const response: ReportsListResponseDTO = {
    items: mockReports,
    nextCursor: null,
  };

  return jsonResponse(response, 200);
};

