import { Invoice, IInvoice } from './invoice.model.js'
import { getNextInvoiceNumber } from './invoiceCounter.model.js'
import { Sale } from '../sales/sale.model.js'
import PDFDocument from 'pdfkit'

interface CreateInvoiceInput {
  saleId?: string
  customerName?: string
  customerPhone?: string
  customerDoc?: string
  customerAddress?: string
  taxRate?: number
  notes?: string
}

interface InvoiceFilters {
  startDate?: string
  endDate?: string
  status?: string
}

export async function createInvoiceFromSale(saleId: string, employeeId: string, input?: CreateInvoiceInput) {
  const sale = await Sale.findById(saleId).populate('employeeId', 'fullName')
  if (!sale) throw { status: 404, message: 'Venta no encontrada' }
  if (sale.status === 'voided') throw { status: 400, message: 'No se puede facturar una venta anulada' }

  const existing = await Invoice.findOne({ saleId })
  if (existing) throw { status: 400, message: 'Esta venta ya tiene una factura asociada' }

  const taxRate = input?.taxRate ?? 0
  const tax = Math.round(sale.total * taxRate / 100 * 100) / 100

  const invoiceNumber = await getNextInvoiceNumber()

  const invoice = new Invoice({
    invoiceNumber,
    saleId: sale._id,
    employeeId,
    customerName: input?.customerName ?? sale.customerName,
    customerPhone: input?.customerPhone ?? sale.customerPhone,
    customerDoc: input?.customerDoc,
    customerAddress: input?.customerAddress,
    items: sale.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      saleUnit: item.saleUnit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    subtotal: sale.total,
    taxRate,
    tax,
    total: Math.round((sale.total + tax) * 100) / 100,
    paymentMethod: sale.paymentMethod,
    notes: input?.notes,
  })

  await invoice.save()
  return invoice.populate('employeeId', 'fullName')
}

export async function listInvoices(filters: InvoiceFilters) {
  const query: Record<string, unknown> = {}

  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
    if (filters.endDate) dateFilter.$lte = new Date(filters.endDate)
    query.date = dateFilter
  }

  if (filters.status) {
    query.status = filters.status
  }

  return Invoice.find(query)
    .sort({ date: -1 })
    .populate('employeeId', 'fullName')
}

export async function getInvoiceById(id: string) {
  const invoice = await Invoice.findById(id).populate('employeeId', 'fullName')
  if (!invoice) throw { status: 404, message: 'Factura no encontrada' }
  return invoice
}

export async function cancelInvoice(id: string, reason: string) {
  if (!reason) throw { status: 400, message: 'El motivo de cancelación es obligatorio' }

  const invoice = await Invoice.findById(id)
  if (!invoice) throw { status: 404, message: 'Factura no encontrada' }
  if (invoice.status === 'cancelled') throw { status: 400, message: 'La factura ya está cancelada' }

  invoice.status = 'cancelled'
  invoice.cancelledReason = reason
  await invoice.save()

  return invoice.populate('employeeId', 'fullName')
}

export async function generateInvoicePdf(id: string): Promise<Buffer> {
  const invoice = await Invoice.findById(id).populate('employeeId', 'fullName')
  if (!invoice) throw { status: 404, message: 'Factura no encontrada' }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const brandColor = '#1A2333'
    const accentColor = '#E8823C'
    const grayColor = '#6B7280'

    doc.font('Helvetica-Bold').fontSize(22).fillColor(accentColor).text('TuboGest', 50, 50)
    doc.font('Helvetica').fontSize(10).fillColor(grayColor)
      .text('NIT: 900.123.456-7', 50, 75)
      .text('Calle 123 # 45-67', 50, 88)
      .text('Bogotá, Colombia', 50, 101)
      .text('Tel: (601) 234 5678', 50, 114)

    doc.font('Helvetica-Bold').fontSize(16).fillColor(brandColor)
      .text('FACTURA DE VENTA', 300, 50, { align: 'right' })
    doc.font('Helvetica').fontSize(10).fillColor(grayColor)
      .text(`No. ${invoice.invoiceNumber}`, 300, 72, { align: 'right' })
      .text(`Fecha: ${invoice.date.toLocaleDateString('es-CO')}`, 300, 86, { align: 'right' })

    doc.moveTo(50, 145).lineTo(545, 145).strokeColor('#E5E7EB').stroke()

    doc.font('Helvetica-Bold').fontSize(10).fillColor(brandColor)
      .text('DATOS DEL CLIENTE', 50, 165)

    const customerY = 180
    doc.font('Helvetica').fontSize(10).fillColor('#374151')
      .text(`Nombre: ${invoice.customerName || 'Consumidor Final'}`, 50, customerY)
      .text(`Teléfono: ${invoice.customerPhone || 'N/A'}`, 50, customerY + 15)

    if (invoice.customerDoc) {
      doc.text(`NIT/CC: ${invoice.customerDoc}`, 50, customerY + 30)
    }
    if (invoice.customerAddress) {
      doc.text(`Dirección: ${invoice.customerAddress}`, 50, customerY + 45)
    }

    doc.moveTo(50, customerY + 60).lineTo(545, customerY + 60).strokeColor('#E5E7EB').stroke()

    const tableTop = customerY + 75
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
    doc.roundedRect(50, tableTop, 495, 22, 4).fill(accentColor)
    doc.fillColor('#FFFFFF')
      .text('Cant.', 58, tableTop + 6, { width: 50 })
      .text('Unidad', 108, tableTop + 6, { width: 60 })
      .text('Producto', 168, tableTop + 6, { width: 180 })
      .text('P. Unit', 348, tableTop + 6, { width: 80, align: 'right' })
      .text('Subtotal', 448, tableTop + 6, { width: 80, align: 'right' })

    let y = tableTop + 30
    doc.font('Helvetica').fontSize(9).fillColor('#374151')

    for (const item of invoice.items) {
      const unitLabel = item.saleUnit === 'meter' ? 'm' : item.saleUnit === 'centimeter' ? 'cm' : 'uds'

      doc.text(item.quantity.toString(), 58, y, { width: 50 })
        .text(unitLabel, 108, y, { width: 60 })
        .text(item.productName, 168, y, { width: 180 })
        .text(`$${item.unitPrice.toLocaleString('es-CO')}`, 348, y, { width: 80, align: 'right' })
        .text(`$${item.subtotal.toLocaleString('es-CO')}`, 448, y, { width: 80, align: 'right' })

      y += 18
      if (y > 700) {
        doc.addPage()
        y = 50
      }
    }

    doc.moveTo(350, y + 5).lineTo(545, y + 5).strokeColor('#E5E7EB').stroke()

    const totalsY = y + 12
    doc.font('Helvetica').fontSize(10).fillColor('#374151')
      .text('Subtotal:', 350, totalsY, { width: 100, align: 'right' })
      .text(`$${invoice.subtotal.toLocaleString('es-CO')}`, 455, totalsY, { width: 90, align: 'right' })

    if (invoice.taxRate > 0) {
      doc.text(`IVA (${invoice.taxRate}%):`, 350, totalsY + 18, { width: 100, align: 'right' })
        .text(`$${invoice.tax.toLocaleString('es-CO')}`, 455, totalsY + 18, { width: 90, align: 'right' })
    }

    doc.font('Helvetica-Bold').fontSize(12).fillColor(brandColor)
      .text('TOTAL:', 350, totalsY + (invoice.taxRate > 0 ? 40 : 20), { width: 100, align: 'right' })
      .text(`$${invoice.total.toLocaleString('es-CO')}`, 455, totalsY + (invoice.taxRate > 0 ? 40 : 20), { width: 90, align: 'right' })

    doc.moveTo(50, 740).lineTo(545, 740).strokeColor('#E5E7EB').stroke()
    doc.font('Helvetica').fontSize(8).fillColor(grayColor).text('TuboGest ERP - Documento generado electrónicamente', 50, 750, { align: 'center' })

    doc.end()
  })
}
