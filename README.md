# Family Budget Pro

Ứng dụng web chuyên nghiệp để quản lý ngân sách gia đình dựa trên biểu mẫu Excel Family Budget Planner.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- NextAuth/Auth.js Credentials
- Tailwind CSS
- Recharts
- SheetJS `xlsx`

## Chức năng đã có

- Đăng nhập bằng email/password.
- Tạo tài khoản đầu tiên và household đầu tiên.
- Quản lý nhiều năm ngân sách.
- Bảng ngân sách Jan-Dec giống Excel.
- Nhóm thu nhập, chi phí, tiết kiệm.
- Tự tính Income, Expenses, Savings, Net, Spending Balance, Savings Balance.
- Dashboard KPI.
- Biểu đồ Income/Expenses/Savings, Balance, Expense Mix.
- Quản lý danh mục.
- Nhập giao dịch thực tế để mở rộng Budget vs Actual.
- Export Excel.
- Import Excel qua API `POST /api/import/[budgetYearId]`.
- Dockerfile và docker-compose để self-host.

## Chạy local bằng PostgreSQL Docker

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Mở `http://localhost:3000`.

Tài khoản seed mặc định:

```text
admin@example.com / ChangeMe123!
```

Có thể đổi bằng biến môi trường `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`, `SEED_USER_NAME` trước khi chạy seed.

## Deploy lên Vercel + Supabase/Neon/Postgres

1. Tạo PostgreSQL database trên Supabase, Neon hoặc Render Postgres.
2. Lấy PostgreSQL connection string.
3. Push source code lên GitHub.
4. Import repository vào Vercel.
5. Thêm Environment Variables:

```text
DATABASE_URL=postgresql://...
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://your-domain.vercel.app
```

6. Chạy migration production:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Self-host bằng Docker/Coolify

Dùng `Dockerfile` và `docker-compose.yml` có sẵn. Với Coolify hoặc server riêng:

1. Tạo PostgreSQL service.
2. Tạo app từ GitHub repository.
3. Chọn Dockerfile build.
4. Cấu hình `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`.
5. Deploy.

## Kiến trúc dữ liệu

- `User`: người dùng.
- `Household`: gia đình/nhóm dùng chung ngân sách.
- `HouseholdMember`: thành viên và vai trò.
- `BudgetYear`: ngân sách theo năm.
- `CategoryGroup`: nhóm ngân sách như INCOME, HOME EXPENSES.
- `Category`: khoản mục con.
- `BudgetEntry`: số tiền kế hoạch theo tháng.
- `Transaction`: giao dịch thực tế.
- `AuditLog`: nền tảng cho kiểm toán thay đổi.

## Giai đoạn nâng cấp tiếp theo

- UI mời thành viên qua email.
- Reset mật khẩu.
- Budget vs Actual đầy đủ.
- Import sao kê ngân hàng CSV.
- OCR hóa đơn.
- AI phân loại giao dịch.
- Backup định kỳ sang object storage.
