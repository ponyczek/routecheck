import { useState, useCallback } from "react";
import { VehiclesHeader } from "./VehiclesHeader";
import { VehiclesFiltersBar } from "./VehiclesFiltersBar";
import { VehiclesTable } from "./VehiclesTable";
import { VehiclesCardList } from "./VehiclesCardList";
import { AddEditVehicleModal } from "./AddEditVehicleModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { LoadingSkeletons } from "./LoadingSkeletons";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { useVehiclesFilters } from "@/lib/vehicles/useVehiclesFilters";
import { useVehiclesList } from "@/lib/vehicles/useVehiclesList";
import { useUpdateVehicle } from "@/lib/vehicles/useUpdateVehicle";
import { useDeleteVehicle } from "@/lib/vehicles/useDeleteVehicle";
import { usePagination } from "@/lib/vehicles/usePagination";
import { useMediaQuery } from "@/lib/vehicles/useMediaQuery";
import type { VehicleDTO } from "@/types";
import type { ModalState } from "@/lib/vehicles/types";

/**
 * Główny widok listy pojazdów
 *
 * Orkiestruje:
 * - Filtry z synchronizacją URL
 * - Pobieranie danych z API
 * - Paginację cursorową
 * - Modals (add/edit/delete)
 * - Responsive switching (table ↔ cards)
 * - Obsługę błędów i stanów pustych
 */
export function VehiclesView() {
  // Filtry z synchronizacją URL
  const { filters, updateFilters } = useVehiclesFilters();

  // Paginacja
  const { currentCursor, goToNext, goToPrev, hasNext, hasPrev, reset: resetPagination } = usePagination();

  // Pobierz dane z API
  const { data, isLoading, isError, error, refetch } = useVehiclesList({
    q: filters.q,
    isActive: filters.isActive,
    includeDeleted: filters.includeDeleted,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
    cursor: currentCursor,
    limit: 20,
  });

  // Mutations
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  // Stan modalów
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  // Responsive - czy desktop (>=768px)
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Reset paginacji przy zmianie filtrów (oprócz cursor)
  const handleFiltersChange = useCallback(
    (updates: Partial<typeof filters>) => {
      updateFilters(updates);
      if (!("cursor" in updates)) {
        resetPagination();
      }
    },
    [updateFilters, resetPagination]
  );

  // Handlers modalów
  const handleAddClick = () => {
    setModalState({ type: "add" });
  };

  const handleEditClick = (vehicle: VehicleDTO) => {
    setModalState({ type: "edit", vehicle });
  };

  const handleDeleteClick = (vehicle: VehicleDTO) => {
    setModalState({ type: "delete", vehicle });
  };

  const handleModalClose = () => {
    setModalState({ type: null });
  };

  const handleModalSuccess = () => {
    // Modal się zamknie, dane zostaną odświeżone przez invalidate queries
  };

  // Handler toggle active
  const handleToggleActiveClick = async (vehicle: VehicleDTO) => {
    await updateMutation.mutateAsync({
      uuid: vehicle.uuid,
      data: { isActive: !vehicle.isActive },
    });
  };

  // Handler delete
  const handleDeleteConfirm = async () => {
    if (modalState.type === "delete") {
      await deleteMutation.mutateAsync(modalState.vehicle.uuid);
      setModalState({ type: null });
    }
  };

  // Handlers paginacji
  const handleNextPage = () => {
    if (data?.nextCursor) {
      goToNext(data.nextCursor);
      updateFilters({ cursor: data.nextCursor });
    }
  };

  const handlePrevPage = () => {
    goToPrev();
    updateFilters({ cursor: currentCursor });
  };

  // Loading state (pierwsze ładowanie)
  if (isLoading && !data) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-6">
        <VehiclesHeader onAddClick={handleAddClick} />
        <LoadingSkeletons count={5} variant={isDesktop ? "table" : "cards"} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-6">
        <VehiclesHeader onAddClick={handleAddClick} />
        <ErrorState error={error as Error} onRetry={refetch} />
      </div>
    );
  }

  const vehicles = data?.items || [];
  const hasFilters = filters.q !== "" || filters.isActive !== undefined || filters.includeDeleted;

  // Empty state
  const isEmpty = vehicles.length === 0;

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      {/* Nagłówek */}
      <VehiclesHeader onAddClick={handleAddClick} />

      {/* Filtry */}
      <VehiclesFiltersBar filters={filters} onFiltersChange={handleFiltersChange} resultsCount={vehicles.length} />

      {/* Lista pojazdów lub empty state */}
      {isEmpty ? (
        <EmptyState hasFilters={hasFilters} onAddClick={hasFilters ? undefined : handleAddClick} />
      ) : (
        <>
          {/* Desktop: Table */}
          {isDesktop && (
            <div className="hidden md:block">
              <VehiclesTable
                vehicles={vehicles}
                sortBy={filters.sortBy}
                sortDir={filters.sortDir}
                onSortChange={(sortBy, sortDir) => handleFiltersChange({ sortBy, sortDir })}
                onEditClick={handleEditClick}
                onToggleActiveClick={handleToggleActiveClick}
                onDeleteClick={handleDeleteClick}
                pagination={{
                  hasNext: hasNext(data?.nextCursor || null),
                  hasPrev,
                  onNext: handleNextPage,
                  onPrev: handlePrevPage,
                }}
              />
            </div>
          )}

          {/* Mobile: Cards */}
          {!isDesktop && (
            <div className="block md:hidden">
              <VehiclesCardList
                vehicles={vehicles}
                onEditClick={handleEditClick}
                onToggleActiveClick={handleToggleActiveClick}
                onDeleteClick={handleDeleteClick}
                pagination={{
                  hasNext: hasNext(data?.nextCursor || null),
                  hasPrev,
                  onNext: handleNextPage,
                  onPrev: handlePrevPage,
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddEditVehicleModal
        isOpen={modalState.type === "add" || modalState.type === "edit"}
        mode={modalState.type === "edit" ? "edit" : "add"}
        vehicle={modalState.type === "edit" ? modalState.vehicle : undefined}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <DeleteConfirmationDialog
        isOpen={modalState.type === "delete"}
        vehicle={modalState.type === "delete" ? modalState.vehicle : null}
        onClose={handleModalClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
