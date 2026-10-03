import jsPDF from 'jspdf';
import { Order } from '../types';

let cachedLogoDataUrl: string | null = null;

/**
 * Loads and converts the official logo to a base64 DataURL for inclusion in jsPDF documents.
 */
export const loadLogoDataUrl = async (): Promise<string | null> => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch('https://appdesignproyectos.com/florlogo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        cachedLogoDataUrl = base64;
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not load logo for PDF:', e);
    return null;
  }
};

export const exportOrderPDF = async (order: Order) => {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const logoData = await loadLogoDataUrl();

  // Header Background banner
  doc.setFillColor(27, 26, 24); // #1B1A18
  doc.rect(0, 0, pageWidth, 95, 'F');

  // Gold accent line
  doc.setFillColor(201, 179, 104); // #C9B368
  doc.rect(0, 91, pageWidth, 4, 'F');

  // Place official logo
  let textStartX = 40;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 40, 14, 66, 66);
      textStartX = 118;
    } catch (e) {
      console.warn('Error rendering logo in PDF:', e);
    }
  }

  // Title & Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('COMERCIALIZADORA FLOR DE LIZ', textStartX, 38);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(201, 179, 104);
  doc.text('SUMINISTROS MÉDICOS Y MATERIAL DE CURACIÓN', textStartX, 54);

  doc.setFontSize(8.5);
  doc.setTextColor(215, 215, 215);
  doc.text('COMPROBANTE FORMAL DE PEDIDO / COTIZACIÓN', textStartX, 69);

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString('es-MX')}`, pageWidth - 40, 42, { align: 'right' });
  doc.text(`Folio: #${order.orderNumber}`, pageWidth - 40, 60, { align: 'right' });

  // Client Details Box
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(220, 215, 200);
  doc.roundedRect(40, 115, pageWidth - 80, 85, 6, 6, 'FD');

  doc.setTextColor(27, 26, 24);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE Y ENVÍO', 55, 135);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${order.clientName}`, 55, 153);
  if (order.clientBusiness) {
    doc.text(`Negocio: ${order.clientBusiness}`, 55, 168);
  }
  doc.text(`Teléfono / WhatsApp: ${order.clientWhatsapp || order.clientPhone}`, 55, 183);

  const rightColX = pageWidth / 2 + 10;
  doc.text(`Dirección: ${order.clientAddress || 'No especificada'}`, rightColX, 153);
  doc.text(`Atendido por: ${order.vendedorName || 'Venta Directa'}`, rightColX, 168);
  doc.text(`Estado del Pedido: ${order.status.toUpperCase()}`, rightColX, 183);

  // Items Table Header
  let startY = 225;
  doc.setFillColor(27, 26, 24);
  doc.rect(40, startY, pageWidth - 80, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO', 50, startY + 16);
  doc.text('DESCRIPCIÓN DEL PRODUCTO', 130, startY + 16);
  doc.text('CANT.', 340, startY + 16, { align: 'right' });
  doc.text('PRECIO UNIT.', 420, startY + 16, { align: 'right' });
  doc.text('DESC.', 475, startY + 16, { align: 'right' });
  doc.text('SUBTOTAL', pageWidth - 50, startY + 16, { align: 'right' });

  // Items Rows
  let curY = startY + 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  order.items.forEach((item, index) => {
    // Alternating background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 246, 242);
    }
    doc.rect(40, curY, pageWidth - 80, 22, 'F');
    doc.setDrawColor(235, 230, 220);
    doc.line(40, curY + 22, pageWidth - 40, curY + 22);

    doc.setTextColor(50, 50, 50);
    doc.text(item.productCode || '---', 50, curY + 15);
    
    // Truncate long product names
    const truncatedName = item.productName.length > 34 ? `${item.productName.substring(0, 32)}...` : item.productName;
    doc.text(truncatedName, 130, curY + 15);

    doc.text(String(item.quantity || 1), 340, curY + 15, { align: 'right' });
    doc.text(`$${(item.price ?? 0).toFixed(2)}`, 420, curY + 15, { align: 'right' });
    doc.text(item.discount > 0 ? `${item.discount}%` : '-', 475, curY + 15, { align: 'right' });
    doc.text(`$${(item.subtotal ?? 0).toFixed(2)}`, pageWidth - 50, curY + 15, { align: 'right' });

    curY += 22;
  });

  // Totals box
  curY += 15;
  const totalsBoxX = pageWidth - 240;
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(totalsBoxX, curY, 200, 75, 4, 4, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', totalsBoxX + 15, curY + 20);
  doc.text(`$${(order.subtotal ?? 0).toFixed(2)}`, pageWidth - 55, curY + 20, { align: 'right' });

  if (order.discountTotal > 0) {
    doc.setTextColor(190, 80, 40);
    doc.text('Descuentos aplicados:', totalsBoxX + 15, curY + 36);
    doc.text(`-$${(order.discountTotal ?? 0).toFixed(2)}`, pageWidth - 55, curY + 36, { align: 'right' });
  }

  doc.setFillColor(201, 179, 104);
  doc.rect(totalsBoxX + 10, curY + 45, 180, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(27, 26, 24);
  doc.text('TOTAL:', totalsBoxX + 15, curY + 62);
  doc.text(`$${(order.total ?? 0).toFixed(2)} MXN`, pageWidth - 55, curY + 62, { align: 'right' });

  // Notes if present
  if (order.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Observaciones: ${order.notes}`, 40, curY + 40);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 35;
  doc.setFillColor(27, 26, 24);
  doc.rect(0, footerY - 5, pageWidth, 40, 'F');
  doc.setTextColor(201, 179, 104);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Comercializadora Flor De Liz • Suministros Médicos y Material de Curación • WhatsApp: +52 1 55 1234 5678', pageWidth / 2, footerY + 12, { align: 'center' });

  doc.save(`Pedido_${order.orderNumber}_FlorDeLiz.pdf`);
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
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const logoData = await loadLogoDataUrl();

  // Header Background banner
  doc.setFillColor(27, 26, 24);
  doc.rect(0, 0, pageWidth, 95, 'F');

  // Gold accent line
  doc.setFillColor(201, 179, 104);
  doc.rect(0, 91, pageWidth, 4, 'F');

  // Place official logo
  let textStartX = 40;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 40, 14, 66, 66);
      textStartX = 118;
    } catch (e) {
      console.warn('Error rendering logo in PDF:', e);
    }
  }

  // Title & Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('COMERCIALIZADORA FLOR DE LIZ', textStartX, 38);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(201, 179, 104);
  doc.text('SUMINISTROS MÉDICOS Y MATERIAL DE CURACIÓN', textStartX, 54);

  doc.setFontSize(8.5);
  doc.setTextColor(215, 215, 215);
  doc.text('NOTA DE VENTA / ORDEN DE COMPRA OFICIAL', textStartX, 69);

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString('es-MX')}`, pageWidth - 40, 42, { align: 'right' });
  doc.text(`Nota / Folio: #${order.orderNumber}`, pageWidth - 40, 60, { align: 'right' });

  // Client Details Box
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(220, 215, 200);
  doc.roundedRect(40, 115, pageWidth - 80, 85, 6, 6, 'FD');

  doc.setTextColor(27, 26, 24);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA OPERACIÓN Y CLIENTE', 55, 135);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${order.clientName}`, 55, 153);
  if (order.clientBusiness) {
    doc.text(`Empresa / Consultorio: ${order.clientBusiness}`, 55, 168);
  }
  doc.text(`Teléfono / WhatsApp: ${order.clientWhatsapp || order.clientPhone}`, 55, 183);

  const rightColX = pageWidth / 2 + 10;
  doc.text(`Dirección de Entrega: ${order.clientAddress || 'Entrega en sucursal'}`, rightColX, 153);
  doc.text(`Canal / Vendedor: ${order.vendedorName || (order.source === 'cliente_whatsapp' ? 'Venta Directa Cliente' : 'Administración')}`, rightColX, 168);
  doc.text(`Estatus del Pedido: ${order.status.toUpperCase()}`, rightColX, 183);

  // Items Table Header
  let startY = 225;
  doc.setFillColor(27, 26, 24);
  doc.rect(40, startY, pageWidth - 80, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SKU / CÓDIGO', 50, startY + 16);
  doc.text('DESCRIPCIÓN DEL ARTÍCULO', 130, startY + 16);
  doc.text('CANT.', 340, startY + 16, { align: 'right' });
  doc.text('PRECIO UNIT.', 420, startY + 16, { align: 'right' });
  doc.text('DESC.', 475, startY + 16, { align: 'right' });
  doc.text('SUBTOTAL', pageWidth - 50, startY + 16, { align: 'right' });

  // Items Rows
  let curY = startY + 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  order.items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 246, 242);
    }
    doc.rect(40, curY, pageWidth - 80, 22, 'F');
    doc.setDrawColor(235, 230, 220);
    doc.line(40, curY + 22, pageWidth - 40, curY + 22);

    doc.setTextColor(50, 50, 50);
    doc.text(item.productCode || '---', 50, curY + 15);
    
    const truncatedName = item.productName.length > 34 ? `${item.productName.substring(0, 32)}...` : item.productName;
    doc.text(truncatedName, 130, curY + 15);

    doc.text(String(item.quantity || 1), 340, curY + 15, { align: 'right' });
    doc.text(`$${(item.price ?? 0).toFixed(2)}`, 420, curY + 15, { align: 'right' });
    doc.text(item.discount > 0 ? `${item.discount}%` : '-', 475, curY + 15, { align: 'right' });
    doc.text(`$${(item.subtotal ?? 0).toFixed(2)}`, pageWidth - 50, curY + 15, { align: 'right' });

    curY += 22;
  });

  // Totals box
  curY += 15;
  const totalsBoxX = pageWidth - 240;
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(totalsBoxX, curY, 200, 75, 4, 4, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', totalsBoxX + 15, curY + 20);
  doc.text(`$${(order.subtotal ?? 0).toFixed(2)}`, pageWidth - 55, curY + 20, { align: 'right' });

  if (order.discountTotal > 0) {
    doc.setTextColor(190, 80, 40);
    doc.text('Ahorro por Descuento:', totalsBoxX + 15, curY + 36);
    doc.text(`-$${(order.discountTotal ?? 0).toFixed(2)}`, pageWidth - 55, curY + 36, { align: 'right' });
  }

  doc.setFillColor(201, 179, 104);
  doc.rect(totalsBoxX + 10, curY + 45, 180, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(27, 26, 24);
  doc.text('TOTAL A PAGAR:', totalsBoxX + 15, curY + 62);
  doc.text(`$${(order.total ?? 0).toFixed(2)} MXN`, pageWidth - 55, curY + 62, { align: 'right' });

  // Notes if present
  if (order.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Observaciones / Dedicatoria: ${order.notes}`, 40, curY + 40);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 35;
  doc.setFillColor(27, 26, 24);
  doc.rect(0, footerY - 5, pageWidth, 40, 'F');
  doc.setTextColor(201, 179, 104);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Comercializadora Flor De Liz • Suministros Médicos y Material de Curación • WhatsApp: +52 1 55 1234 5678', pageWidth / 2, footerY + 12, { align: 'center' });

  doc.save(`NotaDeVenta_${order.orderNumber}_FlorDeLiz.pdf`);
};
