import * as XLSX from 'xlsx';
import { Product } from '../types';

export interface ImportedProductRow {
  name: string;
  code: string;
  price: number;
  stock: number;
  discount: number;
  description: string;
  imageUrl?: string;
  category?: string;
}

export const downloadExcelTemplate = () => {
  const sampleData = [
    {
      'Código SKU': 'FL-001',
      'Nombre del Producto': 'Lirios Orientales Premium',
      'Precio ($)': 350.0,
      'Stock': 45,
      'Descuento (%)': 10,
      'Características': 'Bouquet de lirios frescos aromáticos de larga duración',
      'Categoría': 'Lirios',
      'URL Imagen (Opcional)': 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80',
    },
    {
      'Código SKU': 'FL-002',
      'Nombre del Producto': 'Arreglo Floral Elegance Líz',
      'Precio ($)': 680.0,
      'Stock': 20,
      'Descuento (%)': 5,
      'Características': 'Composición floral en jarrón cerámico esmaltado',
      'Categoría': 'Arreglos',
      'URL Imagen (Opcional)': 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80',
    },
    {
      'Código SKU': 'FL-003',
      'Nombre del Producto': 'Caja de Rosas y Follaje Especial',
      'Precio ($)': 520.0,
      'Stock': 30,
      'Descuento (%)': 0,
      'Características': 'Caja de lujo con 24 rosas seleccionadas y follaje decorativo',
      'Categoría': 'Rosas',
      'URL Imagen (Opcional)': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  XLSX.writeFile(workbook, 'Plantilla_Productos_FlorDeLiz.xlsx');
};

export const parseExcelProducts = async (file: File): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const parsedProducts: Product[] = rawJson.map((row, index) => {
          // Normalize column keys
          const getVal = (possibleKeys: string[]): string | number | undefined => {
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase().trim();
              for (const pk of possibleKeys) {
                if (lowerKey.includes(pk.toLowerCase())) {
                  return row[key] as string | number;
                }
              }
            }
            return undefined;
          };

          const code = String(getVal(['código', 'codigo', 'sku', 'id']) || `FL-IMP-${Date.now().toString().slice(-4)}-${index + 1}`);
          const name = String(getVal(['nombre', 'producto', 'name', 'titulo']) || `Producto Importado ${index + 1}`);
          const price = Number(getVal(['precio', 'costo', 'price']) || 0);
          const stock = Number(getVal(['stock', 'existencia', 'cantidad', 'inventario']) || 10);
          const discount = Number(getVal(['descuento', 'discount']) || 0);
          const description = String(getVal(['característica', 'caracteristicas', 'descripcion', 'detalle']) || 'Sin descripción detallada');
          const category = String(getVal(['categoría', 'categoria', 'tipo']) || 'General');
          const imageUrl = String(getVal(['imagen', 'url', 'foto', 'image']) || 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80');

          return {
            id: `prod_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            code,
            price: isNaN(price) ? 0 : price,
            stock: isNaN(stock) ? 0 : stock,
            discount: isNaN(discount) ? 0 : Math.min(100, Math.max(0, discount)),
            description,
            category,
            imageUrl,
            createdAt: new Date().toISOString(),
          };
        });

        resolve(parsedProducts);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
