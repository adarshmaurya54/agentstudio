import { Skeleton } from "@/components/ui/skeleton";

const AgentListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="border rounded-2xl p-3 space-y-3"
        >
          {/* Icon Skeleton */}
          <Skeleton className="h-8 w-8 rounded-md" />

          {/* Text Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default AgentListSkeleton;