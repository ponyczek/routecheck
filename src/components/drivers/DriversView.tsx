import { useState, useCallback } from "react";
import { DriversHeader } from "./DriversHeader";
import { DriversFiltersBar } from "./DriversFiltersBar";
import { DriversTable } from "./DriversTable";
import { DriversCardList } from "./DriversCardList";
import { AddEditDriverModal } from "./AddEditDriverModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { LoadingSkeletons } from "./LoadingSkeletons";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { useDriversFilters } from "@/lib/drivers/useDriversFilters";
import { useDriversList } from "@/lib/drivers/useDriversList";
import { useUpdateDriver } from "@/lib/drivers/useUpdateDriver";
import { useDeleteDriver } from "@/lib/drivers/useDeleteDriver";
import { usePagination } from "@/lib/hooks/usePagination";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { DriverDTO } from "@/types";
import type { ModalState } from "@/lib/drivers/types";

/**
 * Główny widok listy kierowców
 *
 * Orkiestruje:
 * - Filtry z synchronizacją URL
 * - Pobieranie danych z API
 * - Paginację cursorową
 * - Modals (add/edit/delete)
 * - Responsive switching (table ↔ cards)
 * - Obsługę błędów i stanów pustych
 */
export function DriversView() {
  // Filtry z synchronizacją URL
  const { filters, updateFilters, resetFilters } = useDriversFilters();

  // Paginacja
  const { currentCursor, goToNext, goToPrev, hasNext, hasPrev, reset: resetPagination } = usePagination();

  // Pobierz dane z API
  const { data, isLoading, isError, error, refetch } = useDriversList({
    q: filters.q,
    isActive: filters.isActive,
    includeDeleted: filters.includeDeleted,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
    cursor: currentCursor,
    limit: 20,
  });

  // Mutations
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

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

  const handleEditClick = (driver: DriverDTO) => {
    setModalState({ type: "edit", driver });
  };

  const handleDeleteClick = (driver: DriverDTO) => {
    setModalState({ type: "delete", driver });
  };

  const handleModalClose = () => {
    setModalState({ type: null });
  };

  const handleModalSuccess = () => {
    // Modal się zamknie, dane zostaną odświeżone przez invalidate queries
  };

  // Handler toggle active
  const handleToggleActiveClick = async (driver: DriverDTO) => {
    await updateMutation.mutateAsync({
      uuid: driver.uuid,
      data: { isActive: !driver.isActive },
    });
  };

  // Handler delete
  const handleDeleteConfirm = async () => {
    if (modalState.type === "delete") {
      await deleteMutation.mutateAsync(modalState.driver.uuid);
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
        <DriversHeader onAddClick={handleAddClick} />
        <LoadingSkeletons count={5} view={isDesktop ? "table" : "cards"} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-6">
        <DriversHeader onAddClick={handleAddClick} />
        <ErrorState error={error as Error} onRetry={refetch} />
      </div>
    );
  }

  const drivers = data?.items || [];
  const hasFilters = filters.q !== "" || filters.isActive !== undefined || filters.includeDeleted;

  // Empty state
  const isEmpty = drivers.length === 0;
  const emptyVariant = hasFilters ? "no-results" : "no-drivers";

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      {/* Nagłówek */}
      <DriversHeader onAddClick={handleAddClick} />

      {/* Filtry */}
      <DriversFiltersBar filters={filters} onFiltersChange={handleFiltersChange} resultsCount={drivers.length} />

      {/* Lista kierowców lub empty state */}
      {isEmpty ? (
        <EmptyState
          variant={emptyVariant}
          onAddClick={emptyVariant === "no-drivers" ? handleAddClick : undefined}
          onClearFilters={emptyVariant === "no-results" ? resetFilters : undefined}
        />
      ) : (
        <>
          {/* Desktop: Table */}
          {isDesktop && (
            <div className="hidden md:block">
              <DriversTable
                drivers={drivers}
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
              <DriversCardList
                drivers={drivers}
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
      <AddEditDriverModal
        isOpen={modalState.type === "add" || modalState.type === "edit"}
        mode={modalState.type === "edit" ? "edit" : "add"}
        driver={modalState.type === "edit" ? modalState.driver : undefined}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <DeleteConfirmationDialog
        isOpen={modalState.type === "delete"}
        driver={modalState.type === "delete" ? modalState.driver : null}
        onClose={handleModalClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
