# Companion Backend API

A **production-grade backend API** for the Companion travel-matching platform.  
This system supports trip creation, explorer matching, subscriptions, payments (SSLCommerz), reviews, and admin management.

---

## Table of Contents
1. Overview
2. Tech Stack
3. Architecture
4. Core Features
5. Authentication & Authorization
6. Database Schema Overview
7. API Modules
8. Payment Flow (SSLCommerz)
9. Query Builder System
10. Environment Variables
11. Setup & Installation
12. Prisma Commands
13. Deployment Guide
14. Security Considerations
15. Error Handling
16. Future Improvements

---

## 1. Overview
The Companion backend is built with scalability, security, and maintainability in mind.  
It powers a social travel-matching platform where users (Explorers) can:

- Create trips
- Match with other explorers
- Complete trips
- Leave reviews
- Upgrade subscriptions via SSLCommerz
- Be managed by Admins

---

## 2. Tech Stack

| Layer | Technology |
|------|------------|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (Access + Refresh Tokens) |
| Payments | SSLCommerz |
| Validation | Zod |
| Deployment | Vercel |
| Logging | Custom middleware |
| Security | Role-based access control |

---

## 3. Architecture

- **Controller-Service-Repository pattern**
- Centralized error handling
- Modular folder structure
- Transaction-safe database operations
- Stateless authentication

```
src/
 ├─ app/
 │  ├─ modules/
 │  │  ├─ auth/
 │  │  ├─ user/
 │  │  ├─ trip/
 │  │  ├─ match/
 │  │  ├─ review/
 │  │  ├─ subscription/
 │  │  └─ payment/
 │  ├─ middlewares/
 │  ├─ shared/
 │  └─ helpers/
 ├─ prisma/
 └─ server.ts
```

---

## 4. Core Features

### User & Explorer
- Registration & login
- Change password
- Role-based access (Admin / Explorer)
- Soft delete & permanent delete
- User status control (ACTIVE, BLOCKED, SUSPENDED)

### Trips
- Create, update, delete trips
- Public & private trip listings
- Match completion handling
- Trip status transitions

### Matching System
- Request / accept / reject / cancel matches
- Multi-match support
- Completion locking
- Match-based reviews

### Reviews
- One review per explorer per match
- Rating aggregation
- Admin moderation

### Subscriptions
- FREE / STANDARD / PREMIUM plans
- One active subscription per explorer
- Auto-expiry handling

### Payments
- SSLCommerz gateway integration
- IPN verification
- Fail & cancel handling
- Idempotent payment processing

---

## 5. Authentication & Authorization

- JWT Access Token (short-lived)
- Refresh Token (HTTP-only cookie)
- Middleware-based role enforcement
- Route-level permission control

---

## 6. Database Schema Overview

Key Models:
- User
- Explorer
- Admin
- Trip
- Match
- Review
- Subscription
- Payment

All relations are enforced with Prisma constraints and transactions.

---

## 7. API Modules

### Auth
- Login
- Refresh token
- Change password

### Users (Admin only)
- Toggle status
- Soft delete / restore
- Permanent delete
- Paginated listing

### Trips
- Public listing
- My trips
- Available trips
- Update & complete trips

### Matches
- Send request
- Accept / reject
- Cancel
- My matches
- Admin overview

### Reviews
- Create review
- My reviews
- All reviews (admin)

### Subscriptions & Payments
- Create subscription
- Verify payment (IPN)
- Cancel payment
- Fail payment

---

## 8. Payment Flow (SSLCommerz)

1. Create subscription
2. Create PENDING payment
3. Redirect user to GatewayPageURL
4. SSLCommerz redirects to:
   - success_url
   - fail_url
   - cancel_url
5. IPN hits backend
6. Payment verified
7. Subscription activated

⚠️ **IPN is the source of truth**

---

## 9. Universal Query Builder

- Pagination
- Sorting
- Filtering
- Case-insensitive search
- Works across all tables

Supports:
- Partial string search
- Exact match filters
- Date range filtering
- Relation-based filtering

---

## 10. Environment Variables

```
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
SSL_STORE_ID=
SSL_SECRET_KEY=
SSL_PAYMENT_API=
SSL_IPN_URL=
FRONTEND_URL=
NODE_ENV=
```

---

## 11. Setup & Installation

```bash
git clone <repo>
cd companion-backend
npm install
```

---

## 12. Prisma Commands

```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

---

## 13. Deployment Guide

- Backend hosted on Vercel
- Database on managed PostgreSQL
- Environment variables set in Vercel dashboard
- Webhooks publicly accessible

---

## 14. Security Considerations

- SQL injection protection via Prisma
- Token rotation
- Idempotent payment handling
- Strict permission checks
- Soft delete strategy

---

## 15. Error Handling

- Centralized global error handler
- Consistent API error format
- HTTP status enforcement
- Prisma error mapping

---

## 16. Future Improvements

- WebSocket notifications
- Admin analytics dashboard
- Rate limiting
- Audit logs
- Email notifications

---

© Companion Platform – Backend API
