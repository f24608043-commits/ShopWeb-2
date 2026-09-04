'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/providers/cart-context';
import { useSession } from 'next-auth/react';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const { data: session } = useSession();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Selected Option Values Map (e.g. { "Size": "5ft", "Fabric": "Velvet", "Color": "Beige" })
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();

        if (res.ok) {
          setProduct(data);
          setSelectedImage(data.images[0]?.url || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800');

          // Initialize default selected options if variable product
          const allOptions = [
            ...(data.globalForm ? data.globalForm.options : []),
            ...(data.options || []),
          ];

          if (allOptions.length > 0) {
            const initialMap: Record<string, string> = {};
            allOptions.forEach((opt: any) => {
              if (opt.values && opt.values.length > 0) {
                initialMap[opt.name] = opt.values[0].id;
              }
            });
            setSelectedOptions(initialMap);
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  // Find matching ProductVariation whenever selectedOptions changes
  useEffect(() => {
    if (!product || product.productType !== 'VARIABLE' || !product.variations) return;

    const selectedValueIds = Object.values(selectedOptions);

    const matchingVar = product.variations.find((v: any) => {
      const varValueIds = v.values.map((val: any) => val.optionValueId);
      return selectedValueIds.every((id) => varValueIds.includes(id));
    });

    setSelectedVariation(matchingVar || null);
  }, [selectedOptions, product]);

  const handleOptionSelect = (optionName: string, valueId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: valueId,
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.productType === 'VARIABLE') {
      if (!selectedVariation) {
        alert('Please select valid option combinations first.');
        return;
      }

      const variationDetails = selectedVariation.values
        .map((v: any) => `${v.optionValue.option.name}: ${v.optionValue.value}`)
        .join(', ');

      addItem({
        productId: product.id,
        variationId: selectedVariation.id,
        productName: product.name,
        productSlug: product.slug,
        image: selectedImage,
        variationDetails,
        unitPrice: Number(selectedVariation.price),
        quantity: 1,
      });
    } else {
      addItem({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        image: selectedImage,
        unitPrice: Number(product.basePrice),
        quantity: 1,
      });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert('Please sign in to submit a review.');
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: Number(reviewRating),
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewStatus('✅ Review submitted! It will appear once approved by an admin.');
        setReviewComment('');
      } else {
        setReviewStatus(`❌ ${data.error || 'Failed to submit review'}`);
      }
    } catch {
      setReviewStatus('❌ Network error submitting review.');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse py-12 space-y-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-200 aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 space-y-4">
        <span className="text-5xl block">⚠️</span>
        <h1 className="text-2xl font-black text-gray-900">Product Not Found</h1>
        <p className="text-xs text-gray-500">The product you are looking for does not exist or has been removed.</p>
        <Link href="/shop" className="inline-block px-6 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-full">
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const allOptions = [
    ...(product.globalForm ? product.globalForm.options : []),
    ...(product.options || []),
  ];

  const currentPrice =
    product.productType === 'VARIABLE'
      ? selectedVariation
        ? Number(selectedVariation.price)
        : Number(product.basePrice)
      : Number(product.basePrice);

  const currentStock =
    product.productType === 'VARIABLE'
      ? selectedVariation
        ? selectedVariation.stock
        : 0
      : product.stock || 0;

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 flex items-center gap-2">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:underline">Shop</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-bold truncate">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Thumbnail Strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: any) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 ${
                    selectedImage === img.url ? 'border-amber-600 scale-95' : 'border-gray-200'
                  }`}
                >
                  <Image src={img.url} alt={img.altText || ''} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Options */}
        <div className="space-y-6">
          <div>
            {product.brand && (
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
                {product.brand.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{product.name}</h1>
            <p className="text-xs text-gray-500 mt-2">{product.shortDescription || product.description}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 text-sm text-amber-500 border-y border-gray-100 py-3">
            <span className="font-bold">★ {product.averageRating || '5.0'}</span>
            <span className="text-gray-400 text-xs">({product.totalReviews || 12} customer reviews)</span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-gray-900">
              Rs. {currentPrice.toLocaleString()}
            </span>
            {product.originalPrice && Number(product.originalPrice) > currentPrice && (
              <span className="text-base text-gray-400 line-through">
                Rs. {Number(product.originalPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Dynamic Option Selector */}
          {product.productType === 'VARIABLE' && allOptions.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              {allOptions.map((opt: any) => (
                <div key={opt.id} className="space-y-2">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                    {opt.name}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val: any) => {
                      const isSelected = selectedOptions[opt.name] === val.id;
                      return (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => handleOptionSelect(opt.name, val.id)}
                          className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {val.value}
                          {Number(val.priceAdjustment) > 0 && (
                            <span className="text-[10px] text-amber-500 ml-1">
                              (+Rs. {Number(val.priceAdjustment).toLocaleString()})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stock & SKU Info */}
          <div className="text-xs space-y-1 pt-2">
            {selectedVariation?.sku && (
              <p className="text-gray-500 font-mono">SKU: <span className="text-gray-900 font-bold">{selectedVariation.sku}</span></p>
            )}
            <p className="flex items-center gap-1 font-semibold">
              Status:{' '}
              {currentStock > 0 ? (
                <span className="text-emerald-600">In Stock ({currentStock} available)</span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </p>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            disabled={currentStock <= 0}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {currentStock > 0 ? 'Add To Shopping Cart 🛒' : 'Currently Out of Stock'}
          </button>
        </div>
      </div>

      {/* Description Tab & Reviews */}
      <div className="pt-12 border-t border-gray-200 space-y-8">
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-3">Product Description</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Customer Reviews Section */}
        <div className="space-y-6 pt-6 border-t border-gray-100">
          <h2 className="text-xl font-black text-gray-900">Customer Reviews ({product.reviews?.length || 0})</h2>

          {/* Reviews List */}
          <div className="space-y-4">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev: any) => (
                <div key={rev.id} className="bg-white p-4 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{rev.user?.name || 'Verified Customer'}</span>
                    <span className="text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}</div>
                  <p className="text-xs text-gray-700 mt-1">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No approved reviews yet. Be the first to leave a review!</p>
            )}
          </div>

          {/* Submit Review Form */}
          <div className="bg-gray-100 p-6 rounded-2xl space-y-4 max-w-lg">
            <h3 className="font-bold text-sm text-gray-900">Leave a Review</h3>
            {session ? (
              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Rating (1 to 5 Stars):</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-300 rounded bg-white font-semibold"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3 - Average)</option>
                    <option value={2}>⭐⭐ (2 - Poor)</option>
                    <option value={1}>⭐ (1 - Terrible)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Comment:</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg"
                >
                  Submit Review
                </button>
                {reviewStatus && <p className="text-xs font-semibold mt-2">{reviewStatus}</p>}
              </form>
            ) : (
              <p className="text-xs text-gray-600">
                Please <Link href="/login" className="text-amber-700 font-bold underline">Sign In</Link> to write a customer review.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
