import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminReviewsClient } from './admin-reviews-client';

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, product:products(*), user:profiles(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Review Moderation</h1>
        <p className="text-xs text-gray-500 mt-0.5">Approve or reject customer product reviews before they appear on product pages.</p>
      </div>
      <AdminReviewsClient reviews={JSON.parse(JSON.stringify(reviews || []))} />
    </div>
  );
}
