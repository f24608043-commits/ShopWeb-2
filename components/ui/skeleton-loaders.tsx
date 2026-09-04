import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs animate-pulse p-4 space-y-3">
      <div className="bg-gray-200 aspect-4/3 rounded-lg w-full" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="pt-2 flex items-center justify-between border-t border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-8 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12" /></td>
    </tr>
  );
}
