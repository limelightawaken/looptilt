# Tayo Starter Kit

A production-ready full-stack starter kit with **NestJS** backend and **Next.js** frontend. Get your next project up and running in minutes with authentication, database, email, file storage, and more pre-configured.

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS 11** | Backend framework |
| **Prisma 6** | ORM & database toolkit |
| **PostgreSQL** | Database |
| **Better Auth** | Authentication system |
| **Swagger** | API documentation |
| **Nodemailer** | Email service |
| **AWS S3** | File storage |
| **Docker** | Containerization |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework (App Router) |
| **React 19** | UI library |
| **Tailwind CSS 4** | Styling |
| **shadcn/ui** | UI components |
| **TanStack Query** | Server state management |
| **tRPC** | End-to-end typesafe APIs |
| **Zustand** | Client state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Framer Motion** | Animations |
| **nuqs** | URL query state |
| **Recharts** | Charts & data visualization |

## Prerequisites

- **Node.js** 20.x or higher
- **npm** or **pnpm**
- **PostgreSQL** database (local or hosted)
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tayo-starter-kit
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env  # or create .env manually
```

Create a `.env` file in the `backend` directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tayo_starter?schema=public"

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3001
REQUIRE_EMAIL_VERIFICATION=false

# Email (SMTP) - Optional
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com

# AWS S3 Storage - Optional
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

The backend will be available at `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local  # or create .env.local manually
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

```bash
# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
tayo-starter-kit/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # Database migrations
│   │   └── schema.prisma        # Database schema
│   ├── src/
│   │   ├── common/              # Shared utilities
│   │   │   ├── database/        # Prisma database service
│   │   │   ├── dto/             # Common DTOs
│   │   │   ├── email/           # Email service
│   │   │   ├── filters/         # Exception filters
│   │   │   ├── guards/          # Auth guards & decorators
│   │   │   ├── interceptors/    # Request/response interceptors
│   │   │   ├── pipes/           # Validation pipes
│   │   │   └── storage/         # S3 storage service
│   │   ├── config/              # Configuration files
│   │   ├── modules/
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── health/          # Health check endpoints
│   │   │   └── users/           # User management
│   │   ├── app.module.ts        # Root module
│   │   └── main.ts              # Application entry point
│   ├── Dockerfile               # Docker configuration
│   └── package.json
│
└── frontend/
    ├── public/                  # Static assets
    └── src/
        ├── app/                 # Next.js App Router
        │   ├── (auth)/          # Auth pages (signin, signup, etc.)
        │   ├── (protected)/     # Protected pages (dashboard)
        │   └── api/             # API routes
        ├── lib/
        │   ├── hooks/           # Custom React hooks
        │   ├── trpc/            # tRPC client setup
        │   ├── validations/     # Zod schemas
        │   ├── api.ts           # API client
        │   ├── auth-client.ts   # Better Auth client
        │   ├── store.ts         # Zustand store
        │   └── utils.ts         # Utility functions
        └── providers/           # React context providers
```

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:debug` | Start with debugging enabled |
| `npm run start:prod` | Start production server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## API Documentation

When the backend is running, access the Swagger documentation at:

```
http://localhost:3001/api/docs
```

### Available Endpoints

#### Health Check
- `GET /api/health` - Check API health status

#### Authentication (Better Auth)
- `POST /api/auth/sign-up/email` - Register with email/password
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/get-session` - Get current session
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email address

#### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Authentication

This starter uses **Better Auth** for authentication with the following features:

- Email/password authentication
- Session-based authentication with secure cookies
- Email verification (optional, enabled in production)
- Password reset flow
- Role-based access control (USER, ADMIN)

### Frontend Usage

```tsx
import { useAuth } from "@/lib/hooks/use-auth";
import { signIn, signUp, signOut } from "@/lib/auth-client";

// In a component
const { user, isAuthenticated, isLoading, logout } = useAuth();

// Sign in
await signIn.email({ email, password });

// Sign up
await signUp.email({ email, password, name });

// Sign out
await signOut();
```

## Database

The project uses **Prisma** with **PostgreSQL**. The schema includes:

- **User** - User accounts with role-based access
- **Session** - Authentication sessions
- **Account** - OAuth and credential accounts
- **Verification** - Email verification tokens

### Prisma Studio

View and edit your database with a visual interface:

```bash
cd backend
npm run prisma:studio
```

## Adding UI Components

This project uses **shadcn/ui** for UI components. Add new components with:

```bash
cd frontend
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# etc.
```

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3001 | Server port |
| `API_PREFIX` | No | api | API route prefix |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend URL for CORS |
| `BETTER_AUTH_SECRET` | Yes | - | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | No | http://localhost:3001 | Auth base URL |
| `REQUIRE_EMAIL_VERIFICATION` | No | false | Require email verification |
| `SMTP_HOST` | No | - | SMTP server host |
| `SMTP_PORT` | No | 587 | SMTP server port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASS` | No | - | SMTP password |
| `SMTP_FROM` | No | noreply@example.com | From email address |
| `AWS_REGION` | No | us-east-1 | AWS region |
| `AWS_ACCESS_KEY_ID` | No | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | No | - | AWS secret key |
| `AWS_S3_BUCKET` | No | - | S3 bucket name |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | No | http://localhost:3001 | Backend API URL |

## Docker Deployment

### Build and run the backend with Docker:

```bash
cd backend

# Build the image
docker build -t tayo-starter-backend .

# Run the container
docker run -p 3001:3001 \
  -e DATABASE_URL="your-database-url" \
  -e BETTER_AUTH_SECRET="your-secret" \
  -e FRONTEND_URL="your-frontend-url" \
  tayo-starter-backend
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Set a strong `BETTER_AUTH_SECRET`
3. Configure production database URL
4. Enable email verification: `REQUIRE_EMAIL_VERIFICATION=true`
5. Configure SMTP for email delivery
6. Run migrations: `npm run prisma:migrate:prod`

### Frontend
1. Set `NEXT_PUBLIC_BACKEND_URL` to your production backend URL
2. Build: `npm run build`
3. Deploy to Vercel, or run: `npm run start`

## Features Overview

- ✅ Authentication (signup, signin, signout, password reset)
- ✅ Email verification
- ✅ Role-based access control
- ✅ Protected routes
- ✅ API documentation (Swagger)
- ✅ Database ORM (Prisma)
- ✅ Email service (Nodemailer)
- ✅ File storage (AWS S3)
- ✅ Form validation (Zod + React Hook Form)
- ✅ State management (Zustand + TanStack Query)
- ✅ tRPC integration
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Docker support
- ✅ TypeScript throughout

## License

MIT

