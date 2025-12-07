import { useQuery } from "@tanstack/react-query";
import type { AssignmentFilters, AssignmentViewModel } from "./assignmentTypes";
import type { AssignmentsListResponseDTO, DriverDTO, VehicleDTO } from "@/types";

/**
 * useAssignments
 *
 * Hook do pobierania listy przypisań z API z opcjonalnymi filtrami.
 * Automatycznie wykonuje join z kierowcami i pojazdami dla uzyskania nazw
 * oraz transformuje dane do AssignmentViewModel z dodatkowymi polami dla UI.
 */
export function useAssignments(filters: AssignmentFilters) {
  return useQuery({
    queryKey: ["assignments", filters],
    queryFn: async (): Promise<AssignmentViewModel[]> => {
      // 1. Build query params
      const params = new URLSearchParams();
      if (filters.driverUuid) params.set("driverUuid", filters.driverUuid);
      if (filters.vehicleUuid) params.set("vehicleUuid", filters.vehicleUuid);
      if (filters.activeOn) params.set("activeOn", filters.activeOn);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params.set("sortDir", filters.sortDir);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.cursor) params.set("cursor", filters.cursor);

      // 2. Fetch assignments
      const response = await fetch(`/api/assignments?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data: AssignmentsListResponseDTO = await response.json();

      // 3. Fetch drivers and vehicles in parallel (for join)
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch("/api/drivers?isActive=true"),
        fetch("/api/vehicles?isActive=true"),
      ]);

      if (!driversRes.ok || !vehiclesRes.ok) {
        throw new Error("Failed to fetch drivers or vehicles");
      }

      const driversData = await driversRes.json();
      const vehiclesData = await vehiclesRes.json();

      const drivers: DriverDTO[] = driversData.items || [];
      const vehicles: VehicleDTO[] = vehiclesData.items || [];

      // 4. Transform to ViewModels
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      return data.items.map((assignment) => {
        const driver = drivers.find((d) => d.uuid === assignment.driverUuid);
        const vehicle = vehicles.find((v) => v.uuid === assignment.vehicleUuid);

        // Calculate if assignment is active today
        const isActive = assignment.startDate <= today && (!assignment.endDate || assignment.endDate >= today);

        // Determine status
        let status: "active" | "completed" | "upcoming";
        if (assignment.startDate > today) {
          status = "upcoming";
        } else if (!assignment.endDate || assignment.endDate >= today) {
          status = "active";
        } else {
          status = "completed";
        }

        // Calculate days remaining
        let daysRemaining: number | null = null;
        if (assignment.endDate && status === "active") {
          const endDateMs = new Date(assignment.endDate).getTime();
          const todayMs = new Date(today).getTime();
          daysRemaining = Math.ceil((endDateMs - todayMs) / (1000 * 60 * 60 * 24));
        }

        return {
          assignment,
          driverName: driver?.name || "Nieznany kierowca",
          vehicleRegistration: vehicle?.registrationNumber || "Nieznany pojazd",
          isActive,
          status,
          daysRemaining,
        };
      });
    },
    staleTime: 30000, // 30s - dane są względnie świeże
    refetchInterval: 60000, // auto-refresh co 60s
    refetchOnWindowFocus: true, // refresh gdy użytkownik wraca do okna
  });
}
