/**
 * FormLoadingState - Skeleton loader shown during token validation
 * Displays placeholder content while validating the report link
 *
 * @example
 * {isValidating && <FormLoadingState />}
 */
export function FormLoadingState() {
  return (
    <div className="max-w-2xl mx-auto p-6 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Header Skeleton */}
      <div className="space-y-3 mb-8">
        <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>

      {/* Status Switch Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Button Skeleton */}
      <div className="mt-8">
        <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
      </div>

      <span className="sr-only">Ładowanie formularza...</span>
    </div>
  );
}
