import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateReportCommand, UpdateReportCommand } from "@/types";
import {
  fetchReportsList,
  fetchReportById,
  createReport,
  updateReport,
  deleteReport,
  type ReportsQueryParams,
} from "./api";
import { reportsQueryKeys } from "./queryKeys";
import type { ReportsFiltersState } from "./types";

/**
 * Hook for fetching paginated reports list with infinite scrolling
 */
export function useReports(filters: ReportsFiltersState) {
  return useInfiniteQuery({
    queryKey: reportsQueryKeys.list(filters),
    queryFn: ({ pageParam }) => {
      const params: ReportsQueryParams = {
        from: filters.from,
        to: filters.to,
        includeAi: filters.includeAi,
        limit: 20,
        sortBy: "reportDate",
        sortDir: "desc",
      };

      if (filters.q) params.q = filters.q;
      if (filters.driverUuid) params.driverUuid = filters.driverUuid;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.routeStatus) params.routeStatus = filters.routeStatus;
      if (pageParam) params.cursor = pageParam as string;

      return fetchReportsList(params);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for fetching a single report detail
 */
export function useReportDetail(uuid: string | null, includeAi = true, includeTags = true) {
  return useQuery({
    queryKey: uuid ? reportsQueryKeys.detail(uuid, includeAi, includeTags) : ["reports", "detail", "null"],
    queryFn: () => {
      if (!uuid) throw new Error("Report UUID is required");
      return fetchReportById(uuid, includeAi, includeTags);
    },
    enabled: !!uuid,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for creating a new report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportCommand) => createReport(data),
    onSuccess: () => {
      // Invalidate all reports queries to refetch
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all });
    },
  });
}

/**
 * Hook for updating an existing report
 */
export function useUpdateReport(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateReportCommand) => updateReport(uuid, data),
    onSuccess: () => {
      // Invalidate specific report and all lists
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.detail(uuid) });
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all });
    },
  });
}

/**
 * Hook for deleting a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteReport(uuid),
    onSuccess: () => {
      // Invalidate all reports queries
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all });
    },
  });
}



