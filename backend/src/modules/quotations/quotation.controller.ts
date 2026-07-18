import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import { generateQuotationPdf } from './quotation.service.js'

export async function generate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pdf = await generateQuotationPdf(req.body)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${Date.now()}.pdf"`,
      'Content-Length': pdf.length,
    })
    res.send(pdf)
  } catch (error) {
    next(error)
  }
}
