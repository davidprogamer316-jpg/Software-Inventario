import { getConfig } from '../config/config.model.js'
import PDFDocument from 'pdfkit'

interface QuotationItem {
  productName: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  quantity: number
  unitPrice: number
  subtotal: number
}

interface GenerateQuotationInput {
  customerName?: string
  customerPhone?: string
  notes?: string
  items: QuotationItem[]
}

function generateNumber(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `COT-${year}${month}${day}-${rand}`
}

export async function generateQuotationPdf(input: GenerateQuotationInput): Promise<Buffer> {
  const config = await getConfig()

  const total = input.items.reduce((sum, i) => sum + i.subtotal, 0)
  const quotationNumber = generateNumber()

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

    doc.font('Helvetica-Bold').fontSize(16).fillColor(accentColor)
      .text('COTIZACIÓN', 300, 50, { align: 'right' })
    doc.font('Helvetica').fontSize(10).fillColor(grayColor)
      .text(`No. ${quotationNumber}`, 300, 72, { align: 'right' })
      .text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 300, 86, { align: 'right' })

    doc.font('Helvetica').fontSize(9).fillColor(grayColor)
      .text('Válida por 15 días', 300, 100, { align: 'right' })

    doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#E5E7EB').stroke()

    doc.font('Helvetica-Bold').fontSize(10).fillColor(brandColor)
      .text('DATOS DEL CLIENTE', 50, 150)

    const customerY = 165
    doc.font('Helvetica').fontSize(10).fillColor('#374151')
      .text(`Nombre: ${input.customerName || 'Consumidor Final'}`, 50, customerY)
    if (input.customerPhone) {
      doc.text(`Teléfono: ${input.customerPhone}`, 50, customerY + 15)
    }

    const detailsBottom = input.customerPhone ? customerY + 30 : customerY + 20
    doc.moveTo(50, detailsBottom + 5).lineTo(545, detailsBottom + 5).strokeColor('#E5E7EB').stroke()

    const tableTop = detailsBottom + 20
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

    for (const item of input.items) {
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
    doc.font('Helvetica-Bold').fontSize(12).fillColor(brandColor)
      .text('TOTAL:', 350, totalsY, { width: 100, align: 'right' })
      .text(`$${total.toLocaleString('es-CO')}`, 455, totalsY, { width: 90, align: 'right' })

    if (input.notes) {
      const notesY = totalsY + 30
      doc.moveTo(50, notesY - 5).lineTo(545, notesY - 5).strokeColor('#E5E7EB').stroke()
      doc.font('Helvetica-Bold').fontSize(10).fillColor(brandColor)
        .text('Notas:', 50, notesY + 5)
      doc.font('Helvetica').fontSize(9).fillColor('#374151')
        .text(input.notes, 50, notesY + 22, { width: 495 })
    }

    doc.moveTo(50, 740).lineTo(545, 740).strokeColor('#E5E7EB').stroke()
    doc.font('Helvetica').fontSize(8).fillColor(grayColor).text(`${config.companyName || 'Eurometales'} - Cotización generada electrónicamente`, 50, 750, { align: 'center' })

    doc.end()
  })
}
