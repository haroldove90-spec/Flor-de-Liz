import * as XLSX from 'xlsx';
import { Product } from '../types';

export const cleanTextEncoding = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\uFFFD/g, '°')
    .replace(/\s+/g, ' ')
    .trim();
};

export const downloadMedicalExcelTemplate = () => {
  const sampleData = [
    {
      'Código SKU': '008.3',
      'Nombre / Descripción': 'AGUJA NIPRO HIPODERMICA 16 G * 1 1/2" MORADA',
      'Categoría': 'Agujas',
      'Subcategoría': 'Hipodérmicas',
      'Precio ($ MXN)': 1.98,
      'Stock': 100,
      'Descuento (%)': 0,
      'Características': 'Caja con agujas hipodérmicas esterilizadas desechables',
      'URL Imagen (Opcional)': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    },
    {
      'Código SKU': '011',
      'Nombre / Descripción': 'ALCOHOL LOURDES DESNAT. 70° 125 ML',
      'Categoría': 'Alcohol',
      'Subcategoría': 'Desnaturalizado',
      'Precio ($ MXN)': 7.96,
      'Stock': 80,
      'Descuento (%)': 0,
      'Características': 'Alcohol antiséptico para curación desnaturalizado 70 grados',
      'URL Imagen (Opcional)': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    },
    {
      'Código SKU': '0661',
      'Nombre / Descripción': 'GASA DIBAR 10 X 10 C/100',
      'Categoría': 'Gasas',
      'Subcategoría': 'Esterilizadas',
      'Precio ($ MXN)': 147.00,
      'Stock': 50,
      'Descuento (%)': 0,
      'Características': 'Gasa de algodón esterilizada de alta absorción paquete con 100 pzas',
      'URL Imagen (Opcional)': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
    },
    {
      'Código SKU': '580',
      'Nombre / Descripción': 'JERINGA NIPRO 3 ML VERDE',
      'Categoría': 'Jeringas',
      'Subcategoría': 'Desechables 3ml',
      'Precio ($ MXN)': 2.33,
      'Stock': 200,
      'Descuento (%)': 0,
      'Características': 'Jeringa de 3 ml con aguja estéril libre de pirógenos',
      'URL Imagen (Opcional)': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suministros_Medicos');
  XLSX.writeFile(workbook, 'Plantilla_Suministros_Medicos_FlorDeLiz.xlsx');
};

/**
 * Intelligent parser that handles:
 * 1. The exact medical price list structure (Categories on separate lines, SKU in col 0, Name in col 1, Price in trailing column with $)
 * 2. Standard CSV / Excel files with headers
 */
export const parseRawMedicalPriceList = (rawContent: string): Product[] => {
  const lines = rawContent.split(/\r?\n/);
  const products: Product[] = [];
  let currentCategory = 'Suministros Médicos';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.includes('CAMBIOS DE PRECIO') || rawLine.includes('LISTA DE PRECIOS')) {
      continue;
    }

    // Split line by commas respecting quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const cols: string[] = [];
    let match;
    while ((match = regex.exec(rawLine)) !== null) {
      let cell = match[1] || '';
      if (cell.startsWith('"') && cell.endsWith('"')) {
        cell = cell.substring(1, cell.length - 1).replace(/""/g, '"');
      }
      cols.push(cell.trim());
      if (regex.lastIndex >= rawLine.length) break;
    }

    // Remove empty trailing items
    const nonEmpties = cols.filter((c) => c !== '');
    if (nonEmpties.length === 0) continue;

    // Check if this line is a category header
    // e.g. "AGUJAS,,,,," or ",ALCOHOL,,,,," or "MATERIAL DE HOSPITALIZACIÓN,,,,,"
    const hasPriceValue = cols.some((c) => c.includes('$') || /^\d+(\.\d{1,2})?$/.test(c.trim()));

    if (!hasPriceValue) {
      // It's a category or subcategory header!
      const catCandidate = nonEmpties.find(
        (c) => c !== 'PZA' && c !== 'PRECIO' && isNaN(Number(c)) && c.length > 2
      );
      if (catCandidate) {
        currentCategory = cleanTextEncoding(catCandidate);
      }
      continue;
    }

    // It's a product line!
    // Format: col 0: code, col 1: name, trailing col: price
    let code = cols[0] ? cleanTextEncoding(cols[0]) : '';
    let name = cols[1] ? cleanTextEncoding(cols[1]) : '';

    if (!name && cols.length > 2) {
      name = cleanTextEncoding(cols[2]);
    }

    // If still no name or name is just numbers/dashes, look for first text with letters
    if (!name || name.length < 2) {
      const textCol = cols.find((c, idx) => idx > 0 && /[a-zA-Z]{3,}/.test(c));
      if (textCol) name = cleanTextEncoding(textCol);
    }

    if (!name) continue;

    // Find price
    let price = 0;
    const priceCell = [...cols].reverse().find((c) => c.includes('$') || /^\d+(\.\d+)?$/.test(c.trim()));
    if (priceCell) {
      const cleanPrice = priceCell.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleanPrice);
      if (!isNaN(parsed)) {
        price = parsed;
      }
    }

    // If code is empty or '-', generate clean code
    if (!code || code === '-' || code.length === 0) {
      code = `MED-${(products.length + 1).toString().padStart(4, '0')}`;
    }

    let mainCat = currentCategory;
    let subCat = '';
    if (mainCat.includes('/')) {
      const parts = mainCat.split('/');
      mainCat = cleanTextEncoding(parts[0]);
      subCat = cleanTextEncoding(parts[1]);
    } else if (mainCat.includes(' - ')) {
      const parts = mainCat.split(' - ');
      mainCat = cleanTextEncoding(parts[0]);
      subCat = cleanTextEncoding(parts[1]);
    } else if (mainCat.includes('>')) {
      const parts = mainCat.split('>');
      mainCat = cleanTextEncoding(parts[0]);
      subCat = cleanTextEncoding(parts[1]);
    }

    products.push({
      id: `prod_med_${Date.now()}_${products.length + 1}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      code,
      price,
      stock: 50, // Standard default stock
      discount: 0,
      description: `Material de curación y suministro médico especializado de alta calidad. Categoría: ${mainCat}${subCat ? ` • Subcategoría: ${subCat}` : ''}.`,
      category: mainCat,
      subCategory: subCat || undefined,
      imageUrl: getPlaceholderImageForCategory(mainCat),
      createdAt: new Date().toISOString(),
    });
  }

  return products;
};

export const getPlaceholderImageForCategory = (cat: string): string => {
  const lower = cat.toLowerCase();
  if (lower.includes('aguja') || lower.includes('jeringa') || lower.includes('punzocat')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
  }
  if (lower.includes('alcohol') || lower.includes('antiséptico') || lower.includes('soluci')) {
    return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80';
  }
  if (lower.includes('gasa') || lower.includes('algod') || lower.includes('venda') || lower.includes('aposito')) {
    return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80';
  }
  if (lower.includes('guante')) {
    return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80';
  }
  if (lower.includes('hospital') || lower.includes('cirujano') || lower.includes('bistur') || lower.includes('tijera')) {
    return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80';
  }
  if (lower.includes('pomada') || lower.includes('ung') || lower.includes('aceite') || lower.includes('rebotica')) {
    return 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
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

        // First convert to raw CSV text to support hierarchical categories or un-structured lists
        const csvString = XLSX.utils.sheet_to_csv(worksheet);
        
        // If the file matches the category-based price list structure, use raw parser
        if (csvString.includes('LISTA DE PRECIOS') || csvString.includes('AGUJAS') || csvString.includes('GASAS') || csvString.includes('ALCOHOL')) {
          const parsed = parseRawMedicalPriceList(csvString);
          if (parsed.length > 0) {
            resolve(parsed);
            return;
          }
        }

        // Otherwise parse as standard key-value json table
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const parsedProducts: Product[] = rawJson.map((row, index) => {
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

          const code = cleanTextEncoding(String(getVal(['código', 'codigo', 'sku', 'id', 'pza']) || `MED-${Date.now().toString().slice(-4)}-${index + 1}`));
          const name = cleanTextEncoding(String(getVal(['nombre', 'producto', 'name', 'descripcion', 'descripción', 'titulo']) || `Producto ${index + 1}`));
          const priceRaw = getVal(['precio', 'costo', 'price', '$']);
          const price = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw || '0').replace(/[^0-9.]/g, '')) || 0;
          const stock = Number(getVal(['stock', 'existencia', 'cantidad', 'inventario']) || 50);
          const discount = Number(getVal(['descuento', 'discount']) || 0);
          const description = cleanTextEncoding(String(getVal(['característica', 'caracteristicas', 'descripcion', 'detalle']) || 'Material de curación y suministros médicos.'));
          
          let category = cleanTextEncoding(String(getVal(['categoría', 'categoria', 'tipo', 'linea', 'grupo']) || 'Suministros Médicos'));
          let subCategory = cleanTextEncoding(String(getVal(['subcategoría', 'subcategoria', 'subgrupo', 'subclase', 'sub', 'marca', 'presentacion']) || ''));

          if (!subCategory && category.includes('/')) {
            const parts = category.split('/');
            category = cleanTextEncoding(parts[0]);
            subCategory = cleanTextEncoding(parts[1]);
          } else if (!subCategory && category.includes(' - ')) {
            const parts = category.split(' - ');
            category = cleanTextEncoding(parts[0]);
            subCategory = cleanTextEncoding(parts[1]);
          }

          const imageUrl = String(getVal(['imagen', 'url', 'foto', 'image']) || getPlaceholderImageForCategory(category));

          return {
            id: `prod_med_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            name,
            code,
            price: isNaN(price) ? 0 : price,
            stock: isNaN(stock) ? 50 : stock,
            discount: isNaN(discount) ? 0 : Math.min(100, Math.max(0, discount)),
            description,
            category,
            subCategory: subCategory || undefined,
            imageUrl,
            createdAt: new Date().toISOString(),
          };
        }).filter((p) => p.name && p.name !== 'undefined' && !p.name.includes('CAMBIOS DE PRECIO'));

        resolve(parsedProducts);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Export products to formatted Excel (.xlsx) file
 */
export const exportProductsToExcel = (products: Product[], filename?: string) => {
  if (!products || products.length === 0) return;

  const rows = products.map((p) => {
    const discount = p.discount || 0;
    const finalPrice = p.price * (1 - discount / 100);
    return {
      'Código / SKU': p.code,
      'Nombre del Producto': p.name,
      'Categoría': p.category || 'Suministros Médicos',
      'Subcategoría': p.subCategory || '',
      'Precio Lista ($ MXN)': Number(p.price.toFixed(2)),
      'Descuento (%)': discount,
      'Precio Final ($ MXN)': Number(finalPrice.toFixed(2)),
      'Stock Disponible': p.stock,
      'Descripción / Características': p.description,
      'URL Imagen': p.imageUrl || '',
      'Fecha Registro': p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-MX') : '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suministros_Medicos');
  
  const actualName = filename || `Catalogo_Productos_FlorDeLiz_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, actualName);
};

