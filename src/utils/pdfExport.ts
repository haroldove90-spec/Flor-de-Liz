import jsPDF from 'jspdf';
import { Order } from '../types';

let cachedLogoDataUrl: string | null = null;
const SALES_NOTE_TEMPLATE_URL = 'https://ptzdzlafekxtakbfnyur.supabase.co/storage/v1/object/public/Formato/rnota.png';
let cachedSalesNoteTemplate: string | null = null;

/**
 * Loads and converts the official letter size sales note background template (rnota.png)
 * to a base64 DataURL for high-speed, crisp PDF generation.
 */
export const loadSalesNoteBackgroundDataUrl = async (): Promise<string | null> => {
  if (cachedSalesNoteTemplate) return cachedSalesNoteTemplate;

  // 1. Try fetch + blob + objectURL to canvas (avoids cross-origin tainted canvas issues in browsers)
  try {
    const res = await fetch(SALES_NOTE_TEMPLATE_URL, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const dataUrl = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 2550;
            canvas.height = img.naturalHeight || 3300;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(objectUrl);
              return resolve(null);
            }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const jpeg = canvas.toDataURL('image/jpeg', 0.92);
            URL.revokeObjectURL(objectUrl);
            resolve(jpeg);
          } catch {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
      });

      if (dataUrl) {
        cachedSalesNoteTemplate = dataUrl;
        return dataUrl;
      }
    }
  } catch (err) {
    console.warn('Fetch with blob failed, attempting direct Image load fallback:', err);
  }

  // 2. Fallback to direct Image crossOrigin
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 2550;
          canvas.height = img.naturalHeight || 3300;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          cachedSalesNoteTemplate = dataUrl;
          resolve(dataUrl);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        console.warn('Could not load rnota.png from Supabase storage fallback');
        resolve(null);
      };
      img.src = SALES_NOTE_TEMPLATE_URL;
    });
  } catch (e) {
    console.warn('Error loading sales note template:', e);
    return null;
  }
};

// Pre-warm the sales note template and logo cache asynchronously in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    loadSalesNoteBackgroundDataUrl().catch(() => {});
    loadLogoDataUrl().catch(() => {});
  }, 1000);
}

/**
 * Loads and converts the official logo to a base64 DataURL for inclusion in jsPDF documents.
 */
export const loadLogoDataUrl = async (): Promise<string | null> => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch('https://appdesignproyectos.com/florlogo.png', { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const base64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (base64) {
        cachedLogoDataUrl = base64;
        return base64;
      }
    }
  } catch (e) {
    console.warn('Could not load logo for PDF via fetch, trying Image fallback:', e);
  }

  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 300;
          canvas.height = img.naturalHeight || 300;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          cachedLogoDataUrl = dataUrl;
          resolve(dataUrl);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = 'https://appdesignproyectos.com/florlogo.png';
    });
  } catch {
    return null;
  }
};

/**
 * Exports a sales note / purchase order in US Letter format (612 x 792 pt)
 * using the official background template rnota.png with exact column and field alignments.
 */
export const exportLetterSalesNote = async (
  order: Order,
  docType: 'NOTA DE VENTA' | 'ORDEN DE COMPRA' = 'NOTA DE VENTA'
) => {
  const [bgData, logoData] = await Promise.all([
    loadSalesNoteBackgroundDataUrl(),
    loadLogoDataUrl(),
  ]);

  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter', // 612 x 792 pt (Carta oficial estándar)
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (bgData) {
    // 1. Draw official letter background image and logo
    const drawBackground = () => {
      doc.addImage(bgData, 'JPEG', 0, 0, pageWidth, pageHeight);

      // Draw official Flor De Liz logo at top left (x=38, y=26, 62x62 pt)
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', 38, 26, 62, 62);
        } catch (e) {
          console.warn('Error drawing logo on PDF:', e);
        }
      }
    };

    drawBackground();

    // 2. Número de Folio (printed right next to pre-printed "Número de Folio:" label at X=33-185, Y=137-151)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(185, 28, 28); // Dark red accent for the folio number
    doc.text(`#${order.orderNumber}`, 192, 149);

    // 3. Top-Right: Document Type & Date (NO repeated folio number)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(docType, 568, 134, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    const dateStr = new Date(order.createdAt).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Fecha: ${dateStr} ${timeStr}`, 568, 148, { align: 'right' });

    // 4. Customer Info Section (Between Y = 175 and 245 in the clear white region)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(27, 26, 24);

    const clientFull = order.clientBusiness
      ? `${order.clientName} (${order.clientBusiness})`
      : order.clientName;

    doc.text('Cliente:', 38, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(clientFull, 80, 180, { maxWidth: 350 });

    doc.setFont('helvetica', 'bold');
    doc.text('Dirección:', 38, 196);
    doc.setFont('helvetica', 'normal');
    doc.text(order.clientAddress || 'Entrega en mostrador / sin dirección', 90, 196, { maxWidth: 350 });

    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', 38, 212);
    doc.setFont('helvetica', 'normal');
    doc.text(order.clientWhatsapp || order.clientPhone || '---', 85, 212);

    if (order.clientBusiness) {
      doc.setFont('helvetica', 'bold');
      doc.text('Consultorio:', 38, 228);
      doc.setFont('helvetica', 'normal');
      doc.text(order.clientBusiness, 98, 228, { maxWidth: 350 });
    }

    // 5. Mid Section Values (Printed directly UNDER the pre-printed labels at Y = 270)
    // Pre-printed labels at Y=270: "Fecha de cotización" (X~36), "Vencimiento" (X~218), "Vendedor" (X~398)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);

    // Below "Fecha de cotización" (X ≈ 38)
    doc.text(dateStr, 38, 286);

    // Below "Vencimiento" (X ≈ 220)
    doc.text('Contado / Inmediato', 220, 286);

    // Below "Vendedor" (X ≈ 400)
    doc.text(order.vendedorName || 'Comercializadora Flor De Liz', 400, 286, { maxWidth: 170 });

    // 6. Products Table Items (headers are pre-printed on the template at Y=320-345)
    // Pre-printed columns:
    // Referencia interna (~65) | Nombre (~105) | Cantidad (~370) | Precio unitario (~448) | Impuestos (~495) | Importe (~568)
    let curY = 368;
    const maxItemsPerPage = 13;
    let itemsOnCurrentPage = 0;

    (order.items || []).forEach((item, index) => {
      if (itemsOnCurrentPage >= maxItemsPerPage) {
        doc.addPage('letter', 'portrait');
        drawBackground();
        curY = 368;
        itemsOnCurrentPage = 0;
      }

      // Column 1: Referencia interna (SKU o código de producto o # correlativo)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      const codeOrIndex = item.productCode || String(index + 1);
      doc.text(codeOrIndex, 65, curY, { align: 'center' });

      // Column 2: Nombre / Descripción del producto
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      const fullName = item.productName;
      const truncated = fullName.length > 40 ? `${fullName.substring(0, 38)}...` : fullName;
      doc.text(truncated, 105, curY);

      // Column 3: Cantidad (aligned under 'Cantidad' column)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(String(item.quantity || 1), 370, curY, { align: 'right' });

      // Column 4: Precio unitario (aligned under 'Precio unitario' column)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(`$${(item.price ?? 0).toFixed(2)}`, 448, curY, { align: 'right' });

      // Column 5: Impuestos / Descuento (aligned under 'Impuestos' column)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      const taxDiscountText = item.discount > 0 ? `-${item.discount}%` : '-';
      doc.text(taxDiscountText, 495, curY, { align: 'center' });

      // Column 6: Importe (aligned under 'Importe' column)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`$${(item.subtotal ?? 0).toFixed(2)}`, 568, curY, { align: 'right' });

      curY += 20;
      itemsOnCurrentPage++;
    });

    // 7. Totals & Notes Section
    // Place observations above pre-printed "ATNCION:" (which is at Y=685) to avoid overlapping
    if (order.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 70, 70);
      doc.text(`Observaciones: ${order.notes}`, 38, 662, { maxWidth: 380 });
    }

    // Right totals (aligned with right margin 568 pt)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Subtotal:', 460, 686);
    doc.text(`$${(order.subtotal ?? 0).toFixed(2)}`, 568, 686, { align: 'right' });

    if ((order.discountTotal ?? 0) > 0) {
      doc.setTextColor(180, 40, 40);
      doc.text('Descuento:', 460, 702);
      doc.text(`-$${(order.discountTotal ?? 0).toFixed(2)}`, 568, 702, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(17, 24, 39);
    doc.text('TOTAL:', 460, 722);
    doc.text(`$${(order.total ?? 0).toFixed(2)} MXN`, 568, 722, { align: 'right' });

  } else {
    // Fallback if background image could not be loaded (offline)
    const logoData = await loadLogoDataUrl();
    doc.setFillColor(27, 26, 24);
    doc.rect(0, 0, pageWidth, 90, 'F');
    doc.setFillColor(201, 179, 104);
    doc.rect(0, 87, pageWidth, 3, 'F');

    let textStartX = 40;
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', 40, 12, 65, 65);
        textStartX = 115;
      } catch {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COMERCIALIZADORA FLOR DE LIZ', textStartX, 36);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(201, 179, 104);
    doc.text('SUMINISTROS MÉDICOS Y MATERIAL DE CURACIÓN', textStartX, 51);

    doc.setFontSize(8);
    doc.setTextColor(215, 215, 215);
    doc.text(docType, textStartX, 65);

    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 200);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString('es-MX')}`, pageWidth - 40, 40, { align: 'right' });
    doc.text(`Folio: #${order.orderNumber}`, pageWidth - 40, 56, { align: 'right' });

    // Client box
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(220, 215, 200);
    doc.roundedRect(40, 105, pageWidth - 80, 75, 4, 4, 'FD');

    doc.setTextColor(27, 26, 24);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 50, 122);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${order.clientName} ${order.clientBusiness ? `(${order.clientBusiness})` : ''}`, 50, 138);
    doc.text(`Teléfono / WhatsApp: ${order.clientWhatsapp || order.clientPhone}`, 50, 152);
    doc.text(`Dirección: ${order.clientAddress || 'Entrega en sucursal'}`, 50, 166);
    doc.text(`Atendido por: ${order.vendedorName || 'Comercializadora Flor De Liz'}`, pageWidth / 2 + 10, 138);
    doc.text(`Estatus: ${order.status}`, pageWidth / 2 + 10, 152);

    // Items table header
    const startY = 195;
    doc.setFillColor(27, 26, 24);
    doc.rect(40, startY, pageWidth - 80, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CANT.', 60, startY + 14, { align: 'center' });
    doc.text('DESCRIPCIÓN', 95, startY + 14);
    doc.text('PRECIO UNIT.', 375, startY + 14, { align: 'right' });
    doc.text('DESC.', 415, startY + 14, { align: 'center' });
    doc.text('IMPORTE', 565, startY + 14, { align: 'right' });

    let curY = startY + 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    (order.items || []).forEach((item, index) => {
      if (index % 2 === 0) doc.setFillColor(255, 255, 255);
      else doc.setFillColor(248, 246, 242);
      doc.rect(40, curY, pageWidth - 80, 20, 'F');
      doc.setDrawColor(235, 230, 220);
      doc.line(40, curY + 20, pageWidth - 40, curY + 20);

      doc.setTextColor(50, 50, 50);
      doc.text(String(item.quantity || 1), 60, curY + 14, { align: 'center' });
      const fullName = `${item.productName}${item.productCode ? ` [${item.productCode}]` : ''}`;
      doc.text(fullName.length > 40 ? `${fullName.substring(0, 38)}...` : fullName, 95, curY + 14);
      doc.text(`$${(item.price ?? 0).toFixed(2)}`, 375, curY + 14, { align: 'right' });
      doc.text(item.discount > 0 ? `${item.discount}%` : '-', 415, curY + 14, { align: 'center' });
      doc.text(`$${(item.subtotal ?? 0).toFixed(2)}`, 565, curY + 14, { align: 'right' });

      curY += 20;
    });

    // Totals
    curY += 15;
    const totalsBoxX = pageWidth - 230;
    doc.setFillColor(250, 248, 245);
    doc.roundedRect(totalsBoxX, curY, 190, 70, 4, 4, 'FD');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal:', totalsBoxX + 15, curY + 20);
    doc.text(`$${(order.subtotal ?? 0).toFixed(2)}`, totalsBoxX + 175, curY + 20, { align: 'right' });
    if ((order.discountTotal ?? 0) > 0) {
      doc.setTextColor(190, 80, 40);
      doc.text('Descuentos:', totalsBoxX + 15, curY + 36);
      doc.text(`-$${(order.discountTotal ?? 0).toFixed(2)}`, totalsBoxX + 175, curY + 36, { align: 'right' });
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(27, 26, 24);
    doc.text('TOTAL:', totalsBoxX + 15, curY + 58);
    doc.text(`$${(order.total ?? 0).toFixed(2)} MXN`, totalsBoxX + 175, curY + 58, { align: 'right' });
  }

  const filePrefix = docType === 'ORDEN DE COMPRA' ? 'OrdenDeCompra' : 'NotaDeVenta';
  doc.save(`${filePrefix}_${order.orderNumber}_FlorDeLiz.pdf`);
};

export const exportOrderPDF = async (order: Order) => {
  return exportLetterSalesNote(order, 'ORDEN DE COMPRA');
};

export const exportSalesReportPDF = async (orders: Order[], periodLabel = 'General') => {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const logoData = await loadLogoDataUrl();

  // Header Background banner
  doc.setFillColor(27, 26, 24);
  doc.rect(0, 0, pageWidth, 95, 'F');
  doc.setFillColor(201, 179, 104);
  doc.rect(0, 91, pageWidth, 4, 'F');

  // Place official logo
  let textStartX = 40;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 40, 14, 66, 66);
      textStartX = 118;
    } catch (e) {
      console.warn('Error rendering logo in report PDF:', e);
    }
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE GENERAL DE VENTAS Y PEDIDOS', textStartX, 38);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(201, 179, 104);
  doc.text(`COMERCIALIZADORA FLOR DE LIZ • Período: ${periodLabel}`, textStartX, 54);

  doc.setFontSize(8.5);
  doc.setTextColor(215, 215, 215);
  doc.text('Suministros Médicos y Material de Curación', textStartX, 69);

  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, pageWidth - 40, 42, { align: 'right' });
  doc.text(`Registros: ${orders.length}`, pageWidth - 40, 60, { align: 'right' });

  // Summary Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelado' ? o.total : 0), 0);
  const deliveredCount = orders.filter((o) => o.status === 'Entregado').length;
  const inProgressCount = orders.filter((o) => o.status === 'En proceso' || o.status === 'En preparación' || o.status === 'En ruta').length;

  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(220, 215, 200);
  doc.roundedRect(40, 110, pageWidth - 80, 50, 4, 4, 'FD');

  doc.setTextColor(27, 26, 24);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Monto Total Facturado: $${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 55, 132);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pedidos Entregados: ${deliveredCount}  |  Pedidos en Proceso/Ruta: ${inProgressCount}  |  Total Pedidos: ${orders.length}`, 55, 148);

  // Table
  let startY = 175;
  doc.setFillColor(27, 26, 24);
  doc.rect(40, startY, pageWidth - 80, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLIO', 48, startY + 15);
  doc.text('FECHA', 105, startY + 15);
  doc.text('CLIENTE', 180, startY + 15);
  doc.text('VENDEDOR', 300, startY + 15);
  doc.text('ESTADO', 400, startY + 15);
  doc.text('TOTAL', pageWidth - 48, startY + 15, { align: 'right' });

  let curY = startY + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  orders.slice(0, 24).forEach((order, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 246, 242);
    }
    doc.rect(40, curY, pageWidth - 80, 19, 'F');
    doc.setDrawColor(235, 230, 220);
    doc.line(40, curY + 19, pageWidth - 40, curY + 19);

    doc.setTextColor(50, 50, 50);
    doc.text(`#${order.orderNumber}`, 48, curY + 13);
    doc.text(new Date(order.createdAt).toLocaleDateString('es-MX'), 105, curY + 13);
    
    const clientName = order.clientName.length > 20 ? `${order.clientName.substring(0, 18)}..` : order.clientName;
    doc.text(clientName, 180, curY + 13);

    const vendName = (order.vendedorName || 'Admin').length > 16 ? `${(order.vendedorName || 'Admin').substring(0, 14)}..` : (order.vendedorName || 'Admin');
    doc.text(vendName, 300, curY + 13);

    doc.text(order.status, 400, curY + 13);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${(order.total ?? 0).toFixed(2)}`, pageWidth - 48, curY + 13, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    curY += 19;
  });

  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setFillColor(27, 26, 24);
  doc.rect(0, footerY - 5, pageWidth, 35, 'F');
  doc.setTextColor(201, 179, 104);
  doc.setFontSize(8);
  doc.text('Comercializadora Flor De Liz • Reporte Oficial Exportado', pageWidth / 2, footerY + 14, { align: 'center' });

  doc.save(`Reporte_Ventas_FlorDeLiz_${periodLabel.replace(/\s+/g, '_')}.pdf`);
};

export const createWhatsAppOrderLink = (order: Order, recipientPhone?: string) => {
  const phone = recipientPhone || order.clientWhatsapp || order.clientPhone || '5215512345678';
  const cleanPhone = phone.replace(/\D/g, '');

  let text = `🌸 *COMERCIALIZADORA FLOR DE LIZ* 🌸\n`;
  text += `*Comprobante de Pedido #${order.orderNumber}*\n\n`;
  text += `Estimado(a) *${order.clientName}*,\n`;
  if (order.clientBusiness) {
    text += `Negocio: *${order.clientBusiness}*\n`;
  }
  text += `Estado: *${order.status}*\n`;
  text += `Dirección de entrega: ${order.clientAddress}\n\n`;
  text += `📋 *Detalle de productos:*\n`;

  (order.items || []).forEach((item, idx) => {
    const desc = item.discount > 0 ? ` (-${item.discount}%)` : '';
    text += `${idx + 1}. ${item.productName} (${item.productCode || 'MED'}) x${item.quantity || 1} = $${(item.subtotal ?? 0).toFixed(2)}${desc}\n`;
  });

  if (order.discountTotal > 0) {
    text += `\nSubtotal: $${(order.subtotal ?? 0).toFixed(2)}`;
    text += `\nAhorro en descuentos: -$${(order.discountTotal ?? 0).toFixed(2)}`;
  }
  text += `\n*TOTAL A PAGAR: $${(order.total ?? 0).toFixed(2)} MXN*\n\n`;
  text += `¡Gracias por su preferencia! Suministros Médicos y Material de Curación.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

export const createWhatsAppEmployeeInviteLink = (employee: {
  name: string;
  email: string;
  username?: string;
  password?: string;
  accessCode?: string;
  phone: string;
  role: string;
}) => {
  const cleanPhone = employee.phone.replace(/\D/g, '');
  const appUrl = 'https://flor-de-liz-phi.vercel.app/';
  const user = employee.username || employee.email;
  const pass = employee.password || employee.accessCode || 'Flor2026$Med';

  let text = `🌸 *BIENVENIDO(A) A COMERCIALIZADORA FLOR DE LIZ* 🌸\n\n`;
  text += `Hola *${employee.name}*, te compartimos tus credenciales oficiales de acceso como *${employee.role === 'admin' ? 'Administrador' : 'Vendedor'}*:\n\n`;
  text += `🌐 *Link del Sistema:* ${appUrl}\n`;
  text += `👤 *Usuario:* ${user}\n`;
  text += `🔐 *Contraseña:* ${pass}\n\n`;
  text += `Por favor ingresa al enlace para acceder a tu catálogo comercial, cotizaciones y pedidos. ¡Mucho éxito en tus ventas!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

export const createWhatsAppClientInviteLink = (client: {
  name: string;
  businessName?: string;
  phone: string;
  whatsapp?: string;
  username?: string;
  password?: string;
}) => {
  const phone = client.whatsapp || client.phone || '';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = `52${cleanPhone}`;
  const appUrl = 'https://flor-de-liz-phi.vercel.app/';
  const user = client.username || client.phone;
  const pass = client.password || 'Cliente#2026';

  let text = `🌸 *COMERCIALIZADORA FLOR DE LIZ* 🌸\n`;
  text += `¡Hola *${client.name}*!\n\n`;
  text += `Te damos la bienvenida a nuestro portal oficial de *Suministros Médicos y Material de Curación*.\n\n`;
  text += `Ya puedes ingresar para consultar nuestro catálogo completo en línea, precios y realizar tus pedidos:\n\n`;
  text += `🌐 *Enlace de la Plataforma:* ${appUrl}\n`;
  text += `👤 *Usuario:* ${user}\n`;
  text += `🔑 *Contraseña:* ${pass}\n\n`;
  text += `_Guarda tus credenciales para acceder a tus cotizaciones y compras._ ¡Estamos a tus órdenes!`;

  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
};

export const exportSalesNotePDF = async (order: Order) => {
  return exportLetterSalesNote(order, 'NOTA DE VENTA');
};
