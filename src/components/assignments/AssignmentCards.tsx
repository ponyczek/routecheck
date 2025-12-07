import { AssignmentCard } from "./AssignmentCard";
import type { AssignmentViewModel } from "@/lib/assignments/assignmentTypes";
import type { AssignmentDTO } from "@/types";

interface AssignmentCardsProps {
  assignments: AssignmentViewModel[];
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
  isLoading?: boolean;
}

/**
 * AssignmentCards
 *
 * Responsywna lista kart dla widoku mobilnego.
 * Wyświetlana tylko na mobile (ukryta na desktop: md:hidden).
 */
export function AssignmentCards({ assignments, onEdit, onDelete }: AssignmentCardsProps) {
  return (
    <div className="md:hidden grid grid-cols-1 gap-4">
      {assignments.map((viewModel) => (
        <AssignmentCard key={viewModel.assignment.uuid} assignment={viewModel} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
