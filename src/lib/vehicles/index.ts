/**
 * Barrel export dla modułu vehicles
 * Ułatwia importowanie wszystkich funkcji i hooków związanych z pojazdami
 */

// Typy
export type {
  VehiclesFiltersState,
  ModalState,
  VehicleFormData,
  PaginationState,
  VehiclesQueryParams,
} from './types';
export { defaultFilters } from './types';

// Walidacja
export { vehicleFormSchema } from './validation';
export type { VehicleFormData as VehicleFormDataValidated } from './validation';

// Query keys
export { vehiclesKeys } from './queryKeys';

// Hooks - data management
export { useVehiclesList } from './useVehiclesList';
export { useCreateVehicle } from './useCreateVehicle';
export { useUpdateVehicle } from './useUpdateVehicle';
export { useDeleteVehicle } from './useDeleteVehicle';

// Hooks - helpers
export { useDebouncedValue } from './useDebouncedValue';
export { usePagination } from './usePagination';
export { useVehiclesFilters } from './useVehiclesFilters';
export { useMediaQuery } from './useMediaQuery';


