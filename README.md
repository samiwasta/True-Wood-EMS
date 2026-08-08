# True Wood EMS

A modern Employee Management System for True Wood, built with Next.js, Supabase, and TypeScript. Manage employees, attendance, timesheets, work sites, reports, and inventory from one place.

## Features

### Dashboard
- Overview of key workforce activity
- Upcoming leaves (consecutive days grouped with total day counts)
- Upcoming holidays and quick actions

### Employees
- Employee directory with search
- Categories, departments, salary and employment history
- Food allowance and related employee settings

### Attendance
- Daily attendance tracking
- Leave marking by date
- Work site and schedule-aware defaults

### Timesheet
- Timesheet views with overtime and holiday rules
- Export support (PDF / spreadsheet tooling available in the stack)

### Reports
- Monthly and yearly reporting views
- Attendance and workforce reporting utilities

### Work Sites
- Work site management with scheduled times
- Short names and site history support

### Inventory (password protected)

- **Compare** — search materials by name with debounced suggestions; compare vendor quotes sorted by lowest total
- **Items** — materials with photo, unit, category, activate/deactivate
- **Categories** — organize items; filter items by category tabs
- **Vendors** — supplier CRUD with search and active status
- **Vendor Mapping** — unit price, GST %, fixed transportation; pricing formula:

```text
subtotal       = unit_price × quantity
gst_amount     = subtotal × (gst_percent / 100)
transportation = fixed charge
total          = subtotal + gst_amount + transportation
```

### Settings
- Categories, departments, leave types
- Weekly offs and holidays

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, Shadcn UI |
| Database / Backend | Supabase (Postgres + Storage) |
| Tables / Charts | TanStack Table, Recharts |
| Dates | date-fns |
| Icons | Lucide React |

## Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project
- Git

## Installation

### 1. Clone

```bash
git clone https://github.com/samiwasta/true-wood-ems.git
cd true-wood-ems
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database migrations

SQL migrations live in `migrations/`. Run them in the Supabase SQL Editor (in order for a new project, or only the new ones for upgrades).

Inventory-related migrations:

| File | Purpose |
|------|---------|
| `migrations/add_inventory_tables.sql` | `materials`, `vendors`, `vendor_materials` + storage bucket |
| `migrations/add_material_photo.sql` | `materials.photo_url` + `material-photos` storage (if not already applied) |
| `migrations/add_material_categories.sql` | `material_categories` + `materials.category_id` |

Other migrations cover employment history, salary history, food allowance, work site times, leave types, attendance fields, and related fixes.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run format       # Prettier format
```

## Project Structure

```text
True-Wood-EMS/
├── app/                      # Next.js App Router pages
│   ├── dashboard/
│   ├── employees/
│   ├── attendance/
│   ├── timesheet/
│   ├── reports/
│   ├── work-sites/
│   ├── inventory/
│   └── settings/
├── components/               # UI and feature components
│   ├── inventory/
│   ├── attendance/
│   ├── employees/
│   ├── settings/
│   ├── ui/                   # Shadcn primitives
│   └── app-sidebar.tsx
├── lib/
│   ├── hooks/                # React data hooks
│   ├── models/               # TypeScript models
│   ├── services/             # Supabase data services
│   └── utils/
├── migrations/               # Hand-run Supabase SQL migrations
├── public/
├── package.json
└── README.md
```

## Architecture Notes

- Client pages call static service classes in `lib/services/`, which talk to Supabase with the anon key.
- Hooks in `lib/hooks/` wrap fetch/create/update/delete and refetch after mutations.
- Inventory photos use the public Supabase Storage bucket `material-photos`.
- Inventory access is gated in the UI with a session unlock (`sessionStorage`); this is not a full auth system.

## Deployment

### Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy

Production build:

```bash
npm run build
npm run start
```

## License

MIT

## Author

**Sami Wasta**
- GitHub: [samiwasta](https://github.com/samiwasta)
- Email: samiwasta.11@gmail.com

## Support

For support, email samiwasta.11@gmail.com or open an issue on [GitHub](https://github.com/samiwasta/true-wood-ems/issues).
