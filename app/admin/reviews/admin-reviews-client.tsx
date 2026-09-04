'use client';

import React, { useState } from 'react';

export function AdminReviewsClient({ reviews: initialReviews }: { reviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}/approve`, { method: 'PATCH' });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => r.id === id ? { ...r, approved: true } : r));
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}/approve`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setLoading(null);
    }
  };

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <div className="space-y-8">
      {/* Pending Reviews */}
      <div className="space-y-4">
        <h2 className="font-bold text-sm text-amber-700 border-b border-amber-200 pb-2">
          ⏳ Pending Approval ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No pending reviews. All caught up! ✅</p>
        ) : (
          pending.map((r) => (
            <div key={r.id} className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-4 items-start">
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900">{r.user?.name || 'Anonymous'}</span>
                  <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
                  <span className="text-gray-400">on <span className="font-bold text-gray-700">{r.product?.name}</span></span>
                </div>
                <p className="text-gray-600">{r.comment}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(r.id)}
                  disabled={loading === r.id}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={loading === r.id}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg"
                >
                  ✕ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approved Reviews */}
      <div className="space-y-4">
        <h2 className="font-bold text-sm text-emerald-700 border-b border-emerald-200 pb-2">
          ✅ Approved Reviews ({approved.length})
        </h2>

        {approved.map((r) => (
          <div key={r.id} className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex gap-4 items-start">
            <div className="flex-1 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-900">{r.user?.name || 'Anonymous'}</span>
                <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
                <span className="text-gray-400">on <span className="font-bold text-gray-700">{r.product?.name}</span></span>
              </div>
              <p className="text-gray-600">{r.comment}</p>
            </div>
            <button
              onClick={() => handleDelete(r.id)}
              disabled={loading === r.id}
              className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 font-bold text-[10px] rounded-lg shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
