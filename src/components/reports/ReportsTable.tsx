import * as React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportRow } from "./ReportRow";
import type { ReportListItemDTO } from "@/types";

interface ReportsTableProps {
  reports: ReportListItemDTO[];
  onViewReport: (report: ReportListItemDTO) => void;
}

/**
 * Desktop table view for reports list
 */
export function ReportsTable({ reports, onViewReport }: ReportsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[180px]">Kierowca</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[120px]">Ryzyko</TableHead>
            <TableHead className="w-[100px]">Opóźnienie</TableHead>
            <TableHead>Podsumowanie AI</TableHead>
            <TableHead className="w-[120px] text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <ReportRow key={report.uuid} report={report} onView={onViewReport} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}



