# Developer Playbook

Welcome to the Loopra development team! This guide covers our architecture, tools, and best practices.

## 1. Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS + Shadcn UI
- **Emails:** React Email + Resend
- **Payments:** Flutterwave

## 2. Local Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Copy `.env.local.example` to `.env.local` and fill in the required keys.
4. Run `npm run db:push` to sync the Prisma schema with your local database.
5. Run `npm run dev` to start the development server. (Note: use `http://127.0.0.1:3000` to avoid IPv6 resolution delays on Windows).

## 3. Project Structure
- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable React components.
  - `components/ui/`: Primitive UI components (buttons, inputs).
  - `components/layout/`: Layout components (sidebar, navigation).
- `lib/`: Utility functions, database configuration, and NextAuth setup.
- `prisma/`: Prisma schema and migration files.
- `tokens/`: Design system CSS variables.

## 4. Database Migrations
When you change `prisma/schema.prisma`:
1. Run `npm run db:generate` to update the Prisma Client.
2. Run `npm run db:push` for local prototyping.
3. Run `npm run db:migrate` when creating a formal migration for production.

## 5. Adding New Components
Use our skills and workflows to quickly scaffold components. Refer to `.agents/workflows/new-component.md` for our automated component generation playbook.
