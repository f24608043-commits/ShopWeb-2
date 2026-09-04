import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/product-card';

export const revalidate = 60; // SSR with 60s revalidation

export default async function HomePage() {
  // Fetch featured products, categories, and promotional deals from database
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        brand: true,
        reviews: { where: { approved: true }, select: { rating: true } },
      },
      take: 6,
    }),
    prisma.category.findMany({
      where: { parentCategoryId: null },
      take: 4,
    }),
  ]);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-8 sm:p-16 flex flex-col justify-center min-h-[480px] shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600"
            alt="Hero Background Bed"
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest inline-block">
            Artisan Handcrafted Collection
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Sleep in Regal <span className="text-amber-500">Luxury</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Custom upholstered Chesterfield beds, plush velvet finishes, and ergonomic memory foam mattresses engineered for ultimate rest.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/shop"
              className="px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-full shadow-lg transition-transform hover:scale-105"
            >
              Explore Shop Catalog ➔
            </Link>
            <Link
              href="/shop?category=chesterfield-beds"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full backdrop-blur-xs transition-colors border border-white/20"
            >
              Upholstered Beds
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Shop By Category</h2>
            <p className="text-xs text-gray-500 mt-1">Select from our signature handcrafted furniture collections</p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-amber-700 hover:underline">
            View All Categories ➔
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative h-64 rounded-2xl overflow-hidden shadow-md block bg-neutral-900"
            >
              <Image
                src={cat.heroBannerImageUrl || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800'}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-1 mt-1">{cat.description}</p>
                <span className="text-xs font-bold text-amber-400 mt-3 inline-flex items-center gap-1">
                  Explore Collection ➔
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Featured Beds & Products</h2>
            <p className="text-xs text-gray-500 mt-1">Our top-rated customer favourites</p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-amber-700 hover:underline">
            See All Products ➔
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((prod) => (
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
              averageRating={
                prod.reviews.length > 0
                  ? Math.round((prod.reviews.reduce((acc, r) => acc + r.rating, 0) / prod.reviews.length) * 10) / 10
                  : 5.0
              }
              totalReviews={prod.reviews.length || 15}
            />
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="bg-amber-600 text-white rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <span className="bg-black/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
            Special Offer
          </span>
          <h2 className="text-2xl sm:text-4xl font-black">Save Flat Rs. 1,000 Off Orders</h2>
          <p className="text-amber-100 text-xs sm:text-sm">
            Apply discount code <span className="font-mono font-bold bg-white text-amber-900 px-2 py-0.5 rounded">FLAT1000</span> during checkout on orders over Rs. 15,000!
          </p>
        </div>
        <Link
          href="/shop"
          className="px-8 py-3 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-full shrink-0 shadow-lg"
        >
          Claim Discount Now
        </Link>
      </section>
    </div>
  );
}
