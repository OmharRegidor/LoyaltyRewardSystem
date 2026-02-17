"use client";

import { useState, useMemo } from "react";
import { Search, Package, Plus } from "lucide-react";
import type { Product } from "@/types/pos.types";

interface ProductSelectorProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  disabled?: boolean;
}

export function ProductSelector({
  products,
  onAddToCart,
  disabled,
}: ProductSelectorProps) {
  const [activeTab, setActiveTab] = useState<"categories" | "search">(
    "categories",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Group products by category
  const categories = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const cat = p.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [products]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)),
    );
  }, [products, searchQuery]);

  if (products.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4 text-center">
        <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">
          No products configured yet. Use manual amount entry below.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-4 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "categories"
              ? "text-yellow-700 border-b-2 border-yellow-500 bg-yellow-50/50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "search"
              ? "text-yellow-700 border-b-2 border-yellow-500 bg-yellow-50/50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Search
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="p-3 max-h-64 overflow-y-auto">
          {Array.from(categories.entries()).map(([category, prods]) => (
            <div key={category} className="mb-3 last:mb-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {category}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {prods.map((product) => {
                  const outOfStock = product.stock_quantity <= 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => onAddToCart(product)}
                      disabled={disabled}
                      className={`p-3 rounded-xl text-left transition-all border ${
                        outOfStock
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-gray-200 hover:border-yellow-400 hover:shadow-sm active:scale-[0.98]"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-yellow-700 font-semibold">
                          ₱{(product.price_centavos / 100).toFixed(2)}
                        </span>
                        {outOfStock ? (
                          <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            OUT
                          </span>
                        ) : product.stock_quantity <=
                          product.low_stock_threshold ? (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            LOW: {product.stock_quantity}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            {product.stock_quantity} left
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <div className="p-3">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock_quantity <= 0;
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg ${
                    outOfStock ? "opacity-60" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₱{(product.price_centavos / 100).toFixed(2)}
                      {outOfStock && (
                        <span className="text-red-500 ml-1">(Out of stock)</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={disabled}
                    className="w-8 h-8 flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4 text-yellow-700" />
                  </button>
                </div>
              );
            })}
            {filteredProducts.length === 0 && searchQuery && (
              <p className="text-sm text-gray-400 text-center py-4">
                No products found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
