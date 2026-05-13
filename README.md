      # ⚙️ Planora Backend API

This is the core RESTful API that powers the Planora Event Management System. It handles data persistence, authentication, business logic, and third-party integrations.

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Zod (if used)

## 🏗️ Core Features & Architecture
- **JWT Authentication:** Secure user sessions and role-based permissions (Admin/User).
- **Relational Data Mapping:** Optimized PostgreSQL schema with complex relations (Events, Participants, Invitations, Payments).
- **Payment Workflow:** Server-side logic for SSLCommerz/Stripe transaction validation.
- **Error Handling:** Centralized error handling and standardized API responses.
- **Indexing:** Efficient query performance using database indexes on slugs and user IDs.

## 📡 API Endpoints (Brief)
### Auth
- `POST /api/v1/auth/register` - User Registration
- `POST /api/v1/auth/login` - User Login

### Events
- `GET /api/v1/events` - Get all public events (with filters)
- `POST /api/v1/events/create` - Create a new event (Private/Public)
- `PATCH /api/v1/events/:id` - Update event details

### Participations & Payments
- `POST /api/v1/participations/join` - Join an event request
- `POST /api/v1/payments/init` - Initialize payment gateway

## 🚀 Local Installation
1. **Clone & Install:**
   ```bash
   git clone [https://github.com/muhiburmahin/planora_backend.git](https://github.com/muhiburmahin/planora_backend.git)
   npm install
