# Soma Capital – Technical Assessment

A Next.js todo app with task dependencies, due dates, and Pexels image previews.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Prisma
- **Styling**: Tailwind CSS + shadcn/ui (dark theme, Vercel-style)
- **Graph**: React Flow

## Key commands
```bash
npm run dev          # start dev server
npx prisma studio    # browse the database
npx prisma migrate dev --name <name>  # create a migration
```

## Environment
Create `.env.local` with:
```
PEXELS_API_KEY=your_key_here
```
Get a free key at [pexels.com/api](https://www.pexels.com/api/).

## Structure
- `app/` — pages and API routes
- `app/components/` — UI components (TodoCard, TodoForm, DependencyGraph, Nav, DatePicker)
- `app/lib/todos.ts` — critical path and earliest-start calculation
- `components/ui/` — shadcn primitives (Button, Calendar, Popover, Select)
- `prisma/schema.prisma` — Todo + TodoDependency models
