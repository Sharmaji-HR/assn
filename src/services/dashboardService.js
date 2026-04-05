const prisma = require('../config/prisma');

const getSummary = async (userId) => {
  const [totalsByType, categoryTotalsRaw, recentTransactions] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        isDeleted: false
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        isDeleted: false
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        isDeleted: false
      },
      orderBy: { date: 'desc' },
      take: 5
    })
  ]);

  const incomeRow = totalsByType.find((item) => item.type === 'INCOME');
  const expenseRow = totalsByType.find((item) => item.type === 'EXPENSE');

  const totalIncome = Number(incomeRow?._sum.amount || 0);
  const totalExpenses = Number(expenseRow?._sum.amount || 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    categoryTotals: categoryTotalsRaw.map((item) => ({
      category: item.category,
      total: Number(item._sum.amount || 0)
    })),
    recentTransactions: recentTransactions.map((item) => ({
      ...item,
      amount: Number(item.amount),
      type: item.type.toLowerCase()
    }))
  };
};

const getTrends = async (userId) => {
  const monthlyTrendRows = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "date"), 'YYYY-MM') AS month,
      SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END)::float AS income,
      SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END)::float AS expenses
    FROM "Transaction"
    WHERE "userId" = ${userId} AND "isDeleted" = false
    GROUP BY DATE_TRUNC('month', "date")
    ORDER BY DATE_TRUNC('month', "date") ASC
  `;

  return {
    monthly: (monthlyTrendRows || []).map((row) => ({
      month: row.month,
      income: Number(row.income || 0),
      expenses: Number(row.expenses || 0),
      net: Number(row.income || 0) - Number(row.expenses || 0)
    }))
  };
};

module.exports = {
  getSummary,
  getTrends
};
