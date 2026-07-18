import { PurchaseInvoice, IPurchaseInvoice } from './purchaseInvoice.model.js'
import { Purchase } from '../purchases/purchase.model.js'
import { getNextInvoiceNumber } from '../finance/invoiceCounter.model.js'
import { getConfig } from '../config/config.model.js'
import PDFDocument from 'pdfkit'

export async function createFromPurchase(purchaseId: string) {
  const purchase = await Purchase.findById(purchaseId).populate('providerId')
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }

  const existing = await PurchaseInvoice.findOne({ purchaseId })
  if (existing) throw { status: 400, message: 'Esta compra ya tiene una factura asociada' }

  const invoiceNumber = await getNextInvoiceNumber('PINV')

  const invoice = new PurchaseInvoice({
    invoiceNumber,
    purchaseId: purchase._id,
    providerId: purchase.providerId,
    providerName: purchase.providerName,
    items: purchase.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      saleUnit: item.saleUnit,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.subtotal,
    })),
    total: purchase.total,
  })

  await invoice.save()

  await Purchase.findByIdAndUpdate(purchaseId, { purchaseInvoiceId: invoice._id })

  return invoice
}

export async function getPurchaseInvoiceById(id: string) {
  const invoice = await PurchaseInvoice.findById(id)
  if (!invoice) throw { status: 404, message: 'Factura de compra no encontrada' }
  return invoice
}

export async function listPurchaseInvoices() {
  return PurchaseInvoice.find().sort({ date: -1 })
}

export async function generatePurchaseInvoicePdf(id: string): Promise<Buffer> {
  const invoice = await PurchaseInvoice.findById(id)
  if (!invoice) throw { status: 404, message: 'Factura de compra no encontrada' }

  const config = await getConfig()

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const brandColor = '#1A2333'
    const accentColor = '#E8823C'
    const grayColor = '#6B7280'

    doc.font('Helvetica-Bold').fontSize(22).fillColor(accentColor).text(config.companyName || 'Eurometales', 50, 50)
    doc.font('Helvetica').fontSize(10).fillColor(grayColor)
    if (config.nit) doc.text(`NIT: ${config.nit}`, 50, 75)
    if (config.address) doc.text(config.address, 50, config.nit ? 88 : 75)
    if (config.city) doc.text(config.city, 50, config.nit ? (config.address ? 101 : 88) : 88)
    if (config.phone) doc.text(`Tel: ${config.phone}`, 50, config.nit ? (config.address ? 114 : 101) : (config.address ? 101 : 88))

    doc.font('Helvetica-Bold').fontSize(16).fillColor(brandColor)
      .text('FACTURA DE COMPRA', 300, 50, { align: 'right' })
    doc.font('Helvetica').fontSize(10).fillColor(grayColor)
      .text(`No. ${invoice.invoiceNumber}`, 300, 72, { align: 'right' })
      .text(`Fecha: ${invoice.date.toLocaleDateString('es-CO')}`, 300, 86, { align: 'right' })

    doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#E5E7EB').stroke()

    doc.font('Helvetica-Bold').fontSize(10).fillColor(brandColor)
      .text('DATOS DEL PROVEEDOR', 50, 150)

    const providerY = 165
    doc.font('Helvetica').fontSize(10).fillColor('#374151')
      .text(`Proveedor: ${invoice.providerName}`, 50, providerY)

    doc.moveTo(50, providerY + 20).lineTo(545, providerY + 20).strokeColor('#E5E7EB').stroke()

    const tableTop = providerY + 35
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
    doc.roundedRect(50, tableTop, 495, 22, 4).fill(accentColor)
    doc.fillColor('#FFFFFF')
      .text('Cant.', 58, tableTop + 6, { width: 50 })
      .text('Unidad', 108, tableTop + 6, { width: 60 })
      .text('Producto', 168, tableTop + 6, { width: 180 })
      .text('C. Unit', 348, tableTop + 6, { width: 80, align: 'right' })
      .text('Subtotal', 448, tableTop + 6, { width: 80, align: 'right' })

    let y = tableTop + 30
    doc.font('Helvetica').fontSize(9).fillColor('#374151')

    for (const item of invoice.items) {
      const unitLabel = item.saleUnit === 'meter' ? 'm' : item.saleUnit === 'centimeter' ? 'cm' : 'uds'

      doc.text(item.quantity.toString(), 58, y, { width: 50 })
        .text(unitLabel, 108, y, { width: 60 })
        .text(item.productName, 168, y, { width: 180 })
        .text(`$${item.unitCost.toLocaleString('es-CO')}`, 348, y, { width: 80, align: 'right' })
        .text(`$${item.subtotal.toLocaleString('es-CO')}`, 448, y, { width: 80, align: 'right' })

      y += 18
      if (y > 700) {
        doc.addPage()
        y = 50
      }
    }

    doc.moveTo(350, y + 5).lineTo(545, y + 5).strokeColor('#E5E7EB').stroke()

    const totalsY = y + 12
    doc.font('Helvetica-Bold').fontSize(12).fillColor(brandColor)
      .text('TOTAL:', 350, totalsY, { width: 100, align: 'right' })
      .text(`$${invoice.total.toLocaleString('es-CO')}`, 455, totalsY, { width: 90, align: 'right' })

    doc.moveTo(50, 740).lineTo(545, 740).strokeColor('#E5E7EB').stroke()
    doc.font('Helvetica').fontSize(8).fillColor(grayColor).text(`${config.companyName || 'Eurometales'} - Factura de compra generada electrónicamente`, 50, 750, { align: 'center' })

    doc.end()
  })
}
