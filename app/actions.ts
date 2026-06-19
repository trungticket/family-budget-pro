use server';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { GroupType, HouseholdRole, TransactionType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { parseAmount } from '@/lib/format';
const groupSeeds = [
  ['INCOME', GroupType.INCOME, ['Wages & Tips','Interest Income','Dividends','Gifts Received','Refunds/Reimbursements','Other','Transfer From Savings']],
  ['SAVINGS EXPENSE', GroupType.SAVINGS, ['Emergency Fund','Retirement','Investments','College Savings','Other Savings','Adjustment to Savings']],
  ['HOME EXPENSES', GroupType.EXPENSE, ['Mortgage/Rent','Electricity','Gas/Oil','Water/Sewer/Trash','Phone','Cable/Satellite','Internet','Furnishings/Appliances','Lawn/Garden','Home Supplies','Maintenance','Improvements','Other']],
  ['DAILY LIVING', GroupType.EXPENSE, ['Groceries','Dining Out','Personal Supplies','Clothing','Laundry/Dry Cleaning','Salon/Barber','Other']],
  ['CHILDREN', GroupType.EXPENSE, ['Childcare','School Supplies','Activities','Allowance','Clothing','Medical','Other']],
  ['TRANSPORTATION', GroupType.EXPENSE, ['Fuel','Maintenance','Parking/Tolls','Public Transport','Vehicle Payment','Registration','Other']],
  ['HEALTH', GroupType.EXPENSE, ['Doctor','Dentist','Medicine','Gym/Fitness','Vision','Other']],
  ['INSURANCE', GroupType.EXPENSE, ['Health Insurance','Life Insurance','Auto Insurance','Home/Renters Insurance','Other']],
  ['EDUCATION', GroupType.EXPENSE, ['Tuition','Books','Courses','Software','Other']],
  ['CHARITY/GIFTS', GroupType.EXPENSE, ['Charity','Religious Giving','Gifts','Other']],
  ['OBLIGATIONS', GroupType.EXPENSE, ['Credit Card','Student Loan','Personal Loan','Taxes','Other']],
  ['BUSINESS EXPENSE', GroupType.EXPENSE, ['Office Supplies','Travel','Meals','Software','Other']],
  ['ENTERTAINMENT', GroupType.EXPENSE, ['Movies','Events','Games','Hobbies','Other']],
  ['PETS', GroupType.EXPENSE, ['Food','Vet','Grooming','Supplies','Other']],
  ['SUBSCRIPTIONS', GroupType.EXPENSE, ['Streaming','Cloud Storage','News','Apps','Other']],
  ['VACATION', GroupType.EXPENSE, ['Travel','Hotel','Food','Activities','Other']]
] as const;
async function userId() { const session = await auth(); if (!session?.user?.id) throw new Error('Unauthorized'); return session.user.id; }
async function seedBudgetYear(budgetYearId: string) { for (const [i, [name, type, categories]] of groupSeeds.entries()) { const group = await prisma.categoryGroup.create({ data: { budgetYearId, name, type, sortOrder: i+1 } }); for (const [j, c] of categories.entries()) await prisma.category.create({ data: { categoryGroupId: group.id, name: c, sortOrder: j+1 } }); } }
export async function registerUser(formData: FormData) {
  const email = String(formData.get('email')); const password = String(formData.get('password')); const name = String(formData.get('name')); const householdName = String(formData.get('householdName') || 'My Family');
  if (await prisma.user.findUnique({ where: { email } })) throw new Error('Email already exists');
  const user = await prisma.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 12) } });
  const household = await prisma.household.create({ data: { name: householdName } });
  await prisma.householdMember.create({ data: { householdId: household.id, userId: user.id, role: HouseholdRole.OWNER } });
  const budgetYear = await prisma.budgetYear.create({ data: { householdId: household.id, year: new Date().getFullYear(), currency: 'VND' } });
  await seedBudgetYear(budgetYear.id); redirect('/login');
}
export async function createBudgetYear(formData: FormData) {
  const uid = await userId(); const householdId = String(formData.get('householdId'));
  const member = await prisma.householdMember.findFirst({ where: { householdId, userId: uid } }); if (!member) throw new Error('Forbidden');
  const b = await prisma.budgetYear.create({ data: { householdId, year: Number(formData.get('year')), currency: String(formData.get('currency') || 'VND'), beginningSpendingBalance: parseAmount(formData.get('beginningSpendingBalance')), beginningSavingsBalance: parseAmount(formData.get('beginningSavingsBalance')) } });
  await seedBudgetYear(b.id); redirect(`/budget/${b.id}`);
}
export async function updateBudgetEntry(formData: FormData) {
  await userId(); const budgetYearId = String(formData.get('budgetYearId')); const categoryId = String(formData.get('categoryId')); const month = Number(formData.get('month'));
  await prisma.budgetEntry.upsert({ where: { budgetYearId_categoryId_month: { budgetYearId, categoryId, month } }, update: { amount: parseAmount(formData.get('amount')) }, create: { budgetYearId, categoryId, month, amount: parseAmount(formData.get('amount')) } });
  revalidatePath(`/budget/${budgetYearId}`); revalidatePath(`/reports/${budgetYearId}`);
}
export async function updateBudgetSettings(formData: FormData) {
  await userId(); const budgetYearId = String(formData.get('budgetYearId'));
  await prisma.budgetYear.update({ where: { id: budgetYearId }, data: { year: Number(formData.get('year')), currency: String(formData.get('currency') || 'VND'), beginningSpendingBalance: parseAmount(formData.get('beginningSpendingBalance')), beginningSavingsBalance: parseAmount(formData.get('beginningSavingsBalance')) } });
  revalidatePath(`/settings/${budgetYearId}`); revalidatePath(`/budget/${budgetYearId}`);
}
export async function addCategory(formData: FormData) { await userId(); const budgetYearId=String(formData.get('budgetYearId')); const categoryGroupId=String(formData.get('categoryGroupId')); const name=String(formData.get('name')||'').trim(); if(!name)return; const max=await prisma.category.aggregate({where:{categoryGroupId},_max:{sortOrder:true}}); await prisma.category.create({data:{categoryGroupId,name,sortOrder:(max._max.sortOrder??0)+1}}); revalidatePath(`/settings/${budgetYearId}`); revalidatePath(`/budget/${budgetYearId}`); }
export async function archiveCategory(formData: FormData) { await userId(); const budgetYearId=String(formData.get('budgetYearId')); await prisma.category.update({ where: { id: String(formData.get('categoryId')) }, data: { archived: true } }); revalidatePath(`/settings/${budgetYearId}`); revalidatePath(`/budget/${budgetYearId}`); }
export async function addTransaction(formData: FormData) { const uid=await userId(); const budgetYearId=String(formData.get('budgetYearId')); const date=new Date(String(formData.get('date'))); await prisma.transaction.create({data:{budgetYearId, categoryId: String(formData.get('categoryId')||'') || null, type: String(formData.get('type')) as TransactionType, date, month: date.getMonth()+1, amount: parseAmount(formData.get('amount')), description: String(formData.get('description')||'Transaction'), vendor: String(formData.get('vendor')||''), note: String(formData.get('note')||''), createdById: uid}}); revalidatePath(`/transactions/${budgetYearId}`); }
