# Amani School System

<p align="center">
  <img src="https://via.placeholder.com/150x50/3d9267/ffffff?text=AMANI" alt="Amani Logo" />
</p>

<p align="center">
  <strong>The Operating System for Private Schools in Uganda</strong>
</p>

---

## Vision

To become the trusted digital infrastructure that powers education in Uganda. Amani exists to be the system schools rely on every day, invisible when working well, indispensable when missing.

---

## Mission

To remove operational and financial burden from schools by providing a simple, reliable, all-in-one operating system that schools mandate and trust.

---

## Product Overview

Amani is a full-stack school operating system designed for private schools in Uganda. It replaces fragmented, manual, and stressful school operations with one, unified digital platform used by school owners, administrators, teachers, parents, students, alumni, and school saccos.

### Core Modules

- **Admissions & Student Records** - Digital student management
- **School Fees & Payments** - Centralized payment processing with 2% transaction fee
- **Academic Records & Reporting** - Grade management and reports
- **Parent-School Communication** - Announcements and messaging
- **Real-time Dashboards** - Full visibility for school owners
- **School Sacco** - Savings and loans for teachers, staff, and alumni

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Validation**: Zod

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Charts**: Recharts

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd amani-school-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit .env with your database credentials
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Set up database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1

---

## Project Structure

```
amani-school-system/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/            # API routes
│   │   └── index.ts           # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/         # React contexts
│   │   ├── lib/              # Utilities and API
│   │   ├── pages/            # Page components
│   │   ├── App.tsx           # Main app
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── package.json              # Root package.json
├── tsconfig.json
└── README.md
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Schools
- `GET /api/v1/schools` - List schools
- `POST /api/v1/schools` - Create school
- `GET /api/v1/schools/:id` - Get school
- `PUT /api/v1/schools/:id` - Update school
- `GET /api/v1/schools/:id/stats` - Get statistics

### Students
- `GET /api/v1/students` - List students
- `POST /api/v1/students` - Create student
- `GET /api/v1/students/:id` - Get student
- `PUT /api/v1/students/:id` - Update student
- `GET /api/v1/students/:id/fees` - Get student fees

### Payments
- `GET /api/v1/payments` - List payments
- `POST /api/v1/payments` - Create payment
- `POST /api/v1/payments/:id/refund` - Refund payment

### Fees
- `GET /api/v1/fees` - List fee structures
- `POST /api/v1/fees` - Create fee structure
- `POST /api/v1/fees/:id/assign` - Assign to students

### Academics
- `GET /api/v1/academics/classes` - List classes
- `GET /api/v1/academics/subjects` - List subjects
- `GET /api/v1/academics/terms` - List terms
- `POST /api/v1/academics/records` - Record marks

### Sacco
- `GET /api/v1/sacco/members` - List members
- `POST /api/v1/sacco/members` - Register member
- `POST /api/v1/sacco/transactions` - Create transaction
- `POST /api/v1/sacco/loans` - Apply for loan

### Dashboard
- `GET /api/v1/dashboard/summary` - Dashboard summary
- `GET /api/v1/dashboard/finances` - Financial overview
- `GET /api/v1/dashboard/academics` - Academic overview
- `GET /api/v1/dashboard/sacco` - Sacco overview
- `GET /api/v1/dashboard/activity` - Recent activity

---

## Monetization

Based on the business plan:

- **Per Student Fee**: UGX 5,000 per term
- **Transaction Fee**: 2% on all payments
- Paid by parents through school fees
- Revenue scales with enrollment

---

## Competitive Advantages

1. **End-to-End Operational Lock-In** - Deep integration into daily school workflows
2. **Financial Lock-In** - Accumulated financial records that are hard to migrate
3. **Mandatory Usage Model** - Adopted by school, mandated for all stakeholders
4. **Trust as Infrastructure** - Reliability over innovation
5. **Unified System** - One platform vs fragmented competitors

---

## License

Copyright © 2024 Orun Technologies LLP. All rights reserved.

---

## Contact

- **Email**: info@oruntechnologies.com
- **Website**: https://amani.ug
