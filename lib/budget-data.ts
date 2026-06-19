import { prisma } from '@/lib/db';
import type { FlatBudgetEntry } from '@/lib/calculations';
export async function loadBudgetData(budgetYearId: string) {
  const budgetYear = await prisma.budgetYear.findUniqueOrThrow({ where: { id: budgetYearId }, include: { groups: { where: { archived: false }, orderBy: { sortOrder: 'asc' }, include: { categories: { orderBy: { sortOrder: 'asc' } } } }, entries: { include: { category: { include: { group: true } } } } } });
  const entries: FlatBudgetEntry[] = budgetYear.entries.map(e => ({ categoryId: e.categoryId, groupId: e.category.group.id, groupType: e.category.group.type, groupName: e.category.group.name, categoryName: e.category.name, month: e.month, amount: Number(e.amount) }));
  return { budgetYear, groups: budgetYear.groups, entries };
}
