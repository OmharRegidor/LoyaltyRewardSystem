"use client";

import { useState, useMemo } from "react";
import { Search, Package } from "lucide-react";
import type { Product } from "@/types/pos.types";

interface ProductSelectorProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  disabled?: boolean;
}

// Deterministic color from category string hash
const CATEGORY_COLORS = [
  { bg: "bg-rose-100", text: "text-rose-700", activeBg: "bg-rose-600" },
  { bg: "bg-sky-100", text: "text-sky-700", activeBg: "bg-sky-600" },
  { bg: "bg-emerald-100", text: "text-emerald-700", activeBg: "bg-emerald-600" },
  { bg: "bg-violet-100", text: "text-violet-700", activeBg: "bg-violet-600" },
  { bg: "bg-amber-100", text: "text-amber-700", activeBg: "bg-amber-600" },
  { bg: "bg-teal-100", text: "text-teal-700", activeBg: "bg-teal-600" },
  { bg: "bg-pink-100", text: "text-pink-700", activeBg: "bg-pink-600" },
  { bg: "bg-indigo-100", text: "text-indigo-700", activeBg: "bg-indigo-600" },
];

function getCategoryColor(category: string) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function ProductCard({
  product,
  onAdd,
  disabled,
}: {
  product: Product;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const outOfStock = product.stock_quantity <= 0;
  const lowStock =
    !outOfStock && product.stock_quantity <= product.low_stock_threshold;
  const color = getCategoryColor(product.category || "Other");

  return (
    <button
      onClick={onAdd}
      disabled={disabled || outOfStock}
      className={`relative flex flex-col rounded-xl border overflow-hidden transition-all text-left ${
        outOfStock
          ? "border-gray-200 opacity-70 cursor-not-allowed"
          : "border-gray-200 hover:border-yellow-400 hover:shadow-md active:scale-[0.97]"
      }`}
    >
      {/* Image area */}
      <div className="aspect-square relative w-full bg-gray-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${color.bg}`}
          >
            <span className={`text-3xl font-bold ${color.text} opacity-60`}>
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-wide bg-black/60 px-2 py-1 rounded">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {lowStock && (
          <span className="absolute top-1.5 right-1.5 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full">
            {product.stock_quantity} left
          </span>
        )}
      </div>

      {/* Info area */}
      <div className="p-2">
        <p className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </p>
        <p className="text-sm font-semibold text-yellow-700">
          ₱{(product.price_centavos / 100).toFixed(2)}
        </p>
      </div>
    </button>
  );
}

export function ProductSelector({
  products,
  onAddToCart,
  disabled,
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of products) {
      cats.add(p.category || "Other");
    }
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  // Filter products by search + category
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => (p.category || "Other") === selectedCategory,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [products, searchQuery, selectedCategory]);

  if (products.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">
          No products configured yet. Use manual amount entry below.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
        />
      </div>

      {/* Category Chips */}
      {categories.length > 2 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const color = cat === "All" ? null : getCategoryColor(cat);

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? cat === "All"
                      ? "bg-gray-900 text-white"
                      : `${color!.activeBg} text-white`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">
              {searchQuery ? "No products found" : "No products in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => onAddToCart(product)}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
