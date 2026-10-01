import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface VendedorCatalogProps {
  onOpenCart: () => void;
}

export const VendedorCatalog: React.FC<VendedorCatalogProps> = ({ onOpenCart }) => {
  const { products, addToCart, cart, cartItemCount, cartTotal } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Dynamically derive categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddToCart = (prod: Product) => {
    addToCart(prod, 1);
    setAddedProductId(prod.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const getProductCartCount = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
              Catálogo Comercial de Suministros Médicos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C9B368]/20 text-[#1B1A18]">
              {products.length} disponibles
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Selecciona material de curación y suministros para levantar pedidos de clientes
          </p>
        </div>

        {cartItemCount > 0 && (
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <ShoppingCart className="w-4 h-4 text-[#C9B368]" />
            Ver Carrito ({cartItemCount}) • ${cartTotal.toFixed(2)} MXN
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por aguja, jeringa, gasa, alcohol, SKU o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] focus:outline-none focus:border-[#C9B368]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {categories.slice(0, 10).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1B1A18] text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-base font-bold text-stone-800">Catálogo actualmente vacío</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              El administrador puede cargar la lista de precios de suministros médicos desde el módulo de Catálogo en el rol Admin.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">Sin productos con este criterio de búsqueda</p>
            <p className="text-xs text-stone-400 mt-1">Prueba con otro término o categoría.</p>
          </div>
        ) : (
          filtered.map((prod) => {
            const hasDiscount = prod.discount > 0;
            const finalPrice = prod.price * (1 - (prod.discount || 0) / 100);
            const inCartCount = getProductCartCount(prod.id);
            const isOutOfStock = prod.stock <= 0;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {hasDiscount && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-xs">
                        -{prod.discount}%
                      </span>
                    )}
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#1B1A18]/80 text-[#C9B368] text-[10px] font-mono font-bold backdrop-blur-xs">
                      {prod.code}
                    </span>
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-3 py-1 bg-red-600 text-white font-bold text-xs rounded-lg uppercase tracking-wider">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="truncate max-w-[130px] font-medium">{prod.category}</span>
                      <span className={prod.stock < 5 ? 'text-red-600 font-bold' : ''}>
                        Stock: {prod.stock} disp.
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-[#1B1A18] line-clamp-2 leading-tight">
                      {prod.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>

                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="text-base font-bold text-[#1B1A18]">
                        ${finalPrice.toFixed(2)} MXN
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-stone-400 line-through">
                          ${prod.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add to Cart button */}
                <div className="p-3 border-t border-stone-100 bg-[#FAF8F5]/60 flex items-center justify-between gap-2">
                  {inCartCount > 0 ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      {inCartCount} en pedido
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400">Entrega rápida</span>
                  )}

                  <button
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(prod)}
                    className={`py-2 px-3.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs ${
                      addedProductId === prod.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#1B1A18] hover:bg-stone-800 text-white'
                    }`}
                  >
                    {addedProductId === prod.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#C9B368]" />
                        <span>¡Agregado!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-[#C9B368]" />
                        <span>Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar when items in cart */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-8 z-40 animate-in slide-in-from-bottom-5">
          <button
            onClick={onOpenCart}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#1B1A18] text-white shadow-2xl border-2 border-[#C9B368] hover:scale-102 transition cursor-pointer"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-[#C9B368]" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                {cartItemCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[11px] text-stone-300 uppercase tracking-wide">Listo para Levantar Pedido</p>
              <p className="text-xs sm:text-sm font-bold text-white">${cartTotal.toFixed(2)} MXN</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
