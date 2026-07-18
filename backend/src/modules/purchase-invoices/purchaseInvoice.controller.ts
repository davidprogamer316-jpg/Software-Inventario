import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as service from './purchaseInvoice.service.js'

export async function createFromPurchase(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await service.createFromPurchase(req.body.purchaseId)
    res.status(201).json(invoice)
  } catch (error) {
    next(error)
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoices = await service.listPurchaseInvoices()
    res.json(invoices)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await service.getPurchaseInvoiceById(req.params.id as string)
    res.json(invoice)
  } catch (error) {
    next(error)
  }
}

export async function downloadPdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pdf = await service.generatePurchaseInvoicePdf(req.params.id as string)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-compra-${req.params.id}.pdf"`,
      'Content-Length': pdf.length,
    })
    res.send(pdf)
  } catch (error) {
    next(error)
  }
}
