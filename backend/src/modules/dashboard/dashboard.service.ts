import { Sale } from '../sales/sale.model.js'
import { Product } from '../products/product.model.js'
import { Income } from '../finance/income.model.js'
import { Expense } from '../finance/expense.model.js'

function startOfDay(date: Date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date: Date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date = new Date()) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getDashboard(userId: string, role: string) {
  const now = new Date()
  const dayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const saleBaseQuery: Record<string, unknown> = { status: 'completed' }
  if (role === 'employee') {
    saleBaseQuery.employeeId = userId
  }

  const [todaySales, weekSales, monthSales, lowStockProducts, topProducts, incomeVsExpense, recentSales] =
    await Promise.all([
      Sale.aggregate([
        { $match: { ...saleBaseQuery, date: { $gte: dayStart } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),

      Sale.aggregate([
        { $match: { ...saleBaseQuery, date: { $gte: weekStart } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),

      Sale.aggregate([
        { $match: { ...saleBaseQuery, date: { $gte: monthStart } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),

      Product.find({
        active: true,
        $expr: { $lte: ['$stockQuantity', '$minStock'] },
      }).sort({ stockQuantity: 1 }).limit(10).lean(),

      Sale.aggregate([
        { $match: { ...saleBaseQuery, date: { $gte: monthStart } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { name: '$items.productName', id: '$items.productId' },
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]),

      (async () => {
        const [incomeResult, expenseResult] = await Promise.all([
          Income.aggregate([
            { $match: { date: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          Expense.aggregate([
            { $match: { date: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ])
        return {
          income: incomeResult[0]?.total ?? 0,
          expense: expenseResult[0]?.total ?? 0,
        }
      })(),

      Sale.find(saleBaseQuery)
        .sort({ date: -1 })
        .limit(5)
        .populate('employeeId', 'fullName')
        .lean(),
    ])

  return {
    today: {
      count: todaySales[0]?.count ?? 0,
      total: todaySales[0]?.total ?? 0,
    },
    week: {
      count: weekSales[0]?.count ?? 0,
      total: weekSales[0]?.total ?? 0,
    },
    month: {
      count: monthSales[0]?.count ?? 0,
      total: monthSales[0]?.total ?? 0,
    },
    lowStockProducts,
    topProducts: topProducts.map(p => ({
      productId: p._id.id,
      productName: p._id.name,
      totalQuantity: p.totalQuantity,
      totalRevenue: p.totalRevenue,
    })),
    incomeVsExpense,
    recentSales,
  }
}
