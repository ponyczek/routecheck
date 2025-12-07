import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { AssignmentRow } from "./AssignmentRow";
import type { AssignmentViewModel } from "@/lib/assignments/assignmentTypes";
import type { AssignmentDTO } from "@/types";

interface AssignmentsTableProps {
  assignments: AssignmentViewModel[];
  sortBy: 'startDate' | 'endDate' | 'createdAt';
  sortDir: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
  isLoading?: boolean;
}

/**
 * AssignmentsTable
 * 
 * Tabela desktop wyświetlająca listę przypisań z sortowaniem i akcjami.
 * Ukryta na mobile (użyj AssignmentCards zamiast tego).
 */
export function AssignmentsTable({
  assignments,
  sortBy,
  sortDir,
  onSortChange,
  onEdit,
  onDelete,
  isLoading = false,
}: AssignmentsTableProps) {
  const handleSort = (column: 'startDate' | 'endDate') => {
    if (sortBy === column) {
      // Toggle direction if same column
      onSortChange(column, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new column
      onSortChange(column, 'asc');
    }
  };

  const SortIcon = ({ column }: { column: 'startDate' | 'endDate' }) => {
    if (sortBy !== column) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
  };

  return (
    <div className="hidden md:block border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Kierowca</TableHead>
            <TableHead className="w-[20%]">Pojazd</TableHead>
            <TableHead className="w-[18%]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('startDate')}
              >
                Data rozpoczęcia
                <SortIcon column="startDate" />
              </Button>
            </TableHead>
            <TableHead className="w-[18%]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('endDate')}
              >
                Data zakończenia
                <SortIcon column="endDate" />
              </Button>
            </TableHead>
            <TableHead className="w-[12%]">Status</TableHead>
            <TableHead className="w-[7%] text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((viewModel) => (
            <AssignmentRow
              key={viewModel.assignment.uuid}
              assignment={viewModel}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


