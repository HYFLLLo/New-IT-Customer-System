export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex border-b border-gray-200 mb-6">
        <div className="px-4 py-2 h-8 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="px-4 py-2 h-8 w-20 bg-gray-200 rounded animate-pulse ml-2" />
      </div>

      {/* Content Area Skeleton */}
      <div className="min-h-[400px] space-y-6">
        {/* FileUpload placeholder */}
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />

        {/* DocumentList placeholder */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}