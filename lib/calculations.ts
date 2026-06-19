import { GroupType } from '@prisma/client';
export type FlatBudgetEntry = { categoryId: string; groupId: string; groupType: GroupType; groupName: string; categoryName: string; month: number; amount: number };
export function groupMonthlyTotal(entries: FlatBudgetEntry[], groupId: string, month: number) { return entries.filter(e => e.groupId === groupId && e.month === month).reduce((s,e)=>s+e.amount,0); }
export function categoryYearTotal(entries: FlatBudgetEntry[], categoryId: string) { return entries.filter(e => e.categoryId === categoryId).reduce((s,e)=>s+e.amount,0); }
export function buildMonthlySummary({entries, beginningSpendingBalance, beginningSavingsBalance}:{entries: FlatBudgetEntry[]; beginningSpendingBalance:number; beginningSavingsBalance:number}) {
  let spendingBalance = beginningSpendingBalance; let savingsBalance = beginningSavingsBalance;
  return Array.from({length:12}, (_,i) => {
    const month = i + 1;
    const income = entries.filter(e => e.month === month && e.groupType === GroupType.INCOME).reduce((s,e)=>s+e.amount,0);
    const expenses = entries.filter(e => e.month === month && e.groupType === GroupType.EXPENSE).reduce((s,e)=>s+e.amount,0);
    const savings = entries.filter(e => e.month === month && e.groupType === GroupType.SAVINGS).reduce((s,e)=>s+e.amount,0);
    const net = income - expenses - savings;
    spendingBalance += net; savingsBalance += savings;
    return { month, income, expenses, savings, net, spendingBalance, savingsBalance };
  });
}
export function yearTotals(summary: ReturnType<typeof buildMonthlySummary>) {
  return summary.reduce((a, x) => ({ income:a.income+x.income, expenses:a.expenses+x.expenses, savings:a.savings+x.savings, net:a.net+x.net, spendingBalance:x.spendingBalance, savingsBalance:x.savingsBalance }), { income:0, expenses:0, savings:0, net:0, spendingBalance:0, savingsBalance:0 });
}
