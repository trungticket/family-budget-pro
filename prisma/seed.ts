import { PrismaClient, GroupType, HouseholdRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
export const groupSeeds = [
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
async function seedBudgetYear(budgetYearId: string) {
  for (const [i, [name, type, categories]] of groupSeeds.entries()) {
    const group = await prisma.categoryGroup.create({ data: { budgetYearId, name, type, sortOrder: i + 1 } });
    for (const [j, category] of categories.entries()) await prisma.category.create({ data: { categoryGroupId: group.id, name: category, sortOrder: j + 1 } });
  }
}
async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_USER_PASSWORD ?? 'ChangeMe123!';
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: process.env.SEED_USER_NAME ?? 'Admin', passwordHash: await bcrypt.hash(password, 12) } });
  let household = await prisma.household.findFirst({ where: { members: { some: { userId: user.id } } } });
  if (!household) {
    household = await prisma.household.create({ data: { name: 'Family Household' } });
    await prisma.householdMember.create({ data: { userId: user.id, householdId: household.id, role: HouseholdRole.OWNER } });
  }
  const year = new Date().getFullYear();
  const existing = await prisma.budgetYear.findUnique({ where: { householdId_year: { householdId: household.id, year } } });
  if (!existing) {
    const budgetYear = await prisma.budgetYear.create({ data: { householdId: household.id, year, currency: 'VND' } });
    await seedBudgetYear(budgetYear.id);
  }
  console.log(`Seeded ${email} / ${password}`);
}
main().finally(() => prisma.$disconnect());
