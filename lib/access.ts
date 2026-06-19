import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
export async function requireUser() { const session = await auth(); if (!session?.user?.id) redirect('/login'); return session.user; }
export async function requireBudgetAccess(budgetYearId: string) {
  const user = await requireUser();
  const budgetYear = await prisma.budgetYear.findFirst({ where: { id: budgetYearId, household: { members: { some: { userId: user.id } } } }, include: { household: true } });
  if (!budgetYear) redirect('/');
  return { user, budgetYear };
}
