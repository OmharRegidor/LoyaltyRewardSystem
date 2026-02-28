"use client";

import { useState, useMemo } from "react";
import { Search, Package } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/types/pos.types";
import type { StaffCartItem } from "@/types/staff-pos.types";

interface ProductSelectorProps {
  products: Product[];
  cartItems?: StaffCartItem[];
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
  index,
  availableStock,
}: {
  product: Product;
  onAdd: () => void;
  disabled?: boolean;
  index: number;
  availableStock: number;
}) {
  const outOfStock = availableStock <= 0;
  const lowStock =
    !outOfStock && availableStock <= product.low_stock_threshold;
  const color = getCategoryColor(product.category || "Other");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <motion.button
        onClick={onAdd}
        disabled={disabled || outOfStock}
        whileHover={!outOfStock && !disabled ? { y: -2 } : undefined}
        whileTap={!outOfStock && !disabled ? { scale: 0.97 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`relative flex flex-col rounded-xl overflow-hidden transition-all text-left w-full ${
          outOfStock
            ? "bg-white border border-gray-200 opacity-70 cursor-not-allowed"
            : "bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-gray-200 hover:border-yellow-400"
        }`}
      >
        {/* Image area */}
        <div className="h-24 relative w-full bg-gray-100 overflow-hidden">
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

          {/* Stock count badge */}
          {!outOfStock && (
            <span className={`absolute top-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
              availableStock <= 10
                ? "text-red-800 bg-red-100 border-red-300"
                : availableStock <= 25
                  ? "text-amber-800 bg-amber-100 border-amber-300"
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
            }`}>
              {availableStock} left
            </span>
          )}
        </div>

        {/* Info area */}
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {product.name}
          </p>
          {product.category && (
            <p className="text-xs text-gray-400 truncate">{product.category}</p>
          )}
          <p className="text-sm font-bold text-yellow-700 mt-0.5">
            ₱{(product.price_centavos / 100).toFixed(2)}
          </p>
        </div>
      </motion.button>
    </motion.div>
  );
}

export function ProductSelector({
  products,
  cartItems = [],
  onAddToCart,
  disabled,
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Map product_id → total quantity in cart
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      if (item.product_id) {
        map.set(item.product_id, (map.get(item.product_id) || 0) + item.quantity);
      }
    }
    return map;
  }, [cartItems]);

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
        <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products, SKU, or barcode..."
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-secondary focus:ring-1 focus:ring-secondary/20"
        />
      </div>

      {/* Category Chips */}
      {categories.length > 2 && (
        <div className="flex gap-2.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const color = cat === "All" ? null : getCategoryColor(cat);

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? cat === "All"
                      ? "bg-slate-900 text-white"
                      : `${color!.activeBg} text-white`
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => onAddToCart(product)}
                disabled={disabled}
                index={index}
                availableStock={product.stock_quantity - (cartQuantityMap.get(product.id) || 0)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
