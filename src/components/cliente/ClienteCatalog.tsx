import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Plus,
  Sparkles,
  Tag,
  Check,
  Package,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface ClienteCatalogProps {
  onOpenCart: () => void;
}

export const ClienteCatalog: React.FC<ClienteCatalogProps> = ({ onOpenCart }) => {
  const {
    products,
    addToCart,
    cart,
    cartItemCount,
    cartTotal,
    createOrder,
    clienteProfile,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addedId, setAddedId] = useState<string | null>(null);

  // Detectar y listar ÚNICAMENTE categorías que contienen productos (count > 0)
  const activeCategoriesWithCount = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const cat = (p.category || '').trim();
      if (cat) {
        counts.set(cat, (counts.get(cat) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .filter(([_, count]) => count > 0)
      .sort((a, b) => a[0].localeCompare(b[0], 'es', { sensitivity: 'base' }))
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  // Si la categoría seleccionada ya no tiene productos, resetear a 'all'
  useEffect(() => {
    if (selectedCategory !== 'all') {
      const exists = activeCategoriesWithCount.some(
        (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (!exists) {
        setSelectedCategory('all');
      }
    }
  }, [activeCategoriesWithCount, selectedCategory]);

  const filtered = products.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(term)) ||
      p.description.toLowerCase().includes(term);
    const matchesCat =
      selectedCategory === 'all' ||
      p.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(p.category.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Banner for Medical Client */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1B1A18] text-white relative overflow-hidden shadow-xl border border-stone-800">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9B368]/20 text-[#C9B368] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Catálogo de Suministros Médicos & Curación
          </span>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white font-serif">
            Material de Curación e Insumos Médicos
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Insumos hospitalarios, jeringas, agujas, gasas, suturas y soluciones para consultorios, clínicas, hospitales y público en general.
          </p>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none">
          <img
            src="https://appdesignproyectos.com/floricono.png"
            alt=""
            className="w-80 h-80 object-contain"
          />
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por aguja, jeringa, gasa, alcohol, solución, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] focus:outline-none focus:border-[#C9B368]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] font-medium focus:outline-none focus:border-[#C9B368] cursor-pointer"
          >
            <option value="all">Todas las Categorías ({products.length})</option>
            {activeCategoriesWithCount.map(({ name, count }) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Cards: 2 Columns on Mobile, responsive on tablet/desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
        {products.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-base font-bold text-stone-800">Catálogo en proceso de carga</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              El administrador está sincronizando la lista de suministros médicos y material de curación con Supabase.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No hay productos en esta categoría</p>
            <p className="text-xs text-stone-400 mt-1">Explora otras secciones de nuestro catálogo médico.</p>
          </div>
        ) : (
          filtered.map((prod) => {
            const hasDiscount = prod.discount > 0;
            const finalPrice = prod.price * (1 - (prod.discount || 0) / 100);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-lg transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 px-1.5 sm:px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] sm:text-xs font-bold shadow-xs">
                        -{prod.discount}%
                      </span>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#1B1A18]/85 text-[#C9B368] text-[9px] font-bold backdrop-blur-xs truncate max-w-[50%]">
                        {prod.category}
                      </span>
                      {prod.subCategory && (
                        <span className="px-1.5 py-0.5 rounded bg-white/90 text-stone-900 text-[9px] font-bold backdrop-blur-xs truncate max-w-[45%]">
                          {prod.subCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-stone-400">
                      <span className="font-mono text-stone-500">{prod.code}</span>
                      <span>Stock: {prod.stock}</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-[#1B1A18] line-clamp-2 leading-tight">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-stone-500 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>

                    <div className="pt-1 sm:pt-2 flex items-baseline gap-1 sm:gap-2">
                      <span className="text-xs sm:text-lg font-bold text-[#1B1A18]">
                        ${(finalPrice ?? 0).toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                          ${(prod.price ?? 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Add to cart */}
                <div className="p-2.5 sm:p-3 border-t border-stone-100 bg-[#FAF8F5]/60 flex items-center">
                  <button
                    onClick={() => handleAddToCart(prod)}
                    className="w-full py-2 px-3 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-[#C9B368] hover:text-[#d8c37d] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                    title="Agregar este producto al carrito"
                  >
                    {addedId === prod.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>¡Agregado al Carrito!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#C9B368]" />
                        <span>Agregar al Carrito</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
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
              <p className="text-[10px] text-[#C9B368] font-bold uppercase tracking-wide">Ver Carrito de Pedido</p>
              <p className="text-xs sm:text-sm font-bold text-white">${(cartTotal ?? 0).toFixed(2)} MXN</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
