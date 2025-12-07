import * as React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportRow } from "./ReportRow";
import type { ReportListItemDTO, Uuid } from "@/types";

export interface ReportsTableProps {
  reports: ReportListItemDTO[];
  onRowClick: (reportUuid: Uuid) => void;
}

/**
 * ReportsTable - Desktop table view for reports
 *
 * Features:
 * - Responsive table with horizontal scroll on smaller screens
 * - Sortable columns (future enhancement)
 * - ARIA labels for accessibility
 * - Empty state handled by parent component
 *
 * Columns:
 * - Kierowca (Driver)
 * - Status trasy (Route Status)
 * - Opóźnienie (Delay)
 * - Ryzyko (Risk Level)
 * - Akcje (Actions)
 */
export function ReportsTable({ reports, onRowClick }: ReportsTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kierowca</TableHead>
            <TableHead>Status trasy</TableHead>
            <TableHead>Opóźnienie</TableHead>
            <TableHead>Ryzyko</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                Brak raportów do wyświetlenia
              </td>
            </TableRow>
          ) : (
            reports.map((report) => <ReportRow key={report.uuid} report={report} onRowClick={onRowClick} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
