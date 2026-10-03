import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Package,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Edit2,
  Trash2,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  CloudUpload,
  CloudDownload,
  ClipboardPaste,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  LayoutGrid,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  downloadMedicalExcelTemplate,
  parseExcelProducts,
  parseRawMedicalPriceList,
  getPlaceholderImageForCategory,
  exportProductsToExcel,
} from '../../utils/excelImport';

export const AdminCatalog: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    deleteAllProducts,
    importProductsList,
    importAnalyzedMedicalCatalog,
    uploadProductsToSupabase,
    fetchProductsFromSupabase,
    supabaseConfig,
    supabaseProductsCount,
    isSyncingCloud,
    syncProgress,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(50);
  const [discount, setDiscount] = useState<number | ''>(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Agujas y Jeringas');
  const [subCategory, setSubCategory] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid');
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Status message
  const [importStatus, setImportStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Deletion state (individual, selection, global)
  const [deleteModal, setDeleteModal] = useState<{
    type: 'single' | 'selected' | 'all';
    product?: Product;
    count?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    setSelectedIds(filteredProducts.map((p) => p.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);

    try {
      if (deleteModal.type === 'single' && deleteModal.product) {
        const prod = deleteModal.product;
        const res = await deleteProduct(prod.id, prod.code);
        setImportStatus({
          text: res.message || `Producto "${prod.name}" eliminado de Supabase.`,
          isError: !res.success,
        });
        if (showModal && editingProduct?.id === prod.id) {
          setShowModal(false);
          setEditingProduct(null);
        }
      } else if (deleteModal.type === 'selected') {
        const toDeleteIds = [...selectedIds];
        const toDeleteCodes = products
          .filter((p) => toDeleteIds.includes(p.id))
          .map((p) => p.code);
        const res = await deleteMultipleProducts(toDeleteIds, toDeleteCodes);
        setImportStatus({
          text: res.message || `Se eliminaron ${toDeleteIds.length} productos de Supabase.`,
          isError: !res.success,
        });
        setSelectedIds([]);
        setIsSelectMode(false);
      } else if (deleteModal.type === 'all') {
        const res = await deleteAllProducts();
        setImportStatus({
          text: res.message || 'Se eliminaron todos los productos de Supabase y del catálogo.',
          isError: !res.success,
        });
        setSelectedIds([]);
        setIsSelectMode(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      setImportStatus({ text: `Error al eliminar de Supabase: ${msg}`, isError: true });
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  };

  const medicalCategories = [
    'Agujas',
    'Alcohol',
    'Algodón',
    'Antisépticos',
    'Gasas',
    'Guantes',
    'Jeringas',
    'Material de Hospitalización',
    'Prendas y Protección',
    'Equipos Médicos',
    'Tijeras y Cirugía',
    'Bisturí y Navajas',
    'Estetoscopios',
    'Micropore y Fijación',
    'Parches',
    'Punzocat y Catéteres',
    'Sondas y Drenajes',
    'Suturas Quirúrgicas',
    'Soluciones y Sueros',
    'Vendas y Adhesivos',
    'Curación y Desinfección',
    'Apoyo Ortopédico',
    'Rebotica y Botiquín',
    'Aceites y Pomadas',
    'Línea Bebé y Maternidad',
    'OTC y Medicamentos',
    'Soluciones Hidratantes',
    'General',
  ];

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

  // Si la categoría seleccionada actualmente ya no tiene productos, resetear a 'all'
  useEffect(() => {
    if (categoryFilter !== 'all') {
      const exists = activeCategoriesWithCount.some(
        (c) => c.name.toLowerCase() === categoryFilter.toLowerCase()
      );
      if (!exists) {
        setCategoryFilter('all');
      }
    }
  }, [activeCategoriesWithCount, categoryFilter]);

  // Categorías completas para el selector del modal de crear / editar producto
  const formCategories = useMemo(() => {
    const set = new Set<string>();
    activeCategoriesWithCount.forEach((c) => set.add(c.name));
    medicalCategories.forEach((cat) => set.add(cat));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [activeCategoriesWithCount]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(term)) ||
        p.description.toLowerCase().includes(term);

      const matchesCategory =
        categoryFilter === 'all' ||
        p.category.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        categoryFilter.toLowerCase().includes(p.category.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Record<string, Product[]>> = {};
    filteredProducts.forEach((p) => {
      const cat = p.category || 'General';
      const sub = p.subCategory || 'General / Estándar';
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][sub]) groups[cat][sub] = [];
      groups[cat][sub].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setName('');
    setCode(`MED-${Math.floor(100 + Math.random() * 900)}`);
    setPrice('');
    setStock(50);
    setDiscount(0);
    setDescription('');
    setCategory('Agujas y Jeringas');
    setSubCategory('');
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setImageUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80');
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCode(p.code);
    setPrice(p.price);
    setStock(p.stock);
    setDiscount(p.discount);
    setDescription(p.description);
    setCategory(p.category || 'General');
    setSubCategory(p.subCategory || '');
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setImageUrl(p.imageUrl);
    setShowModal(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImageUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '') {
      alert('Ingresa el nombre y precio del producto.');
      return;
    }

    const finalCategory = isCreatingNewCategory ? (newCategoryName.trim() || 'General') : category;
    const finalSubCategory = subCategory.trim() || undefined;

    setShowModal(false);

    if (editingProduct) {
      setImportStatus({ text: `Actualizando "${name}" en Supabase...` });
      const res = await updateProduct(editingProduct.id, {
        name,
        code,
        price: Number(price),
        stock: Number(stock) || 0,
        discount: Number(discount) || 0,
        description,
        category: finalCategory,
        subCategory: finalSubCategory,
        imageUrl: imageUrl || getPlaceholderImageForCategory(finalCategory),
      });
      setImportStatus({ text: res.message, isError: !res.success });
      setTimeout(() => setImportStatus(null), 4500);
    } else {
      setImportStatus({ text: `Guardando "${name}" en Supabase...` });
      const res = await addProduct({
        name,
        code: code || `MED-${Date.now().toString().slice(-4)}`,
        price: Number(price),
        stock: Number(stock) || 50,
        discount: Number(discount) || 0,
        description: description || 'Suministro médico y material de curación.',
        category: finalCategory,
        subCategory: finalSubCategory,
        imageUrl: imageUrl || getPlaceholderImageForCategory(finalCategory),
      });
      setImportStatus({ text: res.message, isError: !res.success });
      setTimeout(() => setImportStatus(null), 4500);
    }
  };

  // Upload Excel / CSV file from disk and automatically sync to Supabase
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus({ text: 'Analizando archivo Excel / CSV y guardando en Supabase...' });
      const imported = await parseExcelProducts(file);
      if (imported.length === 0) {
        setImportStatus({ text: 'No se detectaron registros válidos en el archivo.', isError: true });
        return;
      }
      const res = await importProductsList(imported, true);
      setImportStatus({
        text: res.message || `¡Se importaron ${imported.length} productos y se guardaron en Supabase con éxito!`,
        isError: !res.success,
      });
      setTimeout(() => setImportStatus(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar archivo';
      setImportStatus({ text: `Error al importar: ${msg}`, isError: true });
    }
  };

  // Parse pasted CSV text and automatically sync to Supabase
  const handleProcessPastedText = async () => {
    if (!pasteText.trim()) return;
    try {
      setImportStatus({ text: 'Procesando lista y guardando en Supabase...' });
      const parsed = parseRawMedicalPriceList(pasteText);
      if (parsed.length === 0) {
        setImportStatus({ text: 'No se encontraron registros válidos en el texto pegado.', isError: true });
        return;
      }
      const res = await importProductsList(parsed, true);
      setShowPasteModal(false);
      setPasteText('');
      setImportStatus({
        text: res.message || `¡Se procesaron ${parsed.length} productos y se guardaron en Supabase!`,
        isError: !res.success,
      });
      setTimeout(() => setImportStatus(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setImportStatus({ text: `Error: ${msg}`, isError: true });
    }
  };

  // Quick 1-click import of the analyzed price list with auto-sync to Supabase
  const handleImportAnalyzedList = async () => {
    setImportStatus({ text: 'Cargando lista médica analizada y guardando en Supabase...' });
    const res = await importAnalyzedMedicalCatalog(true);
    setImportStatus({
      text: res.message || `¡Catálogo analizado importado y guardado en Supabase!`,
      isError: !res.success,
    });
    setTimeout(() => setImportStatus(null), 6000);
  };

  // Upload to Supabase cloud manually
  const handleUploadToSupabase = async () => {
    if (products.length === 0) {
      alert('Primero importa o agrega productos al catálogo local antes de sincronizar con Supabase.');
      return;
    }
    const res = await uploadProductsToSupabase();
    setImportStatus({ text: res.message, isError: !res.success });
  };

  // Pull from Supabase cloud
  const handleFetchFromSupabase = async () => {
    const res = await fetchProductsFromSupabase();
    setImportStatus({ text: res.message, isError: !res.success });
  };

  const renderProductCard = (prod: Product) => {
    const hasDiscount = prod.discount > 0;
    const finalPrice = prod.price * (1 - (prod.discount || 0) / 100);
    const isSelected = selectedIds.includes(prod.id);

    return (
      <div
        key={prod.id}
        onClick={() => {
          if (isSelectMode) handleToggleSelectProduct(prod.id);
        }}
        className={`bg-white rounded-2xl border overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group cursor-pointer sm:cursor-default ${
          isSelected
            ? 'border-[#C9B368] ring-2 ring-[#C9B368]/40 bg-amber-50/20'
            : 'border-stone-200/90'
        }`}
      >
        <div>
          <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
            <img
              src={prod.imageUrl}
              alt={prod.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {hasDiscount && (
              <span className="absolute top-2 left-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] sm:text-[10px] font-bold shadow-xs">
                -{prod.discount}%
              </span>
            )}
            {isSelectMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSelectProduct(prod.id);
                }}
                className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-md backdrop-blur-xs flex items-center justify-center transition shadow-xs cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/90 text-stone-500 hover:text-stone-800'
                }`}
                title={isSelected ? 'Deseleccionar' : 'Seleccionar producto'}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            <span className="absolute bottom-2 left-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#1B1A18]/80 text-[#C9B368] text-[9px] sm:text-[10px] font-mono font-bold backdrop-blur-xs">
              {prod.code}
            </span>
          </div>

          <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                {prod.category}
              </span>
              {prod.subCategory && (
                <span className="text-[10px] font-bold text-[#1B1A18] bg-[#C9B368]/20 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                  {prod.subCategory}
                </span>
              )}
              <span className="text-[10px] text-stone-400 ml-auto font-medium">
                {prod.stock} disp.
              </span>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#1B1A18] line-clamp-2 leading-tight">
              {prod.name}
            </h3>

            <div className="pt-1.5 sm:pt-2 flex items-baseline gap-1.5">
              <span className="text-xs sm:text-base font-bold text-[#1B1A18]">
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

        <div className="p-2 sm:p-3 border-t border-stone-100 bg-[#FAF8F5]/60 flex items-center justify-end gap-1.5 sm:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(prod);
            }}
            className="p-1 sm:p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition cursor-pointer"
            title="Editar producto"
          >
            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ type: 'single', product: prod });
            }}
            className="p-1 sm:p-1.5 rounded-lg border border-stone-200 hover:bg-rose-50 text-rose-500 hover:border-rose-300 transition cursor-pointer"
            title="Eliminar producto de Supabase y del catálogo"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
              Catálogo de Suministros Médicos y Material de Curación
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C9B368]/20 text-[#1B1A18] border border-[#C9B368]/40">
              {products.length} productos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Importación directa de listas de precios (Excel/CSV) y sincronización total con Supabase ({supabaseConfig.projectId})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Import Analyzed Price List */}
          <button
            onClick={handleImportAnalyzedList}
            disabled={isSyncingCloud}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Importar lista completa de suministros médicos analizada (570+ productos) directamente a Supabase"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9B368]" />
            <span>Importar Lista Analizada (570+)</span>
          </button>

          {/* Import Excel File */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-semibold transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Subir Excel / CSV</span>
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </label>

          {/* Export to Excel */}
          {products.length > 0 && (
            <button
              onClick={() => exportProductsToExcel(products)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-950 text-xs font-semibold transition cursor-pointer"
              title="Exportar todos los productos actuales a archivo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
              <span>Exportar Excel ({products.length})</span>
            </button>
          )}

          {/* Paste CSV button */}
          <button
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition cursor-pointer"
            title="Pegar texto o contenido CSV de la lista de precios"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-stone-600" />
            <span>Pegar Texto</span>
          </button>

          {/* Download Template */}
          <button
            onClick={downloadMedicalExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition cursor-pointer"
            title="Descargar plantilla Excel oficial de suministros médicos"
          >
            <Download className="w-3.5 h-3.5 text-[#C9B368]" />
            <span>Plantilla</span>
          </button>

          {/* Supabase Upload / Sync */}
          {products.length > 0 && (
            <button
              onClick={handleUploadToSupabase}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Guardar todos los registros directamente en Supabase Cloud"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isSyncingCloud ? 'Guardando en Supabase...' : 'Guardar Todo en Supabase'}</span>
            </button>
          )}

          {/* Pull from Supabase */}
          <button
            onClick={handleFetchFromSupabase}
            disabled={isSyncingCloud}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            title="Cargar registros actualizados desde la base de datos de Supabase"
          >
            <CloudDownload className="w-3.5 h-3.5 text-stone-600" />
            <span>Cargar de Supabase</span>
          </button>

          {/* Delete All Catalog Button */}
          {products.length > 0 && (
            <button
              onClick={() => setDeleteModal({ type: 'all', count: products.length })}
              disabled={isSyncingCloud || isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              title="Borrar todos los productos permanentemente de Supabase y del catálogo"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Vaciar Catálogo</span>
            </button>
          )}

          {/* Multi-selection Toggle */}
          {products.length > 0 && (
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedIds([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isSelectMode
                  ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                  : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-700'
              }`}
              title="Activar selección múltiple para borrar varios productos de Supabase"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#C9B368]" />
              <span>{isSelectMode ? 'Cancelar Selección' : 'Seleccionar'}</span>
            </button>
          )}

          {/* New Single Product */}
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C9B368]" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Multi-selection Action Bar */}
      {isSelectMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-950">
              {selectedIds.length} {selectedIds.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
            </span>
            <span className="text-amber-700">de {filteredProducts.length} productos visibles</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectAllVisible}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 transition cursor-pointer"
            >
              Seleccionar Todos ({filteredProducts.length})
            </button>
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleClearSelection}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition cursor-pointer"
                >
                  Deseleccionar
                </button>
                <button
                  onClick={() => setDeleteModal({ type: 'selected', count: selectedIds.length })}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Seleccionados ({selectedIds.length}) de Supabase</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}


      {/* Import / Sync Status Banner */}
      {importStatus && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in ${
            importStatus.isError
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950 font-medium'
          }`}
        >
          <div className="flex items-center gap-2">
            {importStatus.isError ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{importStatus.text}</span>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cloud Sync Progress */}
      {isSyncingCloud && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-amber-950">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              Sincronizando registros con Supabase...
            </span>
            {syncProgress && (
              <span>
                {syncProgress.current} / {syncProgress.total} productos
              </span>
            )}
          </div>
          {syncProgress && (
            <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9B368] transition-all duration-300"
                style={{ width: `${Math.round((syncProgress.current / Math.max(1, syncProgress.total)) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Supabase Status Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-stone-100 border border-stone-200/80 text-[11px] text-stone-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-stone-800">Supabase Cloud:</span>
          <span className="font-mono text-stone-700">{supabaseConfig.projectId}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            En Nube: <b className="text-emerald-700">{supabaseProductsCount !== null ? `${supabaseProductsCount} registros` : `${products.length} registros`}</b>
          </span>
          <span className="text-stone-300">•</span>
          <span>
            Local: <b className="text-stone-800">{products.length} productos</b>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar aguja, jeringa, gasa, alcohol, solución, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] focus:outline-none focus:border-[#C9B368]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] font-medium focus:outline-none focus:border-[#C9B368] w-full sm:w-auto"
            >
              <option value="all">Todas las Categorías ({products.length})</option>
              {activeCategoriesWithCount.map(({ name, count }) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#1B1A18] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Vista en cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cuadrícula</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-[#1B1A18] text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Vista agrupada por categorías y subcategorías"
            >
              <FolderTree className="w-3.5 h-3.5 text-[#C9B368]" />
              <span className="hidden sm:inline">Agrupado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid or Empty Initial State */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#1B1A18] text-[#C9B368] mx-auto flex items-center justify-center shadow-sm">
            <Package className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-[#1B1A18]">
              Catálogo Inicial Limpio (Sin datos de muestra)
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Los productos de prueba anteriores han sido removidos. Ahora puedes importar directamente tu lista de precios en Excel o CSV, o cargar los más de 320 productos de suministros médicos analizados con un solo clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={handleImportAnalyzedList}
              className="py-3 px-5 rounded-xl bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Importar Lista Analizada (320+ Suministros Médicos)
            </button>

            <label className="py-3 px-5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-[#C9B368]" />
              Subir Archivo Excel / CSV
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-700">No se encontraron productos con el filtro aplicado</p>
          <p className="text-xs text-stone-400 mt-1">Prueba con otra palabra clave o selecciona "Todas las Categorías".</p>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([catName, subGroups]) => {
            const isCollapsed = collapsedCategories.includes(catName);
            const totalInCat = Object.values(subGroups).reduce((sum, list) => sum + list.length, 0);

            return (
              <div key={catName} className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-2xs">
                {/* Category Header Banner */}
                <div
                  onClick={() => toggleCategoryCollapse(catName)}
                  className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-stone-200/80 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-[#1B1A18]">
                          {catName}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9B368]/20 text-[#1B1A18] font-bold">
                          {totalInCat} {totalInCat === 1 ? 'producto' : 'productos'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        {Object.keys(subGroups).length} {Object.keys(subGroups).length === 1 ? 'subcategoría' : 'subcategorías'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-xs hidden sm:inline font-medium">
                      {isCollapsed ? 'Ver productos' : 'Colapsar'}
                    </span>
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Subcategories and Product Cards */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {Object.entries(subGroups).map(([subName, prodsInSub]) => (
                      <div key={subName} className="space-y-3">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-stone-100">
                          <Tag className="w-3.5 h-3.5 text-[#C9B368]" />
                          <h4 className="text-xs sm:text-sm font-bold text-stone-800">
                            {subName}
                          </h4>
                          <span className="text-[11px] text-stone-400 font-medium">
                            ({prodsInSub.length} {prodsInSub.length === 1 ? 'artículo' : 'artículos'})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                          {prodsInSub.map((prod) => renderProductCard(prod))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredProducts.map((prod) => renderProductCard(prod))}
        </div>
      )}

      {/* Modal: Paste CSV / Raw Text */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1B1A18]">Pegar Lista de Precios en Texto o CSV</h3>
                  <p className="text-xs text-stone-500">Detecta automáticamente códigos, nombres, categorías y precios</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Pega aquí el contenido de tu lista de precios:
                </label>
                <textarea
                  rows={10}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="008.3,AGUJA NIPRO HIPODERMICA 16 G * 1 1/2 MORADA,,,,,, $1.98&#10;011,ALCOHOL LOURDES DESNAT. 70° 125 ML,,,,,, $7.96"
                  className="w-full p-3 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#C9B368] resize-none bg-stone-50"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
                El analizador detecta filas con código, descripción y precios con signo ($), así como los encabezados de categorías (AGUJAS, ALCOHOL, GASAS, etc.).
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={!pasteText.trim()}
                  className="py-2.5 px-5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Analizar e Importar Productos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#1B1A18]">
                  {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Suministro Médico'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nombre / Descripción *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. AGUJA NIPRO HIPODERMICA 21 G"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Código del Producto (SKU) *</label>
                  <input
                    type="text"
                    required
                    placeholder="007 o MED-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Características / Presentación</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de empaque, calibres, medidas, esterilización..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Precio Unitario ($ MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700">Categoría *</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCategory(!isCreatingNewCategory)}
                      className="text-[11px] text-[#C9B368] font-bold hover:underline cursor-pointer"
                    >
                      {isCreatingNewCategory ? 'Seleccionar existente' : '+ Crear Nueva'}
                    </button>
                  </div>
                  {isCreatingNewCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Nombre de la nueva categoría..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#C9B368] focus:outline-none bg-amber-50/20 font-medium"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCreatingNewCategory(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] bg-white font-medium"
                    >
                      {formCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__new__">+ Crear Nueva Categoría...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subcategoría (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Desechable, Estéril, Pediátrico..."
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Foto del Producto (Subir o URL)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <ImageIcon className="w-4 h-4 text-[#C9B368]" />
                      Subir Foto desde Archivo
                    </button>
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="O pegar URL de imagen..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] text-xs"
                    />
                  </div>
                </div>
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200">
                    <img src={imageUrl} alt="Vista previa" className="w-10 h-10 object-cover rounded-lg border border-stone-200" />
                    <span className="text-[11px] text-stone-500 truncate flex-1">{imageUrl}</span>
                    <button type="button" onClick={() => setImageUrl('')} className="text-red-500 hover:text-red-700 p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModal({ type: 'single', product: editingProduct });
                    }}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 transition flex items-center gap-1.5 cursor-pointer text-xs"
                    title="Eliminar este producto permanentemente de Supabase"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Eliminar de Supabase</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold transition shadow-sm cursor-pointer"
                  >
                    {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Individual, Multi-selection or Global) */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] animate-in zoom-in-95">
            <div className="p-5 sm:p-6 bg-rose-50/80 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-950">
                  {deleteModal.type === 'single'
                    ? '¿Eliminar producto de Supabase?'
                    : deleteModal.type === 'selected'
                    ? `¿Eliminar ${deleteModal.count} productos de Supabase?`
                    : '¿Vaciar TODO el Catálogo de Supabase?'}
                </h3>
                <p className="text-xs text-rose-700">
                  {deleteModal.type === 'all'
                    ? 'Esta acción eliminará todos los registros en la nube'
                    : 'Se eliminará de la base de datos y de la aplicación'}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {deleteModal.type === 'single' && deleteModal.product && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
                  <img
                    src={deleteModal.product.imageUrl}
                    alt={deleteModal.product.name}
                    className="w-12 h-12 object-cover rounded-xl bg-white border border-stone-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1B1A18] truncate">{deleteModal.product.name}</p>
                    <p className="text-[11px] text-stone-500 font-mono">Código SKU: {deleteModal.product.code}</p>
                    <p className="text-[11px] text-stone-500">Precio: ${(deleteModal.product.price ?? 0).toFixed(2)} MXN</p>
                  </div>
                </div>
              )}

              {deleteModal.type === 'selected' && (
                <p className="text-stone-600 leading-relaxed">
                  Estás a punto de eliminar <span className="font-bold text-[#1B1A18]">{deleteModal.count} productos</span> seleccionados permanentemente tanto de la base de datos Supabase (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">flor_products</code>) como de la aplicación local.
                </p>
              )}

              {deleteModal.type === 'all' && (
                <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-red-950 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>¡Atención! Vaciado completo del catálogo</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    Se borrarán los <span className="font-bold">{deleteModal.count} registros</span> de la tabla <code className="font-mono bg-red-100 px-1 py-0.5 rounded">flor_products</code> en el proyecto de Supabase <span className="font-semibold font-mono">ylzgfsvcibqsztarglja</span>. Esta operación no se puede deshacer.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteModal(null)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Borrando de Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {deleteModal.type === 'single'
                          ? 'Eliminar de Supabase'
                          : deleteModal.type === 'selected'
                          ? `Eliminar (${deleteModal.count}) de Supabase`
                          : 'Sí, Vaciar Todo'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
