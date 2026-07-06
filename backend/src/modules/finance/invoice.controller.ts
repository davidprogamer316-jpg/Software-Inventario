import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as invoiceService from './invoice.service.js'

export async function createFromSale(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.createInvoiceFromSale(
      req.body.saleId,
      req.user!.id,
      req.body
    )
    res.status(201).json(invoice)
  } catch (error) {
    next(error)
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoices = await invoiceService.listInvoices(req.query as any)
    res.json(invoices)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id as string)
    res.json(invoice)
  } catch (error) {
    next(error)
  }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reason } = req.body
    const invoice = await invoiceService.cancelInvoice(req.params.id as string, reason)
    res.json(invoice)
  } catch (error) {
    next(error)
  }
}

export async function downloadPdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pdf = await invoiceService.generateInvoicePdf(req.params.id as string)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${req.params.id}.pdf"`,
      'Content-Length': pdf.length,
    })
    res.send(pdf)
  } catch (error) {
    next(error)
  }
}
