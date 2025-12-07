import { useState } from "react";
import { QueryProvider } from "@/lib/query-client";
import { AssignmentsHeader } from "./AssignmentsHeader";
import { AssignmentsFiltersBar } from "./AssignmentsFiltersBar";
import { AssignmentsContent } from "./AssignmentsContent";
import { AssignmentFormModal } from "./AssignmentFormModal";
import { DeleteAssignmentDialog } from "./DeleteAssignmentDialog";
import { useAssignments } from "@/lib/assignments/useAssignments";
import { useDrivers } from "@/lib/assignments/useDrivers";
import { useVehicles } from "@/lib/assignments/useVehicles";
import { useCreateAssignment } from "@/lib/assignments/useCreateAssignment";
import { useUpdateAssignment } from "@/lib/assignments/useUpdateAssignment";
import { useDeleteAssignment } from "@/lib/assignments/useDeleteAssignment";
import type { AssignmentDTO, CreateAssignmentCommand, UpdateAssignmentCommand } from "@/types";
import type { AssignmentFilters, AssignmentViewModel } from "@/lib/assignments/assignmentTypes";
import type { AssignmentFormSchema } from "@/lib/assignments/assignmentFormSchema";

/**
 * AssignmentsViewWithProvider
 *
 * Główny kontener widoku przypisań kierowca-pojazd.
 * Opakowuje całą funkcjonalność w QueryProvider i zarządza stanem globalnym widoku.
 */
export default function AssignmentsViewWithProvider() {
  return (
    <QueryProvider>
      <AssignmentsView />
    </QueryProvider>
  );
}

/**
 * AssignmentsView (wewnętrzny komponent)
 *
 * Główna logika widoku - korzysta z hooków TanStack Query.
 */
function AssignmentsView() {
  // Stan UI dla modali i dialogów
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDTO | null>(null);
  const [selectedAssignmentViewModel, setSelectedAssignmentViewModel] = useState<AssignmentViewModel | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  // Stan filtrów
  const [filters, setFilters] = useState<AssignmentFilters>({
    sortBy: "startDate",
    sortDir: "asc",
    limit: 50,
  });

  // Fetch danych
  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    error: assignmentsErrorData,
    refetch: refetchAssignments,
  } = useAssignments(filters);

  const { data: drivers = [], isLoading: driversLoading } = useDrivers();

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();

  // Mutation hooks
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();

  // Handlery dla akcji
  const handleAddClick = () => {
    setFormMode("create");
    setSelectedAssignment(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (assignment: AssignmentDTO) => {
    setFormMode("edit");
    setSelectedAssignment(assignment);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (assignment: AssignmentDTO) => {
    setSelectedAssignment(assignment);
    // Znajdź pełny ViewModel dla wyświetlenia szczegółów
    const viewModel = assignments.find((a) => a.assignment.uuid === assignment.uuid);
    setSelectedAssignmentViewModel(viewModel || null);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAssignment(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAssignment(null);
    setSelectedAssignmentViewModel(null);
  };

  const handleViewModeChange = (mode: "table" | "timeline") => {
    setViewMode(mode);
  };

  const handleSortChange = (sortBy: string, sortDir: "asc" | "desc") => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as "startDate" | "endDate" | "createdAt",
      sortDir,
    }));
  };

  // Submit handler dla formularza (create/edit)
  const handleFormSubmit = async (data: AssignmentFormSchema) => {
    if (formMode === "create") {
      const command: CreateAssignmentCommand = {
        driverUuid: data.driverUuid,
        vehicleUuid: data.vehicleUuid,
        startDate: data.startDate,
        endDate: data.endDate || null,
      };

      await createMutation.mutateAsync(command);
      handleCloseForm();
    } else if (formMode === "edit" && selectedAssignment) {
      const command: UpdateAssignmentCommand = {
        driverUuid: data.driverUuid,
        vehicleUuid: data.vehicleUuid,
        startDate: data.startDate,
        endDate: data.endDate || null,
      };

      await updateMutation.mutateAsync({
        uuid: selectedAssignment.uuid,
        data: command,
      });
      handleCloseForm();
    }
  };

  // Confirm handler dla dialogu usuwania
  const handleConfirmDelete = async () => {
    if (selectedAssignment) {
      await deleteMutation.mutateAsync(selectedAssignment.uuid);
      handleCloseDeleteDialog();
    }
  };

  // Sprawdź czy są aktywne filtry (dla empty state)
  const hasActiveFilters = Boolean(filters.driverUuid || filters.vehicleUuid || filters.activeOn);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header z tytułem i przyciskiem dodawania */}
      <AssignmentsHeader onAddClick={handleAddClick} viewMode={viewMode} onViewModeChange={handleViewModeChange} />

      {/* Pasek filtrów */}
      <AssignmentsFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        drivers={drivers}
        vehicles={vehicles}
        isLoading={driversLoading || vehiclesLoading}
      />

      {/* Główna zawartość (tabela/karty) */}
      <AssignmentsContent
        assignments={assignments}
        isLoading={assignmentsLoading}
        isError={assignmentsError}
        error={assignmentsErrorData}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onRetry={refetchAssignments}
        onAddClick={handleAddClick}
        hasActiveFilters={hasActiveFilters}
        sortBy={filters.sortBy || "startDate"}
        sortDir={filters.sortDir || "asc"}
        onSortChange={handleSortChange}
      />

      {/* Assignment Form Modal (Create/Edit) */}
      {isFormOpen && (
        <AssignmentFormModal
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          mode={formMode}
          assignment={selectedAssignment}
          drivers={drivers}
          vehicles={vehicles}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Assignment Dialog */}
      {isDeleteDialogOpen && selectedAssignmentViewModel && (
        <DeleteAssignmentDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          assignment={selectedAssignmentViewModel}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
