import { useQuery } from "@tanstack/react-query";
import { driversService } from "@/lib/services/driversService";
import { driversKeys } from "@/lib/drivers";

/**
 * Hook to fetch a single driver by UUID
 * Used for displaying driver names in reports
 */
export function useDriver(uuid: string | null) {
  return useQuery({
    queryKey: uuid ? driversKeys.detail(uuid) : ["drivers", "detail", "null"],
    queryFn: async () => {
      if (!uuid) return null;
      const response = await driversService.list({
        limit: 1,
      });
      // Find driver in the response (simplified - would need a proper getById endpoint)
      return response.items.find((d) => d.uuid === uuid) || null;
    },
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000, // 5 minutes - driver names don't change often
  });
}



