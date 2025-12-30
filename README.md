# 💰 REGRIND - Financial Management System

A modern, full-stack financial management system built with Next.js 15, MongoDB, and TypeScript. Track transactions, analyze revenue trends, and gain insights into your financial data with beautiful, responsive charts and dashboards.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.19-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📊 **Dashboard**
- Real-time revenue statistics (Daily, Weekly, Monthly, Yearly)
- Interactive revenue comparison charts with profit/loss indicators
- Recent transactions overview
- Color-coded profit/loss indicators
- Auto-refresh on data changes

### 💳 **Transaction Management**
- Complete CRUD operations for transactions
- Advanced search and filtering capabilities
- Pagination support for large datasets
- Transaction types: Purchase, Sell, Bills, EMI, Miscellaneous, Other
- Incremental transaction ID generation (Format: YYYYMMDD-XXX)
- Date-based transaction organization
- Export transactions to PDF and CSV formats

### 📈 **Analytics**
- Comprehensive financial overview cards
- Expense breakdown pie chart
- Income vs Expenses bar chart
- Top 5 income and expense transactions
- Period-based analysis (Weekly, Monthly, Yearly)
- Real-time data visualization

### 🎨 **UI/UX**
- Modern, clean interface using Shadcn UI
- Fully responsive design (Mobile, Tablet, Desktop)
- Dark mode support
- Loading states and skeleton screens
- Empty states with helpful messages
- Professional color coding (Green for profit, Red for loss)

## 🚀 Tech Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Shadcn UI** - Component library
- **Recharts** - Data visualization
- **Lucide React** - Icons

### **Backend**
- **Next.js API Routes** - RESTful API
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

### **Additional Libraries**
- **jsPDF** - PDF generation
- **jspdf-autotable** - PDF table formatting
- **date-fns** - Date manipulation
- **react-day-picker** - Date picker component

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.0 or higher
- **npm** or **yarn** or **pnpm**
- **MongoDB** (Local installation or MongoDB Atlas account)
- **Git** (for version control)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/samiwasta/regrind.git
cd regrind
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/regrind?retryWrites=true&w=majority
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### MongoDB Atlas Setup (Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster
4. Click "Connect" and select "Connect your application"
5. Copy the connection string and replace `<username>`, `<password>`, and `<database-name>`
6. Whitelist your IP address in Network Access
7. Create a database user in Database Access

#### Local MongoDB Setup

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Use local connection string
MONGODB_URI=mongodb://localhost:27017/regrind
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🏗️ Project Structure

```
regrind/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analytics/            # Analytics endpoints
│   │   ├── chart-data/           # Chart data endpoints
│   │   ├── generate-transaction-id/ # ID generation
│   │   ├── stats/                # Statistics endpoints
│   │   └── transactions/         # Transaction CRUD endpoints
│   ├── analytics/                # Analytics page
│   ├── dashboard/                # Dashboard page
│   ├── transactions/             # Transactions page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Shadcn UI components
│   ├── add-transaction-modal.tsx
│   ├── edit-transaction-modal.tsx
│   ├── revenue-chart.tsx
│   ├── stats-card.tsx
│   ├── transaction-table.tsx
│   └── app-sidebar.tsx
├── lib/                          # Utility functions
│   ├── api.ts                    # API helper functions
│   ├── export-utils.ts           # PDF/CSV export utilities
│   ├── mongodb.ts                # MongoDB connection
│   └── utils.ts                  # General utilities
├── models/                       # Mongoose models
│   └── Transaction.ts            # Transaction schema
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment variables (not in git)
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── tailwind.config.ts            # Tailwind CSS configuration
```

## 📡 API Endpoints

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions (with pagination, search, filter) |
| POST | `/api/transactions` | Create a new transaction |
| GET | `/api/transactions/[id]` | Get transaction by ID |
| PUT | `/api/transactions/[id]` | Update transaction |
| DELETE | `/api/transactions/[id]` | Delete transaction |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get revenue statistics (daily, weekly, monthly, yearly) |
| GET | `/api/chart-data?period={period}` | Get chart data for specific period |
| GET | `/api/analytics?period={period}` | Get comprehensive analytics data |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/generate-transaction-id` | Generate next incremental transaction ID |

## 🎯 Usage Examples

### Creating a Transaction

```typescript
const newTransaction = {
  id: "20251004-001",
  description: "Office supplies purchase",
  date: "2025-10-04",
  amount: 5000,
  type: "purchase"
}

const response = await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newTransaction)
})

const result = await response.json()
```

### Fetching Analytics

```typescript
const response = await fetch('/api/analytics?period=monthly')
const { data } = await response.json()

// Access analytics data
console.log(data.overview.totalIncome)
console.log(data.expenseBreakdown)
console.log(data.topIncomes)
```

## 🔧 Configuration

### Next.js Configuration

```typescript
// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Remove X-Powered-By header
}
```

### MongoDB Schema

```typescript
// Transaction Schema
{
  id: String (unique, required),
  description: String (required, max 200 chars),
  date: Date (required),
  amount: Number (required, min 0.01),
  type: Enum ['purchase', 'sell', 'bills', 'emi', 'miscellaneous', 'other'],
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `NODE_ENV=production`
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/samiwasta/regrind)

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/regrind?retryWrites=true&w=majority
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://regrind.vercel.app
```

### Build for Production

```bash
npm run build
npm run start
```

## 🔒 Security Best Practices

✅ Environment variables stored in `.env.local` (not committed to Git)  
✅ MongoDB connection with connection pooling  
✅ Input validation on all API endpoints  
✅ Type safety with TypeScript  
✅ Secure headers configuration  
✅ Error handling without exposing sensitive data  

## 📊 Performance Optimizations

✅ Server-side rendering with Next.js 15  
✅ MongoDB connection caching  
✅ API route optimization  
✅ Lazy loading for charts  
✅ Pagination for large datasets  
✅ Image optimization  
✅ Tailwind CSS purging  

## 🧪 Testing

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Build test
npm run build
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Author

**Sami Wasta**
- GitHub: [@samiwasta](https://github.com/samiwasta)
- Email: samiwasta.11@gmail.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [MongoDB](https://www.mongodb.com/)
- [Vercel](https://vercel.com/)

## 📞 Support

For support, email samiwasta.11@gmail.com or create an issue in the GitHub repository.

---

Made with ❤️ using Next.js and MongoDB
