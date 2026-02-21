
import { Loader } from 'lucide-react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader className="w-12 h-12 text-sage animate-spin mb-4" strokeWidth={1.5} />
      <p className="text-charcoal/60">{message}</p>
    </div>
  );
}

// Skeleton Loader for Cards
export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-cream-dark rounded-full" />
        <div className="flex-1">
          <div className="h-6 bg-cream-dark rounded w-1/3 mb-2" />
          <div className="h-4 bg-cream-dark rounded w-1/4" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="h-16 bg-cream-dark rounded" />
        <div className="h-16 bg-cream-dark rounded" />
        <div className="h-16 bg-cream-dark rounded" />
        <div className="h-16 bg-cream-dark rounded" />
      </div>
    </div>
  );
}
