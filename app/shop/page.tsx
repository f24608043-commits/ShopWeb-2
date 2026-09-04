'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product/product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton-loaders';

function ShopCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);

  // Filter States initialized from URL params
  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortFilter = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = searchParams.get('page') || '1';

  // Fetch Categories and Brands for Sidebar
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((res) => res.json()),
      fetch('/api/brands').then((res) => res.json()),
    ]).then(([catData, brandData]) => {
      setCategories(Array.isArray(catData) ? catData : []);
      setBrands(Array.isArray(brandData) ? brandData : []);
    });
  }, []);

  // Fetch Products based on URL filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (categoryFilter) query.set('category', categoryFilter);
      if (brandFilter) query.set('brand', brandFilter);
      if (searchQuery) query.set('search', searchQuery);
      if (sortFilter) query.set('sort', sortFilter);
      if (minPrice) query.set('minPrice', minPrice);
      if (maxPrice) query.set('maxPrice', maxPrice);
      query.set('page', page);
      query.set('limit', '9');

      const res = await fetch(`/api/products?${query.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      console.error('Failed to load shop catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, brandFilter, searchQuery, sortFilter, minPrice, maxPrice, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Helper to update URL search parameters
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-neutral-900 text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-black">Shop Luxury Furniture</h1>
        <p className="text-xs text-gray-300 mt-1">
          Showing results {searchQuery && `for "${searchQuery}"`}{' '}
          {categoryFilter && `in category "${categoryFilter}"`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <aside className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200 h-fit">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-black text-gray-900 text-base">Filters</h2>
            {(categoryFilter || brandFilter || searchQuery || minPrice || maxPrice) && (
              <button
                onClick={() => router.push('/shop')}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Categories</h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => updateFilter('category', '')}
                className={`block w-full text-left py-1 px-2 rounded ${
                  !categoryFilter ? 'bg-amber-50 text-amber-800 font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-1 pl-1">
                  <button
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`block w-full text-left py-1 px-2 rounded font-medium ${
                      categoryFilter === cat.slug ? 'bg-amber-50 text-amber-800 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </button>

                  {/* Subcategories */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pl-3 space-y-1">
                      {cat.subcategories.map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => updateFilter('category', sub.slug)}
                          className={`block w-full text-left py-0.5 px-2 rounded text-[11px] ${
                            categoryFilter === sub.slug ? 'text-amber-700 font-bold' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          ↳ {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          {brands.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Brands</h3>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => updateFilter('brand', '')}
                  className={`block w-full text-left py-1 px-2 rounded ${
                    !brandFilter ? 'bg-amber-50 text-amber-800 font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => updateFilter('brand', b.slug)}
                    className={`block w-full text-left py-1 px-2 rounded font-medium ${
                      brandFilter === b.slug ? 'bg-amber-50 text-amber-800 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Filter */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Price Range (Rs.)</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
          </div>
        </aside>

        {/* Main Grid Area */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Sorting & Result Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              Showing <span className="font-bold text-gray-900">{products.length}</span> of{' '}
              <span className="font-bold text-gray-900">{pagination?.totalCount || 0}</span> products
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-gray-500 font-medium">Sort by:</label>
              <select
                id="sort-select"
                value={sortFilter}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white text-gray-800"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
              <span className="text-4xl block">🔍</span>
              <h3 className="font-bold text-gray-800 text-base">No products match your criteria</h3>
              <p className="text-xs text-gray-500">Try adjusting or resetting your search and category filters.</p>
              <button
                onClick={() => router.push('/shop')}
                className="mt-2 px-6 py-2 bg-amber-600 text-white font-bold text-xs rounded-full"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  id={prod.id}
                  name={prod.name}
                  slug={prod.slug}
                  basePrice={Number(prod.basePrice)}
                  originalPrice={prod.originalPrice ? Number(prod.originalPrice) : null}
                  productType={prod.productType}
                  images={prod.images}
                  category={prod.category}
                  brand={prod.brand}
                  averageRating={prod.averageRating}
                  totalReviews={prod.totalReviews}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => updateFilter('page', String(pagination.page - 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ◀ Previous
              </button>
              <span className="text-xs font-bold text-gray-700 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => updateFilter('page', String(pagination.page + 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next ▶
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton count={6} />}>
      <ShopCatalogContent />
    </Suspense>
  );
}
